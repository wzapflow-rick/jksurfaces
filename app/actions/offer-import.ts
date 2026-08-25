"use server"

import { revalidatePath } from "next/cache"
import {
  cleanUrl,
  isOlxUrl,
  parseOlxAd,
  type OfferCondition,
  type ParsedAd,
} from "@/lib/sources/olx-import-parser"
import { importOffer, type OfferImportResult } from "@/lib/services/offer-import-service"
import { repo } from "@/lib/services/repository"
import type { FieldOrigin } from "@/types"

/**
 * SERVER ACTIONS DA IMPORTAÇÃO INTELIGENTE — Fase 6.3.
 *
 * Duas responsabilidades:
 *  1) `analyzeAdAction`: transforma URL/texto em dados estruturados. Para URL,
 *     TENTA uma única leitura pública e degrada com elegância se não conseguir
 *     — sem nunca contornar Cloudflare, CAPTCHA, autenticação ou proxies.
 *  2) `importOfferAction`: persiste a oferta revisada (SourceOffer), com dedupe
 *     por URL e histórico de preço. Nunca cria oportunidade automaticamente.
 */

export interface AnalyzeResult {
  ok: boolean
  parsed?: ParsedAd
  /** true quando a URL não pôde ser lida automaticamente (degradação prevista). */
  autoReadFailed?: boolean
  /** true quando a URL informada não é da OLX (apenas informativo). */
  notOlx?: boolean
  error?: string
}

/** Timeout curto para a leitura pública. Uma única tentativa, sem retries. */
const FETCH_TIMEOUT_MS = 7000

/**
 * Tenta obter texto público de uma URL com UMA requisição GET simples. Não usa
 * cookies, autenticação, proxies nem qualquer técnica de evasão. Se a resposta
 * não for 2xx (ex.: 403 do Cloudflare), retorna null — degradação prevista.
 */
async function fetchPublicText(url: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml",
        "accept-language": "pt-BR,pt;q=0.9",
      },
    })
    if (!res.ok) return null
    const contentType = res.headers.get("content-type") ?? ""
    if (!contentType.includes("text/html") && !contentType.includes("application/json")) return null
    const html = await res.text()
    return extractReadableText(html)
  } catch {
    // Timeout, DNS, rede, bloqueio — qualquer falha degrada para "não lido".
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Extrai texto legível de um HTML público SEM contornar proteções: usa apenas o
 * que a página entregou (JSON-LD de produto, metatags og: e o <title>). Se nada
 * útil aparecer, retorna string vazia (tratado como não legível).
 */
function extractReadableText(html: string): string {
  const parts: string[] = []

  // JSON-LD (schema.org Product) — quando presente, é a fonte mais confiável.
  const ldMatches = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )
  for (const m of ldMatches) {
    try {
      const data = JSON.parse(m[1].trim())
      const nodes = Array.isArray(data) ? data : [data]
      for (const node of nodes) {
        if (node?.name) parts.push(String(node.name))
        if (node?.description) parts.push(String(node.description))
        const price = node?.offers?.price ?? node?.offers?.lowPrice
        if (price) parts.push(`R$ ${price}`)
      }
    } catch {
      /* JSON inválido: ignora este bloco. */
    }
  }

  const og = (prop: string) =>
    html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"))?.[1]
  const title = og("og:title") ?? html.match(/<title>([^<]+)<\/title>/i)?.[1]
  const desc = og("og:description")
  if (title) parts.unshift(title)
  if (desc) parts.push(desc)

  return parts.join("\n").trim()
}

/**
 * Analisa uma entrada de importação. Aceita texto e/ou URL. Para URL sem texto,
 * tenta a leitura pública única; se falhar, sinaliza `autoReadFailed` para a UI
 * oferecer "colar texto" ou "preencher manualmente" — preservando a URL.
 */
export async function analyzeAdAction(input: {
  text?: string
  url?: string
}): Promise<AnalyzeResult> {
  const url = cleanUrl(input.url)
  const text = (input.text ?? "").trim()

  if (!text && !url) {
    return { ok: false, error: "Cole o link ou o texto do anúncio para importar." }
  }

  const notOlx = Boolean(url && !isOlxUrl(url))

  // Se não há texto mas há URL, tenta ler publicamente (uma vez).
  if (!text && url) {
    const fetched = await fetchPublicText(url)
    if (!fetched) {
      // Degradação prevista: preserva a URL e devolve um parse "vazio" com ela.
      return {
        ok: true,
        autoReadFailed: true,
        notOlx,
        parsed: parseOlxAd({ text: "", url }),
      }
    }
    return { ok: true, notOlx, parsed: parseOlxAd({ text: fetched, url }) }
  }

  return { ok: true, notOlx, parsed: parseOlxAd({ text, url: url ?? undefined }) }
}

export interface ImportActionInput {
  source: string
  url: string | null
  productTitle: string
  brand: string | null
  sku: string | null
  ean: string | null
  price: number
  quantity: number
  unitPrice: number
  isLot: boolean
  condition: OfferCondition
  priceNegotiable: boolean
  location: string | null
  shipping: number | null
  notes: string | null
  fieldOrigins: Record<string, FieldOrigin> | null
}

export interface ImportActionResult {
  ok: boolean
  offerId?: string
  created?: boolean
  priceChange?: OfferImportResult["priceChange"]
  error?: string
}

/**
 * Persiste a oferta revisada. Validação mínima server-side: título e preço
 * unitário positivos. Não cria oportunidade — isso é feito só no Radar.
 */
export async function importOfferAction(input: ImportActionInput): Promise<ImportActionResult> {
  const productTitle = input.productTitle?.trim()
  if (!productTitle) {
    return { ok: false, error: "Informe o nome do produto antes de importar." }
  }
  if (!Number.isFinite(input.unitPrice) || input.unitPrice <= 0) {
    return { ok: false, error: "Informe um preço unitário válido." }
  }
  const quantity = Number.isFinite(input.quantity) && input.quantity >= 1 ? Math.floor(input.quantity) : 1

  try {
    const result = await importOffer({
      source: input.source || "OLX",
      url: cleanUrl(input.url),
      productTitle,
      brand: nullify(input.brand),
      sku: nullify(input.sku),
      ean: nullify(input.ean),
      price: input.price > 0 ? input.price : input.unitPrice * quantity,
      quantity,
      unitPrice: input.unitPrice,
      isLot: quantity > 1,
      condition: input.condition ?? "UNKNOWN",
      priceNegotiable: Boolean(input.priceNegotiable),
      location: nullify(input.location),
      shipping: input.shipping === null || input.shipping === undefined ? null : input.shipping,
      notes: nullify(input.notes),
      fieldOrigins: input.fieldOrigins,
    })
    revalidatePath("/ofertas")
    return {
      ok: true,
      offerId: result.offer.id,
      created: result.created,
      priceChange: result.priceChange,
    }
  } catch (error) {
    console.log("[v0] importOfferAction error:", error)
    return { ok: false, error: "Não foi possível importar a oferta agora. Tente novamente." }
  }
}

function nullify(value: string | null | undefined): string | null {
  const t = (value ?? "").trim()
  return t === "" ? null : t
}
