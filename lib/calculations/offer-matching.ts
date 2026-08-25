import type { MatchMethod, MatchStatus, OfferMatchResult } from "@/types"

/**
 * MATCHING DE OFERTA -> PRODUTO JK — Fase 6.1.
 *
 * 100% determinístico e explicável. Associa uma oferta capturada a um produto
 * do catálogo JK seguindo uma ordem de prioridade fixa, do identificador mais
 * forte ao mais fraco:
 *
 *   1) EAN exato .......... confiança 1,00  (MATCHED)
 *   2) SKU exato .......... confiança 1,00  (MATCHED)
 *   3) SKU normalizado .... confiança 0,90  (MATCHED)
 *   4) marca + modelo ..... confiança 0,80  (REVIEW)
 *   5) nome normalizado ... confiança 0,75  (REVIEW)
 *   6) nenhum match ....... confiança 0,00  (UNMATCHED)
 *
 * REGRA IMPORTANTE: baixa confiança NUNCA vira certeza. Só confiança >= 0,90 é
 * tratada como MATCHED automático; entre 0,50 e 0,90 fica em REVIEW (revisar
 * match); abaixo disso, UNMATCHED.
 */

/** Limiares de confiança por método. Fonte única da verdade. */
export const MATCH_CONFIDENCE: Record<MatchMethod, number> = {
  EAN_EXACT: 1.0,
  SKU_EXACT: 1.0,
  SKU_NORMALIZED: 0.9,
  BRAND_MODEL: 0.8,
  NAME_MATCH: 0.75,
  UNKNOWN: 0,
}

/** Confiança mínima para considerar um match automático (sem revisão). */
export const AUTO_MATCH_MIN_CONFIDENCE = 0.9
/** Confiança mínima para sugerir revisão (abaixo disso é UNMATCHED). */
export const REVIEW_MIN_CONFIDENCE = 0.5

/** Produto candidato usado no matching (subconjunto do produto JK). */
export interface MatchCandidate {
  id: string
  sku: string
  name: string
  ean: string | null
}

/** Identificadores da oferta a associar. */
export interface OfferMatchInput {
  sku: string | null
  ean: string | null
  brand: string | null
  productTitle: string
}

/** Deriva o status a partir da confiança. */
export function statusFromConfidence(confidence: number): MatchStatus {
  if (confidence >= AUTO_MATCH_MIN_CONFIDENCE) return "MATCHED"
  if (confidence >= REVIEW_MIN_CONFIDENCE) return "REVIEW"
  return "UNMATCHED"
}

/** Normaliza texto: minúsculas, sem acentos, espaços colapsados. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

/** Normaliza SKU: maiúsculas e apenas alfanuméricos (remove hífens, espaços). */
export function normalizeSku(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

/** Normaliza EAN: apenas dígitos. */
function normalizeEan(value: string): string {
  return value.replace(/\D/g, "")
}

function tokenSet(value: string): Set<string> {
  return new Set(normalizeText(value).split(" ").filter((t) => t.length > 1))
}

/** Índice de Jaccard entre dois conjuntos de tokens (0–1). */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let intersection = 0
  for (const t of a) if (b.has(t)) intersection++
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

/** Token de "modelo": contém dígito (ex.: "1176.C" -> "1176c"). */
function modelTokens(value: string): string[] {
  return normalizeText(value)
    .split(" ")
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter((t) => /\d/.test(t) && t.length >= 2)
}

const NAME_MATCH_MIN_JACCARD = 0.6

/**
 * Executa o matching de uma oferta contra a lista de produtos JK, respeitando a
 * ordem de prioridade. Retorna o primeiro método (mais forte) que encontrar um
 * candidato. Nunca inventa associação.
 */
export function matchOfferToProduct(
  offer: OfferMatchInput,
  candidates: MatchCandidate[],
): OfferMatchResult {
  const build = (productId: string, method: MatchMethod): OfferMatchResult => {
    const confidence = MATCH_CONFIDENCE[method]
    return {
      matched: method !== "UNKNOWN",
      productId,
      confidence,
      matchMethod: method,
      status: statusFromConfidence(confidence),
    }
  }

  // 1) EAN exato.
  if (offer.ean) {
    const ean = normalizeEan(offer.ean)
    if (ean) {
      const hit = candidates.find((c) => c.ean && normalizeEan(c.ean) === ean)
      if (hit) return build(hit.id, "EAN_EXACT")
    }
  }

  // 2) SKU exato (case-insensitive, sem trimming de conteúdo interno).
  if (offer.sku) {
    const skuExact = offer.sku.trim().toLowerCase()
    const hit = candidates.find((c) => c.sku.trim().toLowerCase() === skuExact)
    if (hit) return build(hit.id, "SKU_EXACT")
  }

  // 3) SKU normalizado (ignora hífens/espaços).
  if (offer.sku) {
    const skuNorm = normalizeSku(offer.sku)
    if (skuNorm) {
      const hit = candidates.find((c) => normalizeSku(c.sku) === skuNorm)
      if (hit) return build(hit.id, "SKU_NORMALIZED")
    }
  }

  // 4) marca + modelo: a marca e ao menos um token de modelo aparecem no nome.
  if (offer.brand) {
    const brand = normalizeText(offer.brand)
    const models = modelTokens(offer.productTitle)
    if (brand && models.length > 0) {
      const hit = candidates.find((c) => {
        const name = normalizeText(c.name)
        const compact = name.replace(/[^a-z0-9]/g, "")
        return name.includes(brand) && models.some((m) => compact.includes(m))
      })
      if (hit) return build(hit.id, "BRAND_MODEL")
    }
  }

  // 5) nome normalizado (similaridade de tokens acima do limiar).
  const offerTokens = tokenSet(offer.productTitle)
  if (offerTokens.size > 0) {
    let best: { id: string; score: number } | null = null
    for (const c of candidates) {
      const score = jaccard(offerTokens, tokenSet(c.name))
      if (score >= NAME_MATCH_MIN_JACCARD && (!best || score > best.score)) {
        best = { id: c.id, score }
      }
    }
    if (best) return build(best.id, "NAME_MATCH")
  }

  // 6) nenhum match.
  return { matched: false, productId: null, confidence: 0, matchMethod: "UNKNOWN", status: "UNMATCHED" }
}
