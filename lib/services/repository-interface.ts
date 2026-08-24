import type { Buyer, BuyerProduct, Offer, PricingSettings, Product } from "@/types"
import type {
  BuyerInput,
  BuyerProductInput,
  OfferInput,
  ProductInput,
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
  addBuyerProduct(input: BuyerProductInput): Promise<BuyerProduct>
  removeBuyerProduct(id: string): Promise<void>

  // Offers (oportunidades manuais)
  listOffers(): Promise<Offer[]>
  createOffer(input: OfferInput): Promise<Offer>
  deleteOffer(id: string): Promise<void>
}
