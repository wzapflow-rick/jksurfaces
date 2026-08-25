import "server-only"
import type {
  Product,
  SourceOffer,
  SourceOfferMetrics,
  SourceOfferWithMetrics,
} from "@/types"
import {
  matchOfferToProduct,
  type MatchCandidate,
} from "@/lib/calculations/offer-matching"
import { computeRadarMetrics } from "@/lib/calculations/radar-opportunity"
import { round2 } from "@/lib/calculations/pricing"
import { getSourceAdapter } from "@/lib/sources/registry"
import type { NormalizedOffer, SourceSearchOptions } from "@/lib/sources/types"
import { SourceError } from "@/lib/sources/types"
import { repo } from "./repository"

/**
 * SERVIÇO DE CAPTURA DE OFERTAS — Fase 6.1.
 *
 * Orquestra o fluxo: adapter.search() -> matching -> deduplicação ->
 * persistência -> histórico de preço. Reutiliza EXATAMENTE o motor financeiro
 * das Fases 3/4 para as métricas (nunca duplica a regra). Nunca derruba a
 * aplicação: erros de fonte são propagados como SourceError e tratados na UI.
 */

/* ---------------------------------------------------------------------------
   CACHE simples (seção 13): evita repetir a mesma busca em curto intervalo.
   -------------------------------------------------------------------------- */
const CACHE_TTL_MS = 5 * 60_000
interface CacheEntry {
  offers: NormalizedOffer[]
  at: number
}
const globalForCache = globalThis as unknown as {
  __sourceSearchCache?: Map<string, CacheEntry>
  __sourceLastSearch?: { source: string; query: string; count: number; at: string }
}
const cache = (globalForCache.__sourceSearchCache ??= new Map<string, CacheEntry>())

function cacheKey(source: string, query: string): string {
  return `${source}:${query.trim().toLowerCase()}`
}

/** Última busca registrada (para observabilidade da captura). */
export function getLastSearch() {
  return globalForCache.__sourceLastSearch ?? null
}

/**
 * Busca ofertas normalizadas de uma fonte, com cache de curta duração. Lança
 * SourceError se a fonte não existir ou estiver indisponível.
 */
export async function searchSource(
  source: string,
  query: string,
  options?: SourceSearchOptions,
): Promise<NormalizedOffer[]> {
  const adapter = getSourceAdapter(source)
  if (!adapter) {
    throw new SourceError("UNAVAILABLE", `Fonte não suportada: ${source}.`)
  }
  const key = cacheKey(source, query)
  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.offers
  }
  const offers = await adapter.search(query, options)
  cache.set(key, { offers, at: Date.now() })
  globalForCache.__sourceLastSearch = {
    source,
    query,
    count: offers.length,
    at: new Date().toISOString(),
  }
  return offers
}

function toCandidates(products: Product[]): MatchCandidate[] {
  return products
    .filter((p) => p.active)
    .map((p) => ({ id: p.id, sku: p.sku, name: p.name, ean: p.ean }))
}

export interface CaptureSummary {
  offers: SourceOffer[]
  created: number
  updated: number
}

/**
 * Busca na fonte, associa a produtos JK, deduplica e persiste. Atualiza preço,
 * disponibilidade e capturedAt de ofertas já existentes, registrando histórico
 * de preço só quando o preço/frete muda. NÃO cria oportunidade automaticamente.
 */
export async function captureFromSource(
  source: string,
  query: string,
  options?: SourceSearchOptions,
): Promise<CaptureSummary> {
  const normalized = await searchSource(source, query, options)
  const products = await repo.listProducts()
  const candidates = toCandidates(products)

  const offers: SourceOffer[] = []
  let created = 0
  let updated = 0

  for (const off of normalized) {
    const match = matchOfferToProduct(
      { sku: off.sku, ean: off.ean, brand: off.brand, productTitle: off.productTitle },
      candidates,
    )
    const matchFields = {
      matchStatus: match.status,
      matchedProductId: match.productId,
      matchConfidence: match.confidence,
      matchMethod: match.matchMethod,
    }

    const existing = await repo.findSourceOfferForDedupe(source, off.externalId, off.url)
    if (existing) {
      const priceChanged =
        round2(existing.price) !== round2(off.price) ||
        (existing.shipping ?? null) !== (off.shipping ?? null)
      const saved = await repo.updateSourceOffer(existing.id, {
        productTitle: off.productTitle,
        sku: off.sku,
        ean: off.ean,
        brand: off.brand,
        url: off.url,
        imageUrl: off.imageUrl,
        price: off.price,
        shipping: off.shipping,
        availability: off.availability,
        seller: off.seller,
        capturedAt: off.capturedAt,
        rawData: off.rawData,
        ...matchFields,
      })
      if (priceChanged) {
        await repo.addSourceOfferPriceHistory(existing.id, off.price, off.shipping, off.capturedAt)
      }
      updated++
      if (saved) offers.push(saved)
    } else {
      const saved = await repo.createSourceOffer({
        source: off.source,
        externalId: off.externalId,
        productTitle: off.productTitle,
        sku: off.sku,
        ean: off.ean,
        brand: off.brand,
        url: off.url,
        imageUrl: off.imageUrl,
        price: off.price,
        shipping: off.shipping,
        availability: off.availability,
        seller: off.seller,
        capturedAt: off.capturedAt,
        rawData: off.rawData,
        ...matchFields,
      })
      // Baseline do histórico na primeira captura.
      await repo.addSourceOfferPriceHistory(saved.id, off.price, off.shipping, off.capturedAt)
      created++
      offers.push(saved)
    }
  }

  return { offers, created, updated }
}

/**
 * Calcula as métricas de uma oferta contra um preço de venda de referência,
 * usando o motor financeiro reverso das Fases 3/4 (sem duplicar a regra).
 */
export function computeOfferMetrics(
  price: number,
  shipping: number | null,
  salePrice: number,
): SourceOfferMetrics {
  const m = computeRadarMetrics({
    announcedPrice: price,
    shipping: shipping ?? 0,
    otherCosts: 0,
    salePrice,
  })
  return {
    salePrice,
    maxPurchasePrice: m.maxPurchasePrice,
    recommendedPurchasePrice: m.recommendedPurchasePrice,
    estimatedResult: m.estimatedResult,
    differenceToMax: round2(m.maxPurchasePrice - price),
    recommendation: m.recommendation,
    classification: m.classification,
  }
}

/**
 * Junta uma lista de ofertas com o produto JK associado e as métricas do motor
 * financeiro. Só há métricas quando a oferta está associada a um produto JK
 * (o preço de venda de referência vem do produto).
 */
export function attachMetrics(
  offers: SourceOffer[],
  products: Product[],
): SourceOfferWithMetrics[] {
  const byId = new Map(products.map((p) => [p.id, p]))
  return offers.map((offer) => {
    const product = offer.matchedProductId ? byId.get(offer.matchedProductId) ?? null : null
    // O motor financeiro compara SEMPRE o preço por unidade. Na captura da
    // Chatuba unitPrice é null e cai no price (sem alterar o resultado); em
    // importações de lote da OLX usa o preço unitário derivado.
    const effectivePrice = offer.unitPrice ?? offer.price
    const metrics =
      product && product.priceB2B > 0
        ? computeOfferMetrics(effectivePrice, offer.shipping, product.priceB2B)
        : null
    return { ...offer, product, metrics }
  })
}

/** Todas as ofertas capturadas com produto associado e métricas. */
export async function getSourceOffersWithMetrics(): Promise<SourceOfferWithMetrics[]> {
  const [offers, products] = await Promise.all([repo.listSourceOffers(), repo.listProducts()])
  return attachMetrics(offers, products)
}
