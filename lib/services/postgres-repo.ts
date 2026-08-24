import { eq } from "drizzle-orm"
import type {
  AcquisitionStatus,
  Buyer,
  BuyerProduct,
  CommercialPriority,
  Offer,
  PricingSettings,
  Product,
} from "@/types"
import { db, schema } from "@/lib/db/client"
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
}

function toSettingsValues(input: SettingsInput) {
  return {
    costPct: String(input.costPct),
    marginPct: String(input.marginPct),
    taxPct: String(input.taxPct),
  }
}
