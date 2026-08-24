import type {
  RadarClassification,
  RadarMetrics,
  RadarOpportunity,
  RadarRecommendation,
} from "@/types"
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
   * Margem-alvo de resultado (sobre o preço de venda) usada para calcular o
   * PREÇO RECOMENDADO de compra na caça. É deliberadamente igual ao limiar
   * "BOA" da classificação, de modo que comprar no preço recomendado garante,
   * no mínimo, uma oportunidade classificada como boa. Fonte única da verdade.
   */
  recommendedMarginPct: 0.1,
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

/* =============================================================================
   CALCULADORA REVERSA (Fase 3)

   A partir do preço de venda, do frete e dos outros custos, descobrimos quanto
   a JK PODE pagar pelo produto. Derivação direta da regra central:

     Resultado = venda − compra − frete − outros − 30%·venda − 8%·venda

   Isolando "compra" com Resultado = 0:

     compraMáxima = venda·(1 − 0,38) − frete − outros

   Todos os cálculos partem daqui, sem duplicar percentuais.
   ============================================================================= */

/** Valor restante do preço de venda após deduzir os 38% (30% + 8%). */
export function calcNetAfterDeductions(salePrice: number, rule: RadarRule = RADAR_RULE): number {
  const deductionPct = (rule.operationalPct + rule.taxPct) / 100
  return round2(salePrice * (1 - deductionPct))
}

/** Preço máximo de compra do PRODUTO para o resultado ficar em zero. */
export function calcMaxPurchasePrice(
  params: { salePrice: number; shipping: number; otherCosts: number },
  rule: RadarRule = RADAR_RULE,
): number {
  const net = calcNetAfterDeductions(params.salePrice, rule)
  return round2(net - params.shipping - params.otherCosts)
}

/** Preço recomendado de compra: máximo menos a margem-alvo de resultado. */
export function calcRecommendedPurchasePrice(
  params: { salePrice: number; shipping: number; otherCosts: number },
  rule: RadarRule = RADAR_RULE,
): number {
  const max = calcMaxPurchasePrice(params, rule)
  const buffer = round2(params.salePrice * rule.recommendedMarginPct)
  return round2(max - buffer)
}

/**
 * Recomendação de caça comparando o preço encontrado com os limites.
 * Usa os valores CRUS (podem ser negativos) para decidir corretamente.
 */
export function recommendPurchase(
  announcedPrice: number,
  recommendedPrice: number,
  maxPrice: number,
): RadarRecommendation {
  // Preço de venda baixo demais: não compensa a nenhum preço de compra.
  if (maxPrice <= 0) return "NAO_VALE"
  if (announcedPrice <= recommendedPrice) return "CACAR"
  if (announcedPrice <= maxPrice) return "AVALIAR"
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
  const { salePrice, shipping, otherCosts, announcedPrice } = opportunity

  const operationalCost = round2(salePrice * (rule.operationalPct / 100))
  const taxCost = round2(salePrice * (rule.taxPct / 100))
  const estimatedResult = round2(salePrice - acquisitionCost - operationalCost - taxCost)

  const marginPct = salePrice > 0 ? estimatedResult / salePrice : 0
  const roi = acquisitionCost > 0 ? round2(estimatedResult / acquisitionCost) : 0

  // Calculadora reversa: quanto posso pagar pelo produto.
  const netAfterDeductions = calcNetAfterDeductions(salePrice, rule)
  const maxPurchasePrice = calcMaxPurchasePrice({ salePrice, shipping, otherCosts }, rule)
  const recommendedPurchasePrice = calcRecommendedPurchasePrice(
    { salePrice, shipping, otherCosts },
    rule,
  )
  // Recomendação usa os valores crus (antes de qualquer clamp de exibição).
  const recommendation = recommendPurchase(announcedPrice, recommendedPurchasePrice, maxPurchasePrice)

  return {
    acquisitionCost,
    operationalCost,
    taxCost,
    estimatedResult,
    marginPct: round2(marginPct),
    roi,
    classification: classifyRadar(marginPct, rule),
    netAfterDeductions,
    maxPurchasePrice,
    recommendedPurchasePrice,
    recommendation,
  }
}
