import "server-only"
import type { OfferSource, Product } from "@/types"
import type { NormalizedOffer } from "@/lib/sources/types"
import {
  matchOfferToProduct,
  type MatchCandidate,
  type OfferMatchResult,
} from "@/lib/calculations/offer-matching"
import { round2 } from "@/lib/calculations/pricing"
import { unitPrice } from "@/lib/sources/olx-parsers"
import {
  isOlxUrl,
  parseOlxListingText,
  type ImportCondition,
  type OlxImportParseResult,
} from "@/lib/sources/olx-import-parser"
import { repo } from "./repository"
import { persistImportedOffer, type PersistOfferResult } from "./source-capture-service"

/**
 * SERVIÇO DE IMPORTAÇÃO INTELIGENTE DE ANÚNCIOS OLX — Fase 6.3.
 *
 * Orquestra: (opcional) leitura de conteúdo PÚBLICO da URL -> parsing
 * determinístico -> matching com produtos JK -> (na confirmação) persistência
 * como SOURCE OFFER reutilizando o pipeline da Fase 6.1.
 *
 * REGRAS DE SEGURANÇA (seção 24): a leitura por URL é uma ÚNICA tentativa de
 * acesso público simples, com timeout curto e sem qualquer evasão. Nunca
 * contornamos Cloudflare/CAPTCHA, nunca autenticamos, nunca guardamos cookies.
 * Se o conteúdo público não puder ser lido (o caso real da OLX, atrás do
 * Cloudflare), degradamos com elegância: a URL é PRESERVADA e o usuário segue
 * por texto colado ou preenchimento manual.
 */

/** Produto associado, em formato mínimo para a UI de revisão. */
export interface MatchedProductSummary {
  id: string
  sku: string
  name: string
  ean: string | null
  priceB2B: number
}

/** Resultado da análise (preview). NÃO persiste nada. */
export interface AnalyzeImportResult {
  source: OfferSource
  /** URL informada, sempre preservada (mesmo sem leitura automática). */
  url: string | null
  /** true se foi possível ler algum conteúdo público da URL. */
  urlReadable: boolean
  /** Mensagem honesta quando a leitura automática não é possível. */
  message: string | null
  parsed: OlxImportParseResult
  match: OfferMatchResult
  matchedProduct: MatchedProductSummary | null
  imageUrl: string | null
}

/** Dados revisados pelo usuário, prontos para virar SOURCE OFFER. */
export interface ImportOfferInput {
  source: OfferSource
  url: string | null
  productTitle: string
  brand: string | null
  sku: string | null
  ean: string | null
  /** Preço TOTAL anunciado (do lote, quando for lote). */
  totalPrice: number
  quantity: number
  condition: ImportCondition
  city: string | null
  state: string | null
  priceNegotiable: boolean
  shipping: number | null
  imageUrl: string | null
  notes: string | null
}

const OLX_UNREADABLE_MESSAGE =
  "Não foi possível ler automaticamente este anúncio. Cole o texto do anúncio ou preencha os dados manualmente — a URL foi preservada."

function toCandidates(products: Product[]): MatchCandidate[] {
  return products
    .filter((p) => p.active)
    .map((p) => ({ id: p.id, sku: p.sku, name: p.name, ean: p.ean }))
}

/* ---------------------------------------------------------------------------
   LEITURA DE CONTEÚDO PÚBLICO (uma tentativa simples, sem evasão)
   -------------------------------------------------------------------------- */

interface FetchedListing {
  title: string | null
  imageUrl: string | null
  priceText: string | null
  description: string | null
}

function metaContent(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = html.match(re)
    if (m && m[1]) return decodeHtml(m[1].trim())
  }
  return null
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
}

/**
 * Tenta ler META tags públicas (Open Graph) de uma URL. UMA requisição, timeout
 * de 6s, sem retries agressivos e sem qualquer técnica de evasão. Retorna null
 * em qualquer falha (ex.: 403 do Cloudflare da OLX) — degradação elegante.
 */
async function fetchPublicListing(url: string): Promise<FetchedListing | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; RadarJK/1.0)",
        accept: "text/html,application/xhtml+xml",
      },
    })
    if (!res.ok) return null
    const html = (await res.text()).slice(0, 500_000) // teto de segurança
    const title = metaContent(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["']/i,
      /<title[^>]*>([^<]+)<\/title>/i,
    ])
    const imageUrl = metaContent(html, [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    ])
    const description = metaContent(html, [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    ])
    const priceText = metaContent(html, [
      /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+property=["']og:price:amount["'][^>]+content=["']([^"']+)["']/i,
    ])
    if (!title && !description) return null
    return { title, imageUrl, description, priceText: priceText ? `R$ ${priceText}` : null }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/* ---------------------------------------------------------------------------
   ANÁLISE (preview) e PERSISTÊNCIA (confirmação)
   -------------------------------------------------------------------------- */

/**
 * Analisa uma URL e/ou um texto de anúncio, sem persistir. Faz o matching
 * contra os produtos JK para exibir a correspondência provável na revisão.
 */
export async function analyzeImport(params: {
  url?: string | null
  text?: string | null
}): Promise<AnalyzeImportResult> {
  const url = params.url?.trim() || null
  const text = params.text?.trim() || null

  let fetched: FetchedListing | null = null
  let urlReadable = false
  if (url) {
    fetched = await fetchPublicListing(url)
    urlReadable = Boolean(fetched && (fetched.title || fetched.description))
  }

  const effectiveText =
    [text, fetched?.title, fetched?.description, fetched?.priceText]
      .filter(Boolean)
      .join("\n") || null

  const parsed = parseOlxListingText(effectiveText, url)

  const products = await repo.listProducts()
  const match = matchOfferToProduct(
    {
      sku: parsed.sku,
      ean: parsed.ean,
      brand: parsed.brand,
      productTitle: parsed.productTitle ?? "",
    },
    toCandidates(products),
  )
  const matched = match.productId ? products.find((p) => p.id === match.productId) ?? null : null

  const message = url && !urlReadable ? OLX_UNREADABLE_MESSAGE : null

  return {
    source: "OLX",
    url,
    urlReadable,
    message,
    parsed,
    match,
    matchedProduct: matched
      ? {
          id: matched.id,
          sku: matched.sku,
          name: matched.name,
          ean: matched.ean,
          priceB2B: matched.priceB2B,
        }
      : null,
    imageUrl: fetched?.imageUrl ?? null,
  }
}

/**
 * Converte os dados revisados em uma `NormalizedOffer`. O `price` é sempre o
 * PREÇO UNITÁRIO (total / quantidade) — é o valor que o motor financeiro
 * compara com o preço de venda JK. Quando não há URL real, gera um id manual
 * estável para não colidir na deduplicação por URL.
 */
export function buildNormalizedFromImport(input: ImportOfferInput): NormalizedOffer {
  const quantity = input.quantity >= 1 ? Math.floor(input.quantity) : 1
  const totalPrice = round2(input.totalPrice)
  const unit = unitPrice(totalPrice, { quantity, detectedBy: "NENHUM" })

  const hasRealUrl = Boolean(input.url && isOlxUrl(input.url))
  const manualId = `manual-${crypto.randomUUID()}`
  const externalId = hasRealUrl ? null : manualId
  const url = input.url?.trim() || `manual://${manualId}`

  const locationLabel =
    input.city && input.state
      ? `${input.city}/${input.state}`
      : input.city || input.state || null

  return {
    source: input.source,
    externalId,
    productTitle: input.productTitle.trim(),
    sku: input.sku?.trim() || null,
    ean: input.ean?.trim() || null,
    brand: input.brand?.trim() || null,
    url,
    imageUrl: input.imageUrl?.trim() || null,
    price: unit,
    shipping: input.shipping ?? null,
    availability: quantity,
    seller: null,
    capturedAt: new Date().toISOString(),
    rawData: {
      importedManually: true,
      totalPrice,
      unitPrice: unit,
      lotQuantity: quantity,
      isLot: quantity > 1,
      condition: input.condition,
      priceNegotiable: input.priceNegotiable,
      city: input.city,
      state: input.state,
      location: locationLabel,
      notes: input.notes,
    },
  }
}

/**
 * Persiste (ou atualiza, por deduplicação) a oferta importada como SOURCE
 * OFFER. NÃO cria oportunidade no Radar — isso só acontece quando o usuário
 * confirma "Analisar no Radar".
 */
export async function saveImportedOffer(input: ImportOfferInput): Promise<PersistOfferResult> {
  return persistImportedOffer(buildNormalizedFromImport(input))
}
