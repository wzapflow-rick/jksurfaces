import type { Buyer, BuyerProduct, Offer, PricingSettings, Product } from "@/types"
import { SEED_PRODUCTS } from "@/lib/db/seed-data"
import { DEFAULT_SETTINGS } from "./dto"
import type {
  BuyerInput,
  BuyerProductInput,
  OfferInput,
  ProductInput,
  SettingsInput,
} from "./dto"
import type { Repository } from "./repository-interface"

/**
 * Backend em memoria usado no preview e sempre que DATABASE_URL nao esta
 * definido. Os 12 produtos reais da JK sao carregados como seed. Compradores,
 * ofertas e vendas comecam VAZIOS (nao criamos dados ficticios).
 *
 * Persistencia entre reinicializacoes acontece somente com o backend
 * PostgreSQL. Este backend existe para deixar a fundacao navegavel antes de
 * conectar o banco.
 */

interface Store {
  products: Product[]
  buyers: Buyer[]
  buyerProducts: BuyerProduct[]
  offers: Offer[]
  settings: PricingSettings
}

const globalForStore = globalThis as unknown as { __radarJkStore?: Store }

function nowIso() {
  return new Date().toISOString()
}

function seedStore(): Store {
  const now = nowIso()
  return {
    products: SEED_PRODUCTS.map((p) => ({
      id: crypto.randomUUID(),
      sku: p.sku,
      name: p.name,
      ean: p.ean,
      priceB2B: p.priceB2B,
      currentCost: p.currentCost,
      priority: p.priority,
      manualStatus: null,
      monthlyDemand: null,
      minQty: null,
      maxQty: null,
      notes: null,
      active: true,
      createdAt: now,
      updatedAt: now,
    })),
    buyers: [],
    buyerProducts: [],
    offers: [],
    settings: { ...DEFAULT_SETTINGS, updatedAt: now },
  }
}

const store: Store = globalForStore.__radarJkStore ?? seedStore()
globalForStore.__radarJkStore = store

export const memoryRepo: Repository = {
  async getSettings() {
    return { ...store.settings }
  },
  async updateSettings(input: SettingsInput) {
    store.settings = { ...input, updatedAt: nowIso() }
    return { ...store.settings }
  },

  async listProducts() {
    return store.products.map((p) => ({ ...p }))
  },
  async getProduct(id) {
    const found = store.products.find((p) => p.id === id)
    return found ? { ...found } : null
  },
  async createProduct(input: ProductInput) {
    const now = nowIso()
    const product: Product = { id: crypto.randomUUID(), ...input, createdAt: now, updatedAt: now }
    store.products.push(product)
    return { ...product }
  },
  async updateProduct(id, input) {
    const idx = store.products.findIndex((p) => p.id === id)
    if (idx === -1) return null
    store.products[idx] = { ...store.products[idx], ...input, updatedAt: nowIso() }
    return { ...store.products[idx] }
  },
  async setProductActive(id, active) {
    return this.updateProduct(id, { active })
  },

  async listBuyers() {
    return store.buyers.map((b) => ({ ...b }))
  },
  async getBuyer(id) {
    const found = store.buyers.find((b) => b.id === id)
    return found ? { ...found } : null
  },
  async createBuyer(input: BuyerInput) {
    const now = nowIso()
    const buyer: Buyer = { id: crypto.randomUUID(), ...input, createdAt: now, updatedAt: now }
    store.buyers.push(buyer)
    return { ...buyer }
  },
  async updateBuyer(id, input) {
    const idx = store.buyers.findIndex((b) => b.id === id)
    if (idx === -1) return null
    store.buyers[idx] = { ...store.buyers[idx], ...input, updatedAt: nowIso() }
    return { ...store.buyers[idx] }
  },
  async setBuyerActive(id, active) {
    return this.updateBuyer(id, { active })
  },

  async listBuyerProducts(buyerId) {
    return store.buyerProducts.filter((bp) => bp.buyerId === buyerId).map((bp) => ({ ...bp }))
  },
  async addBuyerProduct(input: BuyerProductInput) {
    const bp: BuyerProduct = { id: crypto.randomUUID(), ...input, createdAt: nowIso() }
    store.buyerProducts.push(bp)
    return { ...bp }
  },
  async removeBuyerProduct(id) {
    store.buyerProducts = store.buyerProducts.filter((bp) => bp.id !== id)
  },

  async listOffers() {
    return store.offers.map((o) => ({ ...o })).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  },
  async createOffer(input: OfferInput) {
    const offer: Offer = { id: crypto.randomUUID(), ...input, createdAt: nowIso() }
    store.offers.push(offer)
    return { ...offer }
  },
  async deleteOffer(id) {
    store.offers = store.offers.filter((o) => o.id !== id)
  },
}
