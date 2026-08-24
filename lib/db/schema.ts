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
 * IMPORTANTE: todas as tabelas usam o prefixo `radar_jk_` para conviver com
 * as tabelas existentes do PostgreSQL compartilhado da JK sem qualquer
 * conflito. Nunca alteramos ou removemos tabelas fora deste namespace.
 */

export const products = pgTable("radar_jk_products", {
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

export const buyers = pgTable("radar_jk_buyers", {
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

export const buyerProducts = pgTable("radar_jk_buyer_products", {
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

export const offers = pgTable("radar_jk_offers", {
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
export const opportunities = pgTable("radar_jk_opportunities", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  offerId: uuid("offer_id").references(() => offers.id, { onDelete: "set null" }),
  status: text("status"),
  score: integer("score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const priceHistory = pgTable("radar_jk_price_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  source: text("source"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
})

export const scans = pgTable("radar_jk_scans", {
  id: uuid("id").defaultRandom().primaryKey(),
  source: text("source"),
  status: text("status"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
})

export const settings = pgTable("radar_jk_settings", {
  id: text("id").primaryKey().default("default"),
  costPct: numeric("cost_pct", { precision: 5, scale: 2 }).notNull().default("62"),
  marginPct: numeric("margin_pct", { precision: 5, scale: 2 }).notNull().default("30"),
  taxPct: numeric("tax_pct", { precision: 5, scale: 2 }).notNull().default("8"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
