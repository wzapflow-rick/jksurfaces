import type {
  NormalizedOffer,
  OfferIdentity,
  SourceAdapter,
  SourceSearchOptions,
} from "./types"
import { SourceError } from "./types"

/**
 * CHATUBA ADAPTER — Fase 6.1.
 *
 * A loja da Chatuba (www.chatuba.com.br) roda em VTEX, que expõe uma API
 * PÚBLICA e documentada de catálogo. Usamos exclusivamente o endpoint público
 * de busca de produtos:
 *
 *   GET /api/catalog_system/pub/products/search?ft={termo}&_from=0&_to={n}
 *
 * Esse acesso é apropriado: é conteúdo público, sem autenticação, sem burlar
 * CAPTCHA, bloqueios ou áreas privadas. Não fazemos scraping de HTML.
 *
 * ------------------------------------------------------------------------------
 * LIMITAÇÕES CONHECIDAS (documentadas para fases futuras):
 *  - Frete não é retornado pela busca pública (depende de CEP + simulação de
 *    carrinho, que exige mais chamadas). Por isso `shipping` fica null aqui.
 *  - A API pública tem rate limiting do lado da VTEX; aplicamos um intervalo
 *    mínimo entre chamadas e um teto de resultados por busca.
 *  - Se a VTEX alterar o contrato do endpoint público ou passar a exigir
 *    proteção adicional, a captura deve ser revista — NÃO criar workaround.
 * ------------------------------------------------------------------------------
 */

const BASE_URL = "https://www.chatuba.com.br"
const SOURCE = "CHATUBA" as const

/** Teto de segurança de resultados por busca. */
const MAX_RESULTS = 20
/** Timeout por requisição (ms). */
const REQUEST_TIMEOUT_MS = 10_000
/** Intervalo mínimo entre requisições de saída (rate limiting simples). */
const MIN_REQUEST_INTERVAL_MS = 400
/** Tentativas totais (1 chamada + 1 retry) em falhas transitórias. */
const MAX_ATTEMPTS = 2

/** Estado de rate limiting compartilhado no módulo (server-side). */
const globalForChatuba = globalThis as unknown as { __chatubaLastRequestAt?: number }

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Garante o intervalo mínimo entre chamadas de saída. */
async function respectRateLimit(): Promise<void> {
  const last = globalForChatuba.__chatubaLastRequestAt ?? 0
  const elapsed = Date.now() - last
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await sleep(MIN_REQUEST_INTERVAL_MS - elapsed)
  }
  globalForChatuba.__chatubaLastRequestAt = Date.now()
}

/** Formatos brutos mínimos do payload VTEX que nos interessam. */
interface VtexCommertialOffer {
  Price?: number
  ListPrice?: number
  AvailableQuantity?: number
}
interface VtexSeller {
  sellerName?: string
  commertialOffer?: VtexCommertialOffer
}
interface VtexImage {
  imageUrl?: string
}
interface VtexReference {
  Key?: string
  Value?: string
}
interface VtexItem {
  itemId?: string
  ean?: string
  referenceId?: VtexReference[]
  images?: VtexImage[]
  sellers?: VtexSeller[]
}
interface VtexProduct {
  productId?: string
  productName?: string
  brand?: string
  link?: string
  items?: VtexItem[]
}

function num(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) return null
  return value
}

/**
 * Converte um produto bruto do catálogo público VTEX em `NormalizedOffer`.
 * Exportada isoladamente para permitir testes determinísticos sem rede.
 *
 * SKU: prioriza o `referenceId` (código de referência legível do produto, útil
 * para o matching contra o SKU da JK); cai para o `itemId` (id numérico VTEX)
 * quando não houver referência.
 */
export function normalizeVtexProduct(raw: unknown): NormalizedOffer | null {
  if (!raw || typeof raw !== "object") return null
  const p = raw as VtexProduct
  const item = p.items?.[0]
  const seller = item?.sellers?.[0]
  const offer = seller?.commertialOffer
  const price = num(offer?.Price)
  // Sem preço público (ou preço não positivo) não há oferta analisável.
  if (price === null || price <= 0) return null
  const url = p.link ?? `${BASE_URL}/${p.productId ?? ""}/p`
  const referenceId = item?.referenceId?.find((r) => r.Value && r.Value.trim())?.Value?.trim()

  return {
    source: SOURCE,
    externalId: p.productId ?? null,
    productTitle: (p.productName ?? "").trim() || "Produto sem título",
    sku: referenceId || item?.itemId || null,
    ean: item?.ean && item.ean.trim() ? item.ean.trim() : null,
    brand: p.brand?.trim() || null,
    url,
    imageUrl: item?.images?.[0]?.imageUrl ?? null,
    price,
    // Frete não vem da busca pública (ver limitações no topo do arquivo).
    shipping: null,
    availability: num(offer?.AvailableQuantity),
    seller: seller?.sellerName?.trim() || null,
    capturedAt: new Date().toISOString(),
    // Guarda apenas um resumo mínimo — nunca HTML/página completa.
    rawData: {
      productId: p.productId ?? null,
      itemId: item?.itemId ?? null,
      listPrice: num(offer?.ListPrice),
    },
  }
}

/** Faz uma requisição pública com timeout, rate limiting e retry limitado. */
async function fetchJson(url: string, options?: SourceSearchOptions): Promise<unknown> {
  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await respectRateLimit()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    // Cancela também se o chamador abortar.
    const onExternalAbort = () => controller.abort()
    options?.signal?.addEventListener("abort", onExternalAbort, { once: true })
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          accept: "application/json",
          // Identificação honesta; nada de disfarce para burlar proteção.
          "user-agent": "RadarJK/6.1 (captura de ofertas públicas)",
        },
        cache: "no-store",
      })
      if (res.status === 429) {
        throw new SourceError("RATE_LIMITED", "Fonte limitou a taxa de requisições.")
      }
      if (!res.ok) {
        // 5xx é transitório → permite retry; 4xx não.
        if (res.status >= 500 && attempt < MAX_ATTEMPTS) {
          lastError = new SourceError("UNAVAILABLE", `HTTP ${res.status}`)
          continue
        }
        throw new SourceError("BAD_RESPONSE", `Resposta inesperada da fonte (HTTP ${res.status}).`)
      }
      return (await res.json()) as unknown
    } catch (error) {
      if (error instanceof SourceError && error.code !== "UNAVAILABLE") throw error
      const isAbort = error instanceof DOMException && error.name === "AbortError"
      lastError = isAbort
        ? new SourceError("TIMEOUT", "Tempo de resposta da fonte excedido.")
        : new SourceError("UNAVAILABLE", "Não foi possível contatar a fonte.")
      // Só tenta de novo se ainda houver tentativas.
      if (attempt >= MAX_ATTEMPTS) throw lastError
    } finally {
      clearTimeout(timeout)
      options?.signal?.removeEventListener("abort", onExternalAbort)
    }
  }
  throw lastError ?? new SourceError("UNAVAILABLE", "Falha desconhecida na fonte.")
}

export const chatubaAdapter: SourceAdapter = {
  key: SOURCE,
  label: "Chatuba",

  async search(query, options) {
    const term = query.trim()
    if (!term) return []
    const limit = Math.min(Math.max(options?.limit ?? MAX_RESULTS, 1), MAX_RESULTS)
    const url =
      `${BASE_URL}/api/catalog_system/pub/products/search` +
      `?ft=${encodeURIComponent(term)}&_from=0&_to=${limit - 1}`

    const data = await fetchJson(url, options)
    if (!Array.isArray(data)) {
      throw new SourceError("BAD_RESPONSE", "Formato inesperado do catálogo público.")
    }
    const offers: NormalizedOffer[] = []
    for (const raw of data) {
      const offer = this.normalize(raw)
      if (offer) offers.push(offer)
    }
    return offers
  },

  normalize(raw) {
    return normalizeVtexProduct(raw)
  },

  identifyProduct(offer): OfferIdentity {
    return {
      sku: offer.sku,
      ean: offer.ean,
      brand: offer.brand,
      productTitle: offer.productTitle,
    }
  },

  async getOffer(externalId, options) {
    const id = externalId.trim()
    if (!id) return null
    const url =
      `${BASE_URL}/api/catalog_system/pub/products/search` +
      `?fq=productId:${encodeURIComponent(id)}`
    const data = await fetchJson(url, options)
    if (!Array.isArray(data) || data.length === 0) return null
    return this.normalize(data[0])
  },
}
