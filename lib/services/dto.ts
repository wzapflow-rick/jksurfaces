import type {
  AcquisitionStatus,
  CommercialPriority,
  RadarSource,
  RadarStatus,
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

export const DEFAULT_SETTINGS = {
  costPct: 62,
  marginPct: 30,
  taxPct: 8,
}
