import "server-only"
import type { OfferCondition, FieldOrigin, Product, SourceOffer } from "@/types"
import {
  matchOfferToProduct,
  type MatchCandidate,
} from "@/lib/calculations/offer-matching"
import { round2 } from "@/lib/calculations/pricing"
import { repo } from "./repository"

/**
 * SERVIÇO DE IMPORTAÇÃO DE OFERTAS — Fase 6.3.
 *
 * Recebe um anúncio já revisado pelo usuário e o transforma em uma SourceOffer
 * persistida (nunca em uma RadarOpportunity — isso só acontece no Radar, após
 * "Analisar no Radar"). Reutiliza EXATAMENTE o matching da Fase 6.1
 * (matchOfferToProduct) e a mesma deduplicação por URL da captura automática.
 * NÃO duplica matching nem motor financeiro.
 */

/** Payload de importação já validado/revisado (vindo da tela de revisão). */
export interface OfferImportPayload {
  source: string
  url: string | null
  productTitle: string
  brand: string | null
  sku: string | null
  ean: string | null
  /** Preço TOTAL anunciado. */
  price: number
  quantity: number
  /** Preço por unidade (já calculado/editado). */
  unitPrice: number
  isLot: boolean
  condition: OfferCondition
  priceNegotiable: boolean
  location: string | null
  shipping: number | null
  notes: string | null
  fieldOrigins: Record<string, FieldOrigin> | null
}

export interface OfferImportResult {
  offer: SourceOffer
  created: boolean
  /** Preenchido quando uma reimportação alterou o preço (para o histórico/UX). */
  priceChange: { from: number; to: number; pct: number } | null
}

function toCandidates(products: Product[]): MatchCandidate[] {
  return products
    .filter((p) => p.active)
    .map((p) => ({ id: p.id, sku: p.sku, name: p.name, ean: p.ean }))
}

/**
 * Importa (ou atualiza) uma oferta a partir de um anúncio revisado. Deduplica
 * por (source, url): se a mesma URL já existe, ATUALIZA a oferta e registra o
 * histórico quando o preço muda — nunca cria duplicata.
 */
export async function importOffer(payload: OfferImportPayload): Promise<OfferImportResult> {
  const products = await repo.listProducts()
  const candidates = toCandidates(products)

  const match = matchOfferToProduct(
    {
      sku: payload.sku,
      ean: payload.ean,
      brand: payload.brand,
      productTitle: payload.productTitle,
    },
    candidates,
  )

  const capturedAt = new Date().toISOString()
  const common = {
    source: payload.source,
    externalId: null,
    productTitle: payload.productTitle,
    sku: payload.sku,
    ean: payload.ean,
    brand: payload.brand,
    imageUrl: null,
    price: round2(payload.price),
    shipping: payload.shipping === null ? null : round2(payload.shipping),
    availability: payload.quantity,
    seller: null,
    capturedAt,
    quantity: payload.quantity,
    unitPrice: round2(payload.unitPrice),
    isLot: payload.isLot,
    condition: payload.condition,
    priceNegotiable: payload.priceNegotiable,
    location: payload.location,
    notes: payload.notes,
    fieldOrigins: payload.fieldOrigins,
    matchStatus: match.status,
    matchedProductId: match.productId,
    matchConfidence: match.confidence,
    matchMethod: match.matchMethod,
    rawData: null,
  }

  // Deduplicação por URL (quando há URL). Sem URL não há como deduplicar.
  const existing = payload.url
    ? await repo.findSourceOfferForDedupe(payload.source, null, payload.url)
    : null

  if (existing) {
    const priceChanged =
      round2(existing.price) !== round2(payload.price) ||
      (existing.shipping ?? null) !== (payload.shipping === null ? null : round2(payload.shipping))
    const saved = await repo.updateSourceOffer(existing.id, { ...common, url: existing.url })
    let priceChange: OfferImportResult["priceChange"] = null
    if (priceChanged) {
      await repo.addSourceOfferPriceHistory(
        existing.id,
        round2(payload.price),
        common.shipping,
        capturedAt,
      )
      const from = round2(existing.price)
      const to = round2(payload.price)
      priceChange = {
        from,
        to,
        pct: from > 0 ? round2(((to - from) / from) * 100) : 0,
      }
    }
    return { offer: saved ?? existing, created: false, priceChange }
  }

  // URL é obrigatória no schema. Sem URL do anúncio, geramos uma âncora local
  // única (não navegável) só para satisfazer a persistência sem inventar link.
  const url = payload.url ?? `local:olx-import/${crypto.randomUUID()}`
  const saved = await repo.createSourceOffer({ ...common, url })
  await repo.addSourceOfferPriceHistory(saved.id, round2(payload.price), common.shipping, capturedAt)
  return { offer: saved, created: true, priceChange: null }
}
