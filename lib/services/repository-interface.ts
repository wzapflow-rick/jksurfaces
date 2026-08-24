import type {
  Buyer,
  BuyerProduct,
  HuntMission,
  HuntSource,
  Offer,
  PricingSettings,
  Product,
  RadarOpportunity,
} from "@/types"
import type {
  BuyerInput,
  BuyerProductInput,
  HuntMissionInput,
  HuntSourceInput,
  OfferInput,
  ProductInput,
  RadarOpportunityInput,
  SettingsInput,
} from "./dto"

export interface Repository {
  // Settings
  getSettings(): Promise<PricingSettings>
  updateSettings(input: SettingsInput): Promise<PricingSettings>

  // Products
  listProducts(): Promise<Product[]>
  getProduct(id: string): Promise<Product | null>
  createProduct(input: ProductInput): Promise<Product>
  updateProduct(id: string, input: Partial<ProductInput>): Promise<Product | null>
  setProductActive(id: string, active: boolean): Promise<Product | null>

  // Buyers
  listBuyers(): Promise<Buyer[]>
  getBuyer(id: string): Promise<Buyer | null>
  createBuyer(input: BuyerInput): Promise<Buyer>
  updateBuyer(id: string, input: Partial<BuyerInput>): Promise<Buyer | null>
  setBuyerActive(id: string, active: boolean): Promise<Buyer | null>

  // Buyer <-> Product relationships
  listBuyerProducts(buyerId: string): Promise<BuyerProduct[]>
  listBuyerProductsByProduct(productId: string): Promise<BuyerProduct[]>
  addBuyerProduct(input: BuyerProductInput): Promise<BuyerProduct>
  removeBuyerProduct(id: string): Promise<void>

  // Offers (oportunidades manuais)
  listOffers(): Promise<Offer[]>
  createOffer(input: OfferInput): Promise<Offer>
  deleteOffer(id: string): Promise<void>

  // Radar JK (Fase 2)
  listRadarOpportunities(): Promise<RadarOpportunity[]>
  getRadarOpportunity(id: string): Promise<RadarOpportunity | null>
  createRadarOpportunity(input: RadarOpportunityInput): Promise<RadarOpportunity>
  updateRadarOpportunity(
    id: string,
    input: Partial<RadarOpportunityInput>,
  ): Promise<RadarOpportunity | null>
  deleteRadarOpportunity(id: string): Promise<void>

  // Central de Caça (Fase 4) — fontes
  listHuntSources(): Promise<HuntSource[]>
  getHuntSource(id: string): Promise<HuntSource | null>
  createHuntSource(input: HuntSourceInput): Promise<HuntSource>
  updateHuntSource(id: string, input: Partial<HuntSourceInput>): Promise<HuntSource | null>
  deleteHuntSource(id: string): Promise<void>

  // Central de Caça (Fase 4) — missões
  listHuntMissions(): Promise<HuntMission[]>
  getHuntMission(id: string): Promise<HuntMission | null>
  createHuntMission(input: HuntMissionInput): Promise<HuntMission>
  updateHuntMission(id: string, input: Partial<HuntMissionInput>): Promise<HuntMission | null>
  deleteHuntMission(id: string): Promise<void>
}
