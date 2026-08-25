import type {
  AcquisitionStatus,
  CommercialPriority,
  HuntPriority,
  HuntSourceType,
  HuntStatus,
  MatchMethod,
  MatchStatus,
  RadarSource,
  RadarStatus,
  SearchQueryType,
} from "@/types"

export interface ProductInput {
  sku: string
  name: string
  ean: string | null
  priceB2B: number
  currentCost: number
  priority: CommercialPriority
  manualStatus: AcquisitionStatus | null
  monthlyDemand: number | null
  minQty: number | null
  maxQty: number | null
  notes: string | null
  active: boolean
}

export interface BuyerInput {
  name: string
  company: string | null
  phone: string | null
  email: string | null
  active: boolean
  notes: string | null
}

export interface BuyerProductInput {
  buyerId: string
  productId: string
  maxPrice: number | null
  minQty: number | null
  maxQty: number | null
  frequency: string | null
  notes: string | null
}

export interface OfferInput {
  productId: string
  source: string
  url: string | null
  price: number
  availableQty: number | null
  shipping: number
  notes: string | null
}

export interface SettingsInput {
  costPct: number
  marginPct: number
  taxPct: number
}

export interface RadarOpportunityInput {
  sku: string | null
  name: string
  brand: string | null
  source: RadarSource
  url: string | null
  announcedPrice: number
  availableQty: number | null
  shipping: number
  otherCosts: number
  salePrice: number
  opportunityDate: string
  notes: string | null
  status: RadarStatus
}

export interface HuntSourceInput {
  name: string
  type: HuntSourceType
  urlBase: string | null
  searchUrlTemplate: string | null
  active: boolean
}

export interface HuntMissionInput {
  name: string
  description: string | null
  sku: string | null
  searchTerm: string
  brand: string | null
  category: string | null
  expectedSalePrice: number
  sourceIds: string[]
  priority: HuntPriority
  status: HuntStatus
  notes: string | null
}

/** Entrada de uma consulta inteligente a persistir (Fase 5). */
export interface SearchQueryInput {
  missionId: string
  sourceId: string | null
  query: string
  type: SearchQueryType
  priority: number
}

/** Entrada de uma oferta capturada a persistir (Fase 6.1). */
export interface SourceOfferInput {
  source: string
  externalId: string | null
  productTitle: string
  sku: string | null
  ean: string | null
  brand: string | null
  url: string
  imageUrl: string | null
  price: number
  shipping: number | null
  availability: number | null
  seller: string | null
  capturedAt: string
  matchStatus: MatchStatus
  matchedProductId: string | null
  matchConfidence: number
  matchMethod: MatchMethod
  rawData: Record<string, unknown> | null
}

export const DEFAULT_SETTINGS = {
  costPct: 62,
  marginPct: 30,
  taxPct: 8,
}

/**
 * Fontes de caça padrão. Só têm template de busca as fontes cuja estrutura de
 * pesquisa é pública e conhecida — nunca inventamos URLs. `{q}` é substituído
 * pelo termo de busca já codificado.
 */
export const DEFAULT_HUNT_SOURCES: Omit<HuntSourceInput, "active">[] = [
  { name: "OLX", type: "MARKETPLACE", urlBase: "https://www.olx.com.br", searchUrlTemplate: "https://www.olx.com.br/brasil?q={q}" },
  { name: "Mercado Livre", type: "MARKETPLACE", urlBase: "https://www.mercadolivre.com.br", searchUrlTemplate: "https://lista.mercadolivre.com.br/{q}" },
  { name: "Facebook Marketplace", type: "MARKETPLACE", urlBase: "https://www.facebook.com/marketplace", searchUrlTemplate: "https://www.facebook.com/marketplace/search/?query={q}" },
  { name: "Shopee", type: "MARKETPLACE", urlBase: "https://shopee.com.br", searchUrlTemplate: "https://shopee.com.br/search?keyword={q}" },
  { name: "Loja física", type: "LOJA_FISICA", urlBase: null, searchUrlTemplate: null },
  { name: "Fornecedor", type: "FORNECEDOR", urlBase: null, searchUrlTemplate: null },
  { name: "Outro", type: "OUTRO", urlBase: null, searchUrlTemplate: null },
]
