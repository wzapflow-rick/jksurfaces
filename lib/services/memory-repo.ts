import type {
  Buyer,
  BuyerProduct,
  HuntMission,
  HuntSource,
  Offer,
  PricingSettings,
  Product,
  RadarOpportunity,
  SearchQuery,
  SourceOffer,
  SourceOfferPriceHistoryEntry,
} from "@/types"
import { SEED_PRODUCTS } from "@/lib/db/seed-data"
import { DEFAULT_HUNT_SOURCES, DEFAULT_SETTINGS } from "./dto"
import type {
  BuyerInput,
  BuyerProductInput,
  HuntMissionInput,
  HuntSourceInput,
  OfferInput,
  ProductInput,
  RadarOpportunityInput,
  SearchQueryInput,
  SettingsInput,
  SourceOfferInput,
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
  radarOpportunities: RadarOpportunity[]
  huntSources: HuntSource[]
  huntMissions: HuntMission[]
  huntSearchQueries: SearchQuery[]
  sourceOffers: SourceOffer[]
  sourceOfferPriceHistory: SourceOfferPriceHistoryEntry[]
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
    radarOpportunities: [],
    huntSources: DEFAULT_HUNT_SOURCES.map((s) => ({
      id: crypto.randomUUID(),
      name: s.name,
      type: s.type,
      urlBase: s.urlBase,
      searchUrlTemplate: s.searchUrlTemplate,
      active: true,
      createdAt: now,
      updatedAt: now,
    })),
    huntMissions: [],
    huntSearchQueries: [],
    sourceOffers: [],
    sourceOfferPriceHistory: [],
    settings: { ...DEFAULT_SETTINGS, updatedAt: now },
  }
}

const store: Store = globalForStore.__radarJkStore ?? seedStore()
// Backfill de coleções adicionadas em fases posteriores, para que um store já
// em cache (HMR/dev) não quebre ao acessar campos novos como radarOpportunities.
store.radarOpportunities ??= []
if (!store.huntSources || store.huntSources.length === 0) {
  const now = nowIso()
  store.huntSources = DEFAULT_HUNT_SOURCES.map((s) => ({
    id: crypto.randomUUID(),
    name: s.name,
    type: s.type,
    urlBase: s.urlBase,
    searchUrlTemplate: s.searchUrlTemplate,
    active: true,
    createdAt: now,
    updatedAt: now,
  }))
}
store.huntMissions ??= []
store.huntSearchQueries ??= []
store.sourceOffers ??= []
store.sourceOfferPriceHistory ??= []
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
  async listBuyerProductsByProduct(productId) {
    return store.buyerProducts.filter((bp) => bp.productId === productId).map((bp) => ({ ...bp }))
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

  async listRadarOpportunities() {
    return store.radarOpportunities
      .map((o) => ({ ...o }))
      .sort((a, b) => (a.opportunityDate < b.opportunityDate ? 1 : -1))
  },
  async getRadarOpportunity(id) {
    const found = store.radarOpportunities.find((o) => o.id === id)
    return found ? { ...found } : null
  },
  async createRadarOpportunity(input: RadarOpportunityInput) {
    const now = nowIso()
    const opportunity: RadarOpportunity = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
    }
    store.radarOpportunities.push(opportunity)
    return { ...opportunity }
  },
  async updateRadarOpportunity(id, input) {
    const idx = store.radarOpportunities.findIndex((o) => o.id === id)
    if (idx === -1) return null
    store.radarOpportunities[idx] = {
      ...store.radarOpportunities[idx],
      ...input,
      updatedAt: nowIso(),
    }
    return { ...store.radarOpportunities[idx] }
  },
  async deleteRadarOpportunity(id) {
    store.radarOpportunities = store.radarOpportunities.filter((o) => o.id !== id)
  },

  async listHuntSources() {
    return store.huntSources
      .map((s) => ({ ...s }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
  },
  async getHuntSource(id) {
    const found = store.huntSources.find((s) => s.id === id)
    return found ? { ...found } : null
  },
  async createHuntSource(input: HuntSourceInput) {
    const now = nowIso()
    const source: HuntSource = { id: crypto.randomUUID(), ...input, createdAt: now, updatedAt: now }
    store.huntSources.push(source)
    return { ...source }
  },
  async updateHuntSource(id, input) {
    const idx = store.huntSources.findIndex((s) => s.id === id)
    if (idx === -1) return null
    store.huntSources[idx] = { ...store.huntSources[idx], ...input, updatedAt: nowIso() }
    return { ...store.huntSources[idx] }
  },
  async deleteHuntSource(id) {
    store.huntSources = store.huntSources.filter((s) => s.id !== id)
  },

  async listHuntMissions() {
    return store.huntMissions
      .map((m) => ({ ...m }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  },
  async getHuntMission(id) {
    const found = store.huntMissions.find((m) => m.id === id)
    return found ? { ...found } : null
  },
  async createHuntMission(input: HuntMissionInput) {
    const now = nowIso()
    const mission: HuntMission = { id: crypto.randomUUID(), ...input, createdAt: now, updatedAt: now }
    store.huntMissions.push(mission)
    return { ...mission }
  },
  async updateHuntMission(id, input) {
    const idx = store.huntMissions.findIndex((m) => m.id === id)
    if (idx === -1) return null
    store.huntMissions[idx] = { ...store.huntMissions[idx], ...input, updatedAt: nowIso() }
    return { ...store.huntMissions[idx] }
  },
  async deleteHuntMission(id) {
    store.huntMissions = store.huntMissions.filter((m) => m.id !== id)
    // Cascata: remove as consultas inteligentes da missão.
    store.huntSearchQueries = store.huntSearchQueries.filter((q) => q.missionId !== id)
  },

  async listSearchQueriesByMission(missionId) {
    return store.huntSearchQueries
      .filter((q) => q.missionId === missionId)
      .map((q) => ({ ...q }))
      .sort((a, b) => b.priority - a.priority)
  },
  async replaceSearchQueriesForMission(missionId: string, inputs: SearchQueryInput[]) {
    const now = nowIso()
    store.huntSearchQueries = store.huntSearchQueries.filter((q) => q.missionId !== missionId)
    const created: SearchQuery[] = inputs.map((i) => ({
      id: crypto.randomUUID(),
      missionId: i.missionId,
      sourceId: i.sourceId,
      query: i.query,
      type: i.type,
      priority: i.priority,
      createdAt: now,
    }))
    store.huntSearchQueries.push(...created)
    return created.map((q) => ({ ...q })).sort((a, b) => b.priority - a.priority)
  },
  async deleteSearchQueriesForMission(missionId) {
    store.huntSearchQueries = store.huntSearchQueries.filter((q) => q.missionId !== missionId)
  },

  async listSourceOffers() {
    return store.sourceOffers
      .map((o) => ({ ...o }))
      .sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1))
  },
  async getSourceOffer(id) {
    const found = store.sourceOffers.find((o) => o.id === id)
    return found ? { ...found } : null
  },
  async findSourceOfferForDedupe(source, externalId, url) {
    const found = store.sourceOffers.find((o) => {
      if (o.source !== source) return false
      if (externalId) return o.externalId === externalId
      return o.externalId === null && o.url === url
    })
    return found ? { ...found } : null
  },
  async createSourceOffer(input: SourceOfferInput) {
    const now = nowIso()
    const offer: SourceOffer = { id: crypto.randomUUID(), ...input, createdAt: now, updatedAt: now }
    store.sourceOffers.push(offer)
    return { ...offer }
  },
  async updateSourceOffer(id, input) {
    const idx = store.sourceOffers.findIndex((o) => o.id === id)
    if (idx === -1) return null
    store.sourceOffers[idx] = { ...store.sourceOffers[idx], ...input, updatedAt: nowIso() }
    return { ...store.sourceOffers[idx] }
  },
  async deleteSourceOffer(id) {
    store.sourceOffers = store.sourceOffers.filter((o) => o.id !== id)
    store.sourceOfferPriceHistory = store.sourceOfferPriceHistory.filter((h) => h.offerId !== id)
  },

  async listSourceOfferPriceHistory(offerId) {
    return store.sourceOfferPriceHistory
      .filter((h) => h.offerId === offerId)
      .map((h) => ({ ...h }))
      .sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1))
  },
  async addSourceOfferPriceHistory(offerId, price, shipping, capturedAt) {
    const entry: SourceOfferPriceHistoryEntry = {
      id: crypto.randomUUID(),
      offerId,
      price,
      shipping,
      capturedAt,
    }
    store.sourceOfferPriceHistory.push(entry)
    return { ...entry }
  },
}
