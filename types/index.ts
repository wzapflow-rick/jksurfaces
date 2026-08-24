// Domain types for Radar JK. These are the shapes used across the UI and the
// data-access layer. They are intentionally decoupled from the Drizzle schema
// so we can swap the storage backend without touching the interface.

export type AcquisitionStatus = "HUNT_AGGRESSIVE" | "HUNT" | "MONITOR" | "DO_NOT_BUY"

export type CommercialPriority = "LOW" | "NORMAL" | "HIGH"

export interface PricingSettings {
  /** Percentual destinado ao custo de aquisicao (ex.: 62). */
  costPct: number
  /** Percentual de margem operacional/lucro (ex.: 30). */
  marginPct: number
  /** Percentual de impostos/notas (ex.: 8). */
  taxPct: number
  updatedAt: string
}

export interface Product {
  id: string
  sku: string
  name: string
  ean: string | null
  priceB2B: number
  currentCost: number
  priority: CommercialPriority
  /** Permite sobrescrever manualmente o status calculado. */
  manualStatus: AcquisitionStatus | null
  // Demanda
  monthlyDemand: number | null
  minQty: number | null
  maxQty: number | null
  notes: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

/** Metricas derivadas calculadas a partir de um produto + configuracoes. */
export interface ProductMetrics {
  priceB2B: number
  currentCost: number
  maxCost: number
  tax: number
  result: number
  roi: number
  differenceToMaxCost: number
  score: number
  status: AcquisitionStatus
}

export type ProductWithMetrics = Product & { metrics: ProductMetrics }

export interface Buyer {
  id: string
  name: string
  company: string | null
  phone: string | null
  email: string | null
  active: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface BuyerProduct {
  id: string
  buyerId: string
  productId: string
  maxPrice: number | null
  minQty: number | null
  maxQty: number | null
  frequency: string | null
  notes: string | null
  createdAt: string
}

/** Oferta / oportunidade cadastrada manualmente nesta fase. */
export interface Offer {
  id: string
  productId: string
  source: string
  url: string | null
  price: number
  availableQty: number | null
  shipping: number
  notes: string | null
  createdAt: string
}

export interface OfferWithMetrics extends Offer {
  product: Product
  metrics: {
    totalCost: number
    maxCost: number
    result: number
    roi: number
    score: number
    status: AcquisitionStatus
    slack: number
  }
}

/* =============================================================================
   RADAR JK — Fase 2
   Oportunidades de compra registradas manualmente (OLX, Mercado Livre, Chatuba,
   marketplaces). Entidade independente dos produtos/ofertas da Fase 1.
   ============================================================================= */

/** Fonte de onde a oportunidade foi encontrada. */
export type RadarSource = "OLX" | "MERCADO_LIVRE" | "CHATUBA" | "MARKETPLACE" | "OUTRO"

/** Estágio da oportunidade no fluxo de compra/revenda. */
export type RadarStatus =
  | "ENCONTRADA"
  | "EM_ANALISE"
  | "APROVADA"
  | "COMPRADA"
  | "VENDIDA"
  | "DESCARTADA"

/** Classificação visual do quão boa é a oportunidade. */
export type RadarClassification = "EXCELENTE" | "BOA" | "AVALIAR" | "NAO_VALE"

/**
 * Recomendação de caça (Fase 3): resultado da comparação entre o preço
 * encontrado e os limites de compra (recomendado / máximo).
 */
export type RadarRecommendation = "CACAR" | "AVALIAR" | "NAO_VALE"

export interface RadarOpportunity {
  id: string
  sku: string | null
  name: string
  brand: string | null
  source: RadarSource
  url: string | null
  /** Preço anunciado (unitário) na fonte. */
  announcedPrice: number
  availableQty: number | null
  shipping: number
  otherCosts: number
  /** Preço de venda praticado pela JK. */
  salePrice: number
  /** Data em que a oportunidade foi encontrada (ISO). */
  opportunityDate: string
  notes: string | null
  status: RadarStatus
  createdAt: string
  updatedAt: string
}

/** Métricas derivadas de uma oportunidade do Radar. */
export interface RadarMetrics {
  /** Custo total de aquisição = preço anunciado + frete + outros custos. */
  acquisitionCost: number
  /** Valor dos 30% (custos/serviços da operação) sobre o preço de venda. */
  operationalCost: number
  /** Valor dos 8% (notas/impostos) sobre o preço de venda. */
  taxCost: number
  /** Resultado estimado = venda − aquisição − 30% − 8%. */
  estimatedResult: number
  /** Margem sobre o preço de venda (resultado / venda). */
  marginPct: number
  /** Retorno sobre o capital investido (resultado / aquisição). */
  roi: number
  classification: RadarClassification

  /* ---- Calculadora reversa / caça (Fase 3) ---- */
  /** Valor restante do preço de venda após deduzir os 38% (30% + 8%). */
  netAfterDeductions: number
  /**
   * Preço MÁXIMO que a JK pode pagar PELO PRODUTO (fora frete/outros) para o
   * resultado ainda ficar em zero, dado o frete e outros custos informados.
   */
  maxPurchasePrice: number
  /**
   * Preço RECOMENDADO de compra: mais conservador que o máximo, reservando uma
   * margem-alvo de resultado para a caça valer a pena.
   */
  recommendedPurchasePrice: number
  /** Recomendação de caça a partir do preço encontrado vs. limites. */
  recommendation: RadarRecommendation
}

export type RadarOpportunityWithMetrics = RadarOpportunity & { metrics: RadarMetrics }
