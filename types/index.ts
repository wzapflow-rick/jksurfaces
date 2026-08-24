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
