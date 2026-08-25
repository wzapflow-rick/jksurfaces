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

/* =============================================================================
   INTELIGÊNCIA DE BUSCA — Fase 5
   Consultas geradas a partir de uma missão. Apenas organizam o QUE e ONDE
   pesquisar; não fazem scraping, não chamam APIs e não recalculam a oportunidade.
   ============================================================================= */

/** Tipo de consulta, do mais específico ao mais amplo. */
export type SearchQueryType =
  | "EXACT"
  | "BRAND_MODEL"
  | "PRODUCT_MODEL"
  | "PRODUCT_BRAND"
  | "SKU"
  | "SKU_BRAND"
  | "BROAD"

/** Consulta inteligente persistida, associada a uma missão (e opcionalmente a uma fonte). */
export interface SearchQuery {
  id: string
  missionId: string
  /** Fonte específica quando aplicável; null = consulta canônica da missão. */
  sourceId: string | null
  query: string
  type: SearchQueryType
  /** Peso de ordenação (0–100). Nunca afeta o cálculo financeiro. */
  priority: number
  createdAt: string
}

/* =============================================================================
   CAPTURA DE OFERTAS — Fase 6.1
   Primeira integração real de captura de ofertas. A arquitetura é baseada em
   "Source Adapters": cada fonte implementa a mesma interface e converte seus
   resultados públicos para a entidade interna comum `SourceOffer`. Nesta fase
   apenas a Chatuba está implementada (via API pública VTEX de catálogo).
   ============================================================================= */

/**
 * Chave da fonte de captura. Extensível: novas fontes (Mercado Livre…) apenas
 * acrescentam valores aqui e registram um adapter — o Radar não muda.
 *
 * OLX (Fase 6.2): a chave existe e o adapter está registrado, mas a captura ao
 * vivo NÃO está disponível — todo o site público da OLX está atrás do
 * Cloudflare Bot Management (HTTP 403 a qualquer cliente automatizado) e a API
 * oficial serve apenas para gerenciar os próprios anúncios, não para buscar
 * anúncios públicos de terceiros. Conforme a regra da fase, NÃO criamos
 * mecanismo para contornar essa proteção; o adapter degrada com elegância.
 */
export type OfferSource = "CHATUBA" | "OLX"

/**
 * Método pelo qual uma oferta foi associada a um produto JK, do mais forte
 * (identificador exato) ao mais fraco (nome). Ordena a prioridade do matching.
 */
export type MatchMethod =
  | "EAN_EXACT"
  | "SKU_EXACT"
  | "SKU_NORMALIZED"
  | "BRAND_MODEL"
  | "NAME_MATCH"
  | "UNKNOWN"

/**
 * Situação do match de uma oferta:
 *  - MATCHED ...... associação de alta confiança (>= 0,9);
 *  - REVIEW ....... associação de baixa confiança, precisa revisão humana;
 *  - UNMATCHED .... nenhuma associação encontrada.
 * Baixa confiança NUNCA é tratada como certeza.
 */
export type MatchStatus = "MATCHED" | "REVIEW" | "UNMATCHED"

/**
 * Condição do item, normalizada para o padrão interno (Fase 6.3):
 *  - NEW ...... novo / lacrado / na caixa;
 *  - USED ..... usado / seminovo / já instalado;
 *  - UNKNOWN .. sem sinal claro OU sinais conflitantes (vai para revisão).
 */
export type OfferCondition = "NEW" | "USED" | "UNKNOWN"

/**
 * Origem de um campo de uma oferta importada (Fase 6.3), para a revisão humana:
 *  - EXTRACTED .. o parser reconheceu o valor no anúncio;
 *  - EDITED ..... o usuário corrigiu/digitou manualmente;
 *  - MISSING .... não identificado (inclui quantidade assumida como 1).
 */
export type FieldOrigin = "EXTRACTED" | "EDITED" | "MISSING"

/**
 * Oferta capturada e normalizada de uma fonte externa. Guarda apenas os dados
 * necessários para análise — nunca HTML completo. `rawData` mantém um resumo
 * mínimo dos campos brutos úteis (não a página inteira).
 */
export interface SourceOffer {
  id: string
  source: string
  /** Identificador da oferta na fonte (ex.: productId VTEX). */
  externalId: string | null
  productTitle: string
  sku: string | null
  ean: string | null
  brand: string | null
  url: string
  imageUrl: string | null
  /** Preço TOTAL anunciado. Para captura da Chatuba já é o preço unitário. */
  price: number
  shipping: number | null
  /** Quantidade disponível informada pela fonte (null = desconhecida). */
  availability: number | null
  seller: string | null
  /** Momento da captura (ISO). */
  capturedAt: string
  /* ---- Importação inteligente (Fase 6.3) ---- */
  /** Unidades do anúncio (lote). 1 = unidade avulsa. */
  quantity: number
  /**
   * Preço por unidade = price / quantity. É o valor que o motor financeiro usa
   * na comparação com o preço de venda JK. null = usar `price` diretamente.
   */
  unitPrice: number | null
  /** true quando o anúncio é um lote (quantity > 1). */
  isLot: boolean
  condition: OfferCondition | null
  /** Preço negociável sinalizado no anúncio (não altera o preço). */
  priceNegotiable: boolean
  /** Localização "Cidade - UF" quando informada. */
  location: string | null
  /** Observações livres da importação. */
  notes: string | null
  /** Origem por campo (auditoria da importação): extraído / editado / ausente. */
  fieldOrigins: Record<string, FieldOrigin> | null
  /* ---- Matching persistido ---- */
  matchStatus: MatchStatus
  matchedProductId: string | null
  matchConfidence: number
  matchMethod: MatchMethod
  /** Resumo mínimo dos dados brutos úteis (não a resposta completa). */
  rawData: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

/** Resultado do serviço de matching de uma oferta contra os produtos JK. */
export interface OfferMatchResult {
  matched: boolean
  productId: string | null
  confidence: number
  matchMethod: MatchMethod
  status: MatchStatus
}

/** Entrada do histórico de preço de uma oferta. */
export interface SourceOfferPriceHistoryEntry {
  id: string
  offerId: string
  price: number
  shipping: number | null
  capturedAt: string
}

/**
 * Métricas de uma oferta contra a operação JK, calculadas SEMPRE com o motor
 * financeiro das Fases 3/4 (nunca duplicado). Só existem quando há um preço de
 * venda de referência (produto JK associado ou venda esperada da missão).
 */
export interface SourceOfferMetrics {
  /** Preço de venda de referência usado (produto JK ou missão). */
  salePrice: number
  maxPurchasePrice: number
  recommendedPurchasePrice: number
  estimatedResult: number
  /** Diferença entre o preço máximo JK e o preço da oferta (positivo = folga). */
  differenceToMax: number
  recommendation: RadarRecommendation
  classification: RadarClassification
}

/** Oferta com o produto JK vinculado (quando houver) e métricas do motor JK. */
export interface SourceOfferWithMetrics extends SourceOffer {
  product: Product | null
  metrics: SourceOfferMetrics | null
}
