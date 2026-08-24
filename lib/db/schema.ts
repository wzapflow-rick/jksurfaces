import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

/**
 * Schema do Radar JK.
 *
 * As tabelas vivem em um banco de dados dedicado (`radar_jk`), entao usam
 * nomes limpos, sem prefixo. O isolamento vem do banco separado.
 */

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  ean: text("ean"),
  priceB2b: numeric("price_b2b", { precision: 12, scale: 2 }).notNull(),
  currentCost: numeric("current_cost", { precision: 12, scale: 2 }).notNull(),
  priority: text("priority").notNull().default("NORMAL"),
  manualStatus: text("manual_status"),
  monthlyDemand: integer("monthly_demand"),
  minQty: integer("min_qty"),
  maxQty: integer("max_qty"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const buyers = pgTable("buyers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  phone: text("phone"),
  email: text("email"),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const buyerProducts = pgTable("buyer_products", {
  id: uuid("id").defaultRandom().primaryKey(),
  buyerId: uuid("buyer_id")
    .notNull()
    .references(() => buyers.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  maxPrice: numeric("max_price", { precision: 12, scale: 2 }),
  minQty: integer("min_qty"),
  maxQty: integer("max_qty"),
  frequency: text("frequency"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const offers = pgTable("offers", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  source: text("source").notNull(),
  url: text("url"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  availableQty: integer("available_qty"),
  shipping: numeric("shipping", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

/**
 * Tabelas preparadas para as proximas fases (monitoramento, scans e historico
 * de precos). Ficam criadas e vazias nesta fase; nao sao usadas ainda.
 */
export const opportunities = pgTable("opportunities", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  offerId: uuid("offer_id").references(() => offers.id, { onDelete: "set null" }),
  status: text("status"),
  score: integer("score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const priceHistory = pgTable("price_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  source: text("source"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
})

export const scans = pgTable("scans", {
  id: uuid("id").defaultRandom().primaryKey(),
  source: text("source"),
  status: text("status"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
})

/**
 * RADAR JK — Fase 2.
 * Oportunidades de compra registradas manualmente. Entidade independente,
 * com dados do anúncio (SKU, nome, marca, fonte) copiados no momento do
 * cadastro — não referencia `products` para não acoplar as fases.
 */
export const radarOpportunities = pgTable("radar_opportunities", {
  id: uuid("id").defaultRandom().primaryKey(),
  sku: text("sku"),
  name: text("name").notNull(),
  brand: text("brand"),
  source: text("source").notNull().default("OUTRO"),
  url: text("url"),
  announcedPrice: numeric("announced_price", { precision: 12, scale: 2 }).notNull(),
  availableQty: integer("available_qty"),
  shipping: numeric("shipping", { precision: 12, scale: 2 }).notNull().default("0"),
  otherCosts: numeric("other_costs", { precision: 12, scale: 2 }).notNull().default("0"),
  salePrice: numeric("sale_price", { precision: 12, scale: 2 }).notNull(),
  opportunityDate: timestamp("opportunity_date", { withTimezone: true }).notNull().defaultNow(),
  notes: text("notes"),
  status: text("status").notNull().default("ENCONTRADA"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

/**
 * CENTRAL DE CAÇA — Fase 4.
 * Fontes onde procurar e missões de aquisição. Tabelas independentes; não
 * referenciam radar_opportunities/products para não acoplar as fases.
 */
export const huntSources = pgTable("hunt_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("OUTRO"),
  urlBase: text("url_base"),
  searchUrlTemplate: text("search_url_template"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const huntMissions = pgTable("hunt_missions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sku: text("sku"),
  searchTerm: text("search_term").notNull(),
  brand: text("brand"),
  category: text("category"),
  expectedSalePrice: numeric("expected_sale_price", { precision: 12, scale: 2 }).notNull(),
  sourceIds: uuid("source_ids").array().notNull().default([]),
  priority: text("priority").notNull().default("MEDIA"),
  status: text("status").notNull().default("ATIVA"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const settings = pgTable("settings", {
  id: text("id").primaryKey().default("default"),
  costPct: numeric("cost_pct", { precision: 5, scale: 2 }).notNull().default("62"),
  marginPct: numeric("margin_pct", { precision: 5, scale: 2 }).notNull().default("30"),
  taxPct: numeric("tax_pct", { precision: 5, scale: 2 }).notNull().default("8"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
