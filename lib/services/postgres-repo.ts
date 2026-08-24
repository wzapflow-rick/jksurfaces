import { desc, eq } from "drizzle-orm"
import type {
  AcquisitionStatus,
  Buyer,
  BuyerProduct,
  CommercialPriority,
  HuntMission,
  HuntPriority,
  HuntSource,
  HuntSourceType,
  HuntStatus,
  Offer,
  PricingSettings,
  Product,
  RadarOpportunity,
  RadarSource,
  RadarStatus,
  SearchQuery,
  SearchQueryType,
} from "@/types"
import { db, schema } from "@/lib/db/client"
import { DEFAULT_SETTINGS } from "./dto"
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
} from "./dto"
import type { Repository } from "./repository-interface"

/**
 * Backend PostgreSQL (Drizzle). Ativo automaticamente quando DATABASE_URL
 * esta definido. Converte os numeric do Postgres (string) para number e
 * normaliza timestamps para ISO string, mantendo a mesma interface do backend
 * em memoria.
 */

function num(value: string | null): number | null {
  if (value === null) return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

function iso(value: Date | null): string {
  return (value ?? new Date()).toISOString()
}

type ProductRow = typeof schema.products.$inferSelect
type BuyerRow = typeof schema.buyers.$inferSelect
type BuyerProductRow = typeof schema.buyerProducts.$inferSelect
type OfferRow = typeof schema.offers.$inferSelect
type RadarRow = typeof schema.radarOpportunities.$inferSelect
type HuntSourceRow = typeof schema.huntSources.$inferSelect
type HuntMissionRow = typeof schema.huntMissions.$inferSelect
type SearchQueryRow = typeof schema.huntSearchQueries.$inferSelect

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    ean: row.ean,
    priceB2B: num(row.priceB2b) ?? 0,
    currentCost: num(row.currentCost) ?? 0,
    priority: row.priority as CommercialPriority,
    manualStatus: (row.manualStatus as AcquisitionStatus | null) ?? null,
    monthlyDemand: row.monthlyDemand,
    minQty: row.minQty,
    maxQty: row.maxQty,
    notes: row.notes,
    active: row.active,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}

function mapBuyer(row: BuyerRow): Buyer {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    phone: row.phone,
    email: row.email,
    active: row.active,
    notes: row.notes,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}

function mapBuyerProduct(row: BuyerProductRow): BuyerProduct {
  return {
    id: row.id,
    buyerId: row.buyerId,
    productId: row.productId,
    maxPrice: num(row.maxPrice),
    minQty: row.minQty,
    maxQty: row.maxQty,
    frequency: row.frequency,
    notes: row.notes,
    createdAt: iso(row.createdAt),
  }
}

function mapOffer(row: OfferRow): Offer {
  return {
    id: row.id,
    productId: row.productId,
    source: row.source,
    url: row.url,
    price: num(row.price) ?? 0,
    availableQty: row.availableQty,
    shipping: num(row.shipping) ?? 0,
    notes: row.notes,
    createdAt: iso(row.createdAt),
  }
}

function mapRadar(row: RadarRow): RadarOpportunity {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    brand: row.brand,
    source: row.source as RadarSource,
    url: row.url,
    announcedPrice: num(row.announcedPrice) ?? 0,
    availableQty: row.availableQty,
    shipping: num(row.shipping) ?? 0,
    otherCosts: num(row.otherCosts) ?? 0,
    salePrice: num(row.salePrice) ?? 0,
    opportunityDate: iso(row.opportunityDate),
    notes: row.notes,
    status: row.status as RadarStatus,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}

function radarValues(input: Partial<RadarOpportunityInput>) {
  const values: Record<string, unknown> = {}
  if (input.sku !== undefined) values.sku = input.sku
  if (input.name !== undefined) values.name = input.name
  if (input.brand !== undefined) values.brand = input.brand
  if (input.source !== undefined) values.source = input.source
  if (input.url !== undefined) values.url = input.url
  if (input.announcedPrice !== undefined) values.announcedPrice = String(input.announcedPrice)
  if (input.availableQty !== undefined) values.availableQty = input.availableQty
  if (input.shipping !== undefined) values.shipping = String(input.shipping)
  if (input.otherCosts !== undefined) values.otherCosts = String(input.otherCosts)
  if (input.salePrice !== undefined) values.salePrice = String(input.salePrice)
  if (input.opportunityDate !== undefined) values.opportunityDate = new Date(input.opportunityDate)
  if (input.notes !== undefined) values.notes = input.notes
  if (input.status !== undefined) values.status = input.status
  return values
}

function mapHuntSource(row: HuntSourceRow): HuntSource {
  return {
    id: row.id,
    name: row.name,
    type: row.type as HuntSourceType,
    urlBase: row.urlBase,
    searchUrlTemplate: row.searchUrlTemplate,
    active: row.active,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}

function huntSourceValues(input: Partial<HuntSourceInput>) {
  const values: Record<string, unknown> = {}
  if (input.name !== undefined) values.name = input.name
  if (input.type !== undefined) values.type = input.type
  if (input.urlBase !== undefined) values.urlBase = input.urlBase
  if (input.searchUrlTemplate !== undefined) values.searchUrlTemplate = input.searchUrlTemplate
  if (input.active !== undefined) values.active = input.active
  return values
}

function mapHuntMission(row: HuntMissionRow): HuntMission {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    sku: row.sku,
    searchTerm: row.searchTerm,
    brand: row.brand,
    category: row.category,
    expectedSalePrice: num(row.expectedSalePrice) ?? 0,
    sourceIds: row.sourceIds ?? [],
    priority: row.priority as HuntPriority,
    status: row.status as HuntStatus,
    notes: row.notes,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}

function huntMissionValues(input: Partial<HuntMissionInput>) {
  const values: Record<string, unknown> = {}
  if (input.name !== undefined) values.name = input.name
  if (input.description !== undefined) values.description = input.description
  if (input.sku !== undefined) values.sku = input.sku
  if (input.searchTerm !== undefined) values.searchTerm = input.searchTerm
  if (input.brand !== undefined) values.brand = input.brand
  if (input.category !== undefined) values.category = input.category
  if (input.expectedSalePrice !== undefined) values.expectedSalePrice = String(input.expectedSalePrice)
  if (input.sourceIds !== undefined) values.sourceIds = input.sourceIds
  if (input.priority !== undefined) values.priority = input.priority
  if (input.status !== undefined) values.status = input.status
  if (input.notes !== undefined) values.notes = input.notes
  return values
}

function mapSearchQuery(row: SearchQueryRow): SearchQuery {
  return {
    id: row.id,
    missionId: row.missionId,
    sourceId: row.sourceId,
    query: row.query,
    type: row.type as SearchQueryType,
    priority: row.priority,
    createdAt: iso(row.createdAt),
  }
}

function requireDb() {
  if (!db) throw new Error("DATABASE_URL nao configurado: backend PostgreSQL indisponivel.")
  return db
}

function productValues(input: Partial<ProductInput>) {
  const values: Record<string, unknown> = {}
  if (input.sku !== undefined) values.sku = input.sku
  if (input.name !== undefined) values.name = input.name
  if (input.ean !== undefined) values.ean = input.ean
  if (input.priceB2B !== undefined) values.priceB2b = String(input.priceB2B)
  if (input.currentCost !== undefined) values.currentCost = String(input.currentCost)
  if (input.priority !== undefined) values.priority = input.priority
  if (input.manualStatus !== undefined) values.manualStatus = input.manualStatus
  if (input.monthlyDemand !== undefined) values.monthlyDemand = input.monthlyDemand
  if (input.minQty !== undefined) values.minQty = input.minQty
  if (input.maxQty !== undefined) values.maxQty = input.maxQty
  if (input.notes !== undefined) values.notes = input.notes
  if (input.active !== undefined) values.active = input.active
  return values
}

export const postgresRepo: Repository = {
  async getSettings() {
    const d = requireDb()
    const rows = await d.select().from(schema.settings).where(eq(schema.settings.id, "default"))
    let row = rows[0]
    if (!row) {
      const inserted = await d
        .insert(schema.settings)
        .values({ id: "default", ...toSettingsValues(DEFAULT_SETTINGS) })
        .returning()
      row = inserted[0]
    }
    return {
      costPct: num(row.costPct) ?? DEFAULT_SETTINGS.costPct,
      marginPct: num(row.marginPct) ?? DEFAULT_SETTINGS.marginPct,
      taxPct: num(row.taxPct) ?? DEFAULT_SETTINGS.taxPct,
      updatedAt: iso(row.updatedAt),
    } satisfies PricingSettings
  },
  async updateSettings(input: SettingsInput) {
    const d = requireDb()
    await d
      .insert(schema.settings)
      .values({ id: "default", ...toSettingsValues(input), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: schema.settings.id,
        set: { ...toSettingsValues(input), updatedAt: new Date() },
      })
    return this.getSettings()
  },

  async listProducts() {
    const d = requireDb()
    const rows = await d.select().from(schema.products)
    return rows.map(mapProduct)
  },
  async getProduct(id) {
    const d = requireDb()
    const rows = await d.select().from(schema.products).where(eq(schema.products.id, id))
    return rows[0] ? mapProduct(rows[0]) : null
  },
  async createProduct(input: ProductInput) {
    const d = requireDb()
    const rows = await d.insert(schema.products).values(productValues(input) as never).returning()
    return mapProduct(rows[0])
  },
  async updateProduct(id, input) {
    const d = requireDb()
    const rows = await d
      .update(schema.products)
      .set({ ...productValues(input), updatedAt: new Date() } as never)
      .where(eq(schema.products.id, id))
      .returning()
    return rows[0] ? mapProduct(rows[0]) : null
  },
  async setProductActive(id, active) {
    return this.updateProduct(id, { active })
  },

  async listBuyers() {
    const d = requireDb()
    const rows = await d.select().from(schema.buyers)
    return rows.map(mapBuyer)
  },
  async getBuyer(id) {
    const d = requireDb()
    const rows = await d.select().from(schema.buyers).where(eq(schema.buyers.id, id))
    return rows[0] ? mapBuyer(rows[0]) : null
  },
  async createBuyer(input: BuyerInput) {
    const d = requireDb()
    const rows = await d.insert(schema.buyers).values(input).returning()
    return mapBuyer(rows[0])
  },
  async updateBuyer(id, input) {
    const d = requireDb()
    const rows = await d
      .update(schema.buyers)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(schema.buyers.id, id))
      .returning()
    return rows[0] ? mapBuyer(rows[0]) : null
  },
  async setBuyerActive(id, active) {
    return this.updateBuyer(id, { active })
  },

  async listBuyerProducts(buyerId) {
    const d = requireDb()
    const rows = await d
      .select()
      .from(schema.buyerProducts)
      .where(eq(schema.buyerProducts.buyerId, buyerId))
    return rows.map(mapBuyerProduct)
  },
  async listBuyerProductsByProduct(productId) {
    const d = requireDb()
    const rows = await d
      .select()
      .from(schema.buyerProducts)
      .where(eq(schema.buyerProducts.productId, productId))
    return rows.map(mapBuyerProduct)
  },
  async addBuyerProduct(input: BuyerProductInput) {
    const d = requireDb()
    const rows = await d
      .insert(schema.buyerProducts)
      .values({
        buyerId: input.buyerId,
        productId: input.productId,
        maxPrice: input.maxPrice === null ? null : String(input.maxPrice),
        minQty: input.minQty,
        maxQty: input.maxQty,
        frequency: input.frequency,
        notes: input.notes,
      })
      .returning()
    return mapBuyerProduct(rows[0])
  },
  async removeBuyerProduct(id) {
    const d = requireDb()
    await d.delete(schema.buyerProducts).where(eq(schema.buyerProducts.id, id))
  },

  async listOffers() {
    const d = requireDb()
    const rows = await d.select().from(schema.offers)
    return rows.map(mapOffer).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  },
  async createOffer(input: OfferInput) {
    const d = requireDb()
    const rows = await d
      .insert(schema.offers)
      .values({
        productId: input.productId,
        source: input.source,
        url: input.url,
        price: String(input.price),
        availableQty: input.availableQty,
        shipping: String(input.shipping),
        notes: input.notes,
      })
      .returning()
    return mapOffer(rows[0])
  },
  async deleteOffer(id) {
    const d = requireDb()
    await d.delete(schema.offers).where(eq(schema.offers.id, id))
  },

  async listRadarOpportunities() {
    const d = requireDb()
    const rows = await d.select().from(schema.radarOpportunities)
    return rows
      .map(mapRadar)
      .sort((a, b) => (a.opportunityDate < b.opportunityDate ? 1 : -1))
  },
  async getRadarOpportunity(id) {
    const d = requireDb()
    const rows = await d
      .select()
      .from(schema.radarOpportunities)
      .where(eq(schema.radarOpportunities.id, id))
    return rows[0] ? mapRadar(rows[0]) : null
  },
  async createRadarOpportunity(input: RadarOpportunityInput) {
    const d = requireDb()
    const rows = await d
      .insert(schema.radarOpportunities)
      .values(radarValues(input) as never)
      .returning()
    return mapRadar(rows[0])
  },
  async updateRadarOpportunity(id, input) {
    const d = requireDb()
    const rows = await d
      .update(schema.radarOpportunities)
      .set({ ...radarValues(input), updatedAt: new Date() } as never)
      .where(eq(schema.radarOpportunities.id, id))
      .returning()
    return rows[0] ? mapRadar(rows[0]) : null
  },
  async deleteRadarOpportunity(id) {
    const d = requireDb()
    await d.delete(schema.radarOpportunities).where(eq(schema.radarOpportunities.id, id))
  },

  async listHuntSources() {
    const d = requireDb()
    const rows = await d.select().from(schema.huntSources)
    return rows.map(mapHuntSource).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
  },
  async getHuntSource(id) {
    const d = requireDb()
    const rows = await d.select().from(schema.huntSources).where(eq(schema.huntSources.id, id))
    return rows[0] ? mapHuntSource(rows[0]) : null
  },
  async createHuntSource(input: HuntSourceInput) {
    const d = requireDb()
    const rows = await d.insert(schema.huntSources).values(huntSourceValues(input) as never).returning()
    return mapHuntSource(rows[0])
  },
  async updateHuntSource(id, input) {
    const d = requireDb()
    const rows = await d
      .update(schema.huntSources)
      .set({ ...huntSourceValues(input), updatedAt: new Date() } as never)
      .where(eq(schema.huntSources.id, id))
      .returning()
    return rows[0] ? mapHuntSource(rows[0]) : null
  },
  async deleteHuntSource(id) {
    const d = requireDb()
    await d.delete(schema.huntSources).where(eq(schema.huntSources.id, id))
  },

  async listHuntMissions() {
    const d = requireDb()
    const rows = await d.select().from(schema.huntMissions)
    return rows.map(mapHuntMission).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  },
  async getHuntMission(id) {
    const d = requireDb()
    const rows = await d.select().from(schema.huntMissions).where(eq(schema.huntMissions.id, id))
    return rows[0] ? mapHuntMission(rows[0]) : null
  },
  async createHuntMission(input: HuntMissionInput) {
    const d = requireDb()
    const rows = await d.insert(schema.huntMissions).values(huntMissionValues(input) as never).returning()
    return mapHuntMission(rows[0])
  },
  async updateHuntMission(id, input) {
    const d = requireDb()
    const rows = await d
      .update(schema.huntMissions)
      .set({ ...huntMissionValues(input), updatedAt: new Date() } as never)
      .where(eq(schema.huntMissions.id, id))
      .returning()
    return rows[0] ? mapHuntMission(rows[0]) : null
  },
  async deleteHuntMission(id) {
    const d = requireDb()
    // Remove as consultas primeiro (o FK também tem ON DELETE CASCADE).
    await d.delete(schema.huntSearchQueries).where(eq(schema.huntSearchQueries.missionId, id))
    await d.delete(schema.huntMissions).where(eq(schema.huntMissions.id, id))
  },

  async listSearchQueriesByMission(missionId) {
    const d = requireDb()
    const rows = await d
      .select()
      .from(schema.huntSearchQueries)
      .where(eq(schema.huntSearchQueries.missionId, missionId))
      .orderBy(desc(schema.huntSearchQueries.priority))
    return rows.map(mapSearchQuery)
  },
  async replaceSearchQueriesForMission(missionId: string, inputs: SearchQueryInput[]) {
    const d = requireDb()
    await d.delete(schema.huntSearchQueries).where(eq(schema.huntSearchQueries.missionId, missionId))
    if (inputs.length === 0) return []
    const rows = await d
      .insert(schema.huntSearchQueries)
      .values(
        inputs.map((i) => ({
          missionId: i.missionId,
          sourceId: i.sourceId,
          query: i.query,
          type: i.type,
          priority: i.priority,
        })) as never,
      )
      .returning()
    return rows.map(mapSearchQuery).sort((a, b) => b.priority - a.priority)
  },
  async deleteSearchQueriesForMission(missionId) {
    const d = requireDb()
    await d.delete(schema.huntSearchQueries).where(eq(schema.huntSearchQueries.missionId, missionId))
  },
}

function toSettingsValues(input: SettingsInput) {
  return {
    costPct: String(input.costPct),
    marginPct: String(input.marginPct),
    taxPct: String(input.taxPct),
  }
}
