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
}

export type RadarOpportunityWithMetrics = RadarOpportunity & { metrics: RadarMetrics }

/* =============================================================================
   CENTRAL DE CAÇA — Fase 4
   Missões de aquisição e fontes onde procurar. Sem scraping/bots/IA: apenas a
   estrutura inteligente que organiza o que caçar, onde e por quanto.
   ============================================================================= */

/** Prioridade da missão, definida pelo usuário. */
export type HuntPriority = "ALTA" | "MEDIA" | "BAIXA"

/** Estágio da missão de caça. */
export type HuntStatus = "ATIVA" | "PAUSADA" | "CONCLUIDA" | "CANCELADA"

/** Tipo de fonte de caça. */
export type HuntSourceType = "MARKETPLACE" | "LOJA_FISICA" | "FORNECEDOR" | "OUTRO"

/** Fonte onde procurar produtos (OLX, Mercado Livre, loja física, etc.). */
export interface HuntSource {
  id: string
  name: string
  type: HuntSourceType
  /** URL base opcional (home da fonte). */
  urlBase: string | null
  /**
   * Template de busca conhecido, com o marcador `{q}` para o termo. Só é
   * preenchido para fontes cuja estrutura de pesquisa é conhecida. Nunca
   * inventar URLs de busca.
   */
  searchUrlTemplate: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

/** Fonte com o link de pesquisa já montado (quando possível) para um termo. */
export interface HuntSourceLink extends HuntSource {
  /** URL final para abrir: busca montada, senão urlBase, senão null. */
  openUrl: string | null
  /** Se `openUrl` veio de um template de busca (true) ou da urlBase (false). */
  isSearch: boolean
}

export interface HuntMission {
  id: string
  name: string
  description: string | null
  sku: string | null
  /** Produto / termo de busca principal. */
  searchTerm: string
  brand: string | null
  category: string | null
  /** Preço de venda esperado pela JK. */
  expectedSalePrice: number
  /** IDs das fontes desejadas para esta missão. */
  sourceIds: string[]
  priority: HuntPriority
  status: HuntStatus
  notes: string | null
  createdAt: string
  updatedAt: string
}

/** Métricas derivadas de uma missão (via motor financeiro reverso da Fase 3). */
export interface HuntMissionMetrics {
  /** Preço máximo de aquisição (equilíbrio). */
  maxAcquisition: number
  /** Preço recomendado de aquisição (margem-alvo). */
  recommendedAcquisition: number
  /** Resultado estimado comprando no preço recomendado. */
  recommendedResult: number
  /** Folga entre máximo e recomendado. */
  buffer: number
  /** Margem-alvo aplicada (fração do preço de venda). */
  targetMarginPct: number
  /** Potencial econômico determinístico (0–100). */
  potentialScore: number
  /** Peso da prioridade definida pelo usuário. */
  priorityWeight: number
  /** Score composto de ordenação (prioridade + potencial). */
  rankScore: number
}

export type HuntMissionWithMetrics = HuntMission & {
  metrics: HuntMissionMetrics
  /** Fontes selecionadas, já resolvidas (ativas e existentes). */
  sources: HuntSource[]
}
