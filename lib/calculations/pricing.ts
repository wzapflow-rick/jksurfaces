import type {
  AcquisitionStatus,
  CommercialPriority,
  PricingSettings,
  Product,
  ProductMetrics,
} from "@/types"

/**
 * Motor financeiro do Radar JK.
 *
 * Regra da JK (percentuais dentro do PRECO DE VENDA):
 *   - custo de aquisicao ......... 62%
 *   - margem operacional/lucro ... 30%
 *   - impostos/notas ............. 8%
 *
 * PRECO DE VENDA = CUSTO / custoPct
 * CUSTO MAXIMO   = PRECO DE VENDA * custoPct
 *
 * Os 30% ja contemplam frete, embalagem, movimentacao, custo financeiro,
 * descontos, devolucoes, avarias e capital parado. NAO adicionar esses custos
 * novamente no calculo da oportunidade nesta fase.
 *
 * Toda a matematica vive aqui, isolada da interface, para que a formula possa
 * ser ajustada em um unico lugar no futuro.
 */

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Custo maximo de aquisicao permitido pela regra financeira. */
export function calcMaxCost(priceB2B: number, settings: PricingSettings): number {
  return round2(priceB2B * (settings.costPct / 100))
}

/** Imposto previsto sobre o preco de venda. */
export function calcTax(priceB2B: number, settings: PricingSettings): number {
  return round2(priceB2B * (settings.taxPct / 100))
}

/** Resultado apos imposto = preco de venda - custo de aquisicao - imposto. */
export function calcResult(priceB2B: number, acquisitionCost: number, settings: PricingSettings): number {
  return round2(priceB2B - acquisitionCost - calcTax(priceB2B, settings))
}

/** ROI sobre o capital investido = resultado / custo de aquisicao. */
export function calcRoi(priceB2B: number, acquisitionCost: number, settings: PricingSettings): number {
  if (acquisitionCost <= 0) return 0
  return round2(calcResult(priceB2B, acquisitionCost, settings) / acquisitionCost)
}

/**
 * Folga de compra = custo maximo - preco da oferta.
 * Positivo = ainda ha espaco para comprar dentro da regra.
 */
export function calcSlack(priceB2B: number, offerPrice: number, settings: PricingSettings): number {
  return round2(calcMaxCost(priceB2B, settings) - offerPrice)
}

function priorityWeight(priority: CommercialPriority): number {
  switch (priority) {
    case "HIGH":
      return 100
    case "NORMAL":
      return 60
    case "LOW":
      return 30
  }
}

/**
 * Score interno (0-100). Sem IA nesta fase.
 *   - margem/resultado ............... 40%
 *   - ROI ............................ 30%
 *   - distancia ate o custo maximo ... 20%
 *   - prioridade comercial ........... 10%
 *
 * Cada componente e normalizado para 0-100 antes da ponderacao.
 */
export function calcScore(params: {
  priceB2B: number
  acquisitionCost: number
  priority: CommercialPriority
  settings: PricingSettings
}): number {
  const { priceB2B, acquisitionCost, priority, settings } = params
  if (priceB2B <= 0 || acquisitionCost <= 0) return 0

  const result = calcResult(priceB2B, acquisitionCost, settings)
  const roi = calcRoi(priceB2B, acquisitionCost, settings)
  const maxCost = calcMaxCost(priceB2B, settings)

  // Componente resultado: margem liquida como fracao do preco de venda.
  // Alvo saudavel ~30% do preco -> 100 pontos.
  const marginRatio = result / priceB2B
  const resultScore = clamp((marginRatio / 0.3) * 100, 0, 100)

  // Componente ROI: 60% de ROI ou mais -> 100 pontos.
  const roiScore = clamp((roi / 0.6) * 100, 0, 100)

  // Componente distancia ao custo maximo: quanto do teto ainda esta livre.
  const slackRatio = maxCost > 0 ? (maxCost - acquisitionCost) / maxCost : 0
  const slackScore = clamp((slackRatio / 0.3) * 100, 0, 100)

  // Componente prioridade comercial.
  const priorityScore = priorityWeight(priority)

  const score = resultScore * 0.4 + roiScore * 0.3 + slackScore * 0.2 + priorityScore * 0.1

  return Math.round(clamp(score, 0, 100))
}

/**
 * Status de aquisicao calculado automaticamente. A estrutura permite
 * sobrescrever manualmente via `manualStatus` no produto.
 */
export function calcStatus(params: {
  priceB2B: number
  acquisitionCost: number
  priority: CommercialPriority
  settings: PricingSettings
  manualStatus?: AcquisitionStatus | null
}): AcquisitionStatus {
  const { priceB2B, acquisitionCost, priority, settings, manualStatus } = params
  if (manualStatus) return manualStatus

  const maxCost = calcMaxCost(priceB2B, settings)

  // Acima do teto financeiro -> nunca comprar.
  if (acquisitionCost > maxCost) return "DO_NOT_BUY"

  const score = calcScore({ priceB2B, acquisitionCost, priority, settings })

  if (score >= 75) return "HUNT_AGGRESSIVE"
  if (score >= 55) return "HUNT"
  return "MONITOR"
}

/** Agrega todas as metricas derivadas de um produto. */
export function computeProductMetrics(product: Product, settings: PricingSettings): ProductMetrics {
  const maxCost = calcMaxCost(product.priceB2B, settings)
  return {
    priceB2B: product.priceB2B,
    currentCost: product.currentCost,
    maxCost,
    tax: calcTax(product.priceB2B, settings),
    result: calcResult(product.priceB2B, product.currentCost, settings),
    roi: calcRoi(product.priceB2B, product.currentCost, settings),
    differenceToMaxCost: round2(maxCost - product.currentCost),
    score: calcScore({
      priceB2B: product.priceB2B,
      acquisitionCost: product.currentCost,
      priority: product.priority,
      settings,
    }),
    status: calcStatus({
      priceB2B: product.priceB2B,
      acquisitionCost: product.currentCost,
      priority: product.priority,
      settings,
      manualStatus: product.manualStatus,
    }),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Valida que margem + impostos + custo somam 100%. */
export function validateSettings(settings: Pick<PricingSettings, "costPct" | "marginPct" | "taxPct">): boolean {
  const total = settings.costPct + settings.marginPct + settings.taxPct
  return Math.abs(total - 100) < 0.001
}
