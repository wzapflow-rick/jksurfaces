import type { HuntMission, HuntMissionMetrics, HuntPriority } from "@/types"
import {
  computeAcquisitionTargets,
  RADAR_RULE,
  type RadarRule,
} from "./radar-opportunity"
import { round2 } from "./pricing"

/**
 * INTELIGÊNCIA DE PRIORIDADE — Central de Caça (Fase 4).
 *
 * Sem IA e sem dados de mercado inventados. A ordenação de "o que caçar agora"
 * é 100% determinística e explicável, derivada apenas dos números da própria
 * missão através do motor financeiro reverso (Fase 3).
 *
 * ORDENAÇÃO em "CAÇAR AGORA":
 *   1) prioridade definida pelo usuário (ALTA > MÉDIA > BAIXA);
 *   2) desempate pelo `potentialScore` (potencial econômico da missão).
 *
 * potentialScore (0–100), ponderado:
 *   - resultado recomendado ...... 60%  (lucro esperado se comprar no ideal)
 *   - preço de venda ............. 20%  (ticket / capital movimentado)
 *   - folga de negociação ........ 20%  (espaço entre recomendado e máximo)
 *
 * Cada componente é normalizado por uma âncora fixa e explícita, definida a
 * partir da operação da JK, e limitado a 0–100 antes da ponderação.
 */

/** Âncoras de normalização (R$). Documentadas e fixas — sem dados externos. */
export const PRIORITY_ANCHORS = {
  /** Resultado recomendado que já vale 100 pontos. */
  resultFull: 300,
  /** Preço de venda que já vale 100 pontos. */
  salePriceFull: 2500,
  /** Folga de negociação que já vale 100 pontos. */
  bufferFull: 250,
} as const

export const PRIORITY_WEIGHT: Record<HuntPriority, number> = {
  ALTA: 100,
  MEDIA: 60,
  BAIXA: 30,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Agrega os alvos de aquisição e o potencial de uma missão. */
export function computeMissionMetrics(
  mission: Pick<HuntMission, "expectedSalePrice" | "priority">,
  rule: RadarRule = RADAR_RULE,
): HuntMissionMetrics {
  const targets = computeAcquisitionTargets(mission.expectedSalePrice, rule)

  const resultScore = clamp((targets.recommendedResult / PRIORITY_ANCHORS.resultFull) * 100, 0, 100)
  const saleScore = clamp((mission.expectedSalePrice / PRIORITY_ANCHORS.salePriceFull) * 100, 0, 100)
  const bufferScore = clamp((targets.buffer / PRIORITY_ANCHORS.bufferFull) * 100, 0, 100)

  const potentialScore = Math.round(clamp(resultScore * 0.6 + saleScore * 0.2 + bufferScore * 0.2, 0, 100))

  return {
    maxAcquisition: targets.maxAcquisition,
    recommendedAcquisition: targets.recommendedAcquisition,
    recommendedResult: targets.recommendedResult,
    buffer: targets.buffer,
    targetMarginPct: targets.targetMarginPct,
    potentialScore,
    priorityWeight: PRIORITY_WEIGHT[mission.priority],
    rankScore: round2(PRIORITY_WEIGHT[mission.priority] * 1000 + potentialScore),
  }
}

/** Ordena missões por prioridade e, em empate, por potencial econômico. */
export function sortByHuntPriority<T extends { metrics: HuntMissionMetrics }>(missions: T[]): T[] {
  return [...missions].sort((a, b) => b.metrics.rankScore - a.metrics.rankScore)
}
