import type { RadarClassification, RadarMetrics, RadarOpportunity } from "@/types"
import { round2 } from "./pricing"

/**
 * Motor de cálculo do Radar JK (Fase 2).
 *
 * Regra comercial atual da JK aplicada sobre o PREÇO DE VENDA:
 *   - 30% ... custos/serviços da operação
 *   - 8% .... notas fiscais / impostos
 *
 * RESULTADO ESTIMADO = preço de venda − custo de aquisição − 30% − 8%
 *
 * IMPORTANTE: os percentuais e os limiares de classificação ficam centralizados
 * aqui, isolados da interface, para que possam ser tornados configuráveis em
 * fases futuras sem alterar telas. NÃO alterar os percentuais nesta fase.
 */
export const RADAR_RULE = {
  /** Percentual de custos/serviços da operação (sobre o preço de venda). */
  operationalPct: 30,
  /** Percentual de notas/impostos (sobre o preço de venda). */
  taxPct: 8,
  /**
   * Limiares de classificação baseados na margem (resultado / preço de venda).
   * Separados da UI e preparados para ajuste posterior.
   */
  classification: {
    /** Margem >= 20% -> oportunidade excelente. */
    excellentMin: 0.2,
    /** Margem >= 10% -> oportunidade boa. */
    goodMin: 0.1,
    /** Margem >= 0% -> avaliar; abaixo disso não vale a pena. */
    evaluateMin: 0,
  },
} as const

export type RadarRule = typeof RADAR_RULE

/**
 * Margem-alvo (sobre o preço de venda) usada para calcular o PREÇO RECOMENDADO
 * de aquisição de uma missão de caça (Fase 4). O preço máximo é o ponto de
 * equilíbrio (resultado zero); o recomendado deixa esta folga de lucro.
 *
 * Mantido aqui, junto do motor financeiro, para NÃO duplicar a fórmula em outro
 * lugar. Ajustar em um único ponto no futuro.
 */
export const RECOMMENDED_MARGIN_PCT = 10

/** Alvos de aquisição de uma missão de caça, derivados do preço de venda. */
export interface AcquisitionTargets {
  /** Preço máximo de aquisição = ponto de equilíbrio (resultado zero). */
  maxAcquisition: number
  /** Preço recomendado de aquisição = deixa a margem-alvo de lucro. */
  recommendedAcquisition: number
  /** Resultado estimado se comprar exatamente no preço recomendado. */
  recommendedResult: number
  /** Folga entre o preço máximo e o recomendado. */
  buffer: number
  /** Margem-alvo aplicada (fração do preço de venda). */
  targetMarginPct: number
}

/**
 * Motor de cálculo reverso (Fase 3/4): a partir do PREÇO DE VENDA, calcula até
 * quanto a JK pode pagar por um item.
 *
 *   preço máximo (equilíbrio) = venda × (1 − 30% − 8%)
 *   preço recomendado         = venda × (1 − 30% − 8% − margemAlvo)
 *
 * Usa exatamente os mesmos percentuais do RADAR_RULE, então é consistente com
 * `computeRadarMetrics`: comprar no preço máximo zera o resultado e comprar no
 * recomendado entrega a margem-alvo.
 */
export function computeAcquisitionTargets(
  salePrice: number,
  rule: RadarRule = RADAR_RULE,
  recommendedMarginPct: number = RECOMMENDED_MARGIN_PCT,
): AcquisitionTargets {
  const overheadPct = (rule.operationalPct + rule.taxPct) / 100
  const targetMarginPct = recommendedMarginPct / 100

  const safeSale = salePrice > 0 ? salePrice : 0
  const maxAcquisition = round2(safeSale * (1 - overheadPct))
  const recommendedAcquisition = round2(safeSale * (1 - overheadPct - targetMarginPct))

  return {
    maxAcquisition: Math.max(0, maxAcquisition),
    recommendedAcquisition: Math.max(0, recommendedAcquisition),
    recommendedResult: round2(safeSale * targetMarginPct),
    buffer: round2(Math.max(0, maxAcquisition - recommendedAcquisition)),
    targetMarginPct,
  }
}

/** Custo total de aquisição = preço anunciado + frete + outros custos. */
export function calcAcquisitionCost(params: {
  announcedPrice: number
  shipping: number
  otherCosts: number
}): number {
  return round2(params.announcedPrice + params.shipping + params.otherCosts)
}

/** Classifica a oportunidade a partir da margem sobre o preço de venda. */
export function classifyRadar(marginPct: number, rule: RadarRule = RADAR_RULE): RadarClassification {
  const { excellentMin, goodMin, evaluateMin } = rule.classification
  if (marginPct >= excellentMin) return "EXCELENTE"
  if (marginPct >= goodMin) return "BOA"
  if (marginPct >= evaluateMin) return "AVALIAR"
  return "NAO_VALE"
}

/** Agrega todas as métricas derivadas de uma oportunidade do Radar. */
export function computeRadarMetrics(
  opportunity: Pick<
    RadarOpportunity,
    "announcedPrice" | "shipping" | "otherCosts" | "salePrice"
  >,
  rule: RadarRule = RADAR_RULE,
): RadarMetrics {
  const acquisitionCost = calcAcquisitionCost(opportunity)
  const salePrice = opportunity.salePrice

  const operationalCost = round2(salePrice * (rule.operationalPct / 100))
  const taxCost = round2(salePrice * (rule.taxPct / 100))
  const estimatedResult = round2(salePrice - acquisitionCost - operationalCost - taxCost)

  const marginPct = salePrice > 0 ? estimatedResult / salePrice : 0
  const roi = acquisitionCost > 0 ? round2(estimatedResult / acquisitionCost) : 0

  return {
    acquisitionCost,
    operationalCost,
    taxCost,
    estimatedResult,
    marginPct: round2(marginPct),
    roi,
    classification: classifyRadar(marginPct, rule),
  }
}
