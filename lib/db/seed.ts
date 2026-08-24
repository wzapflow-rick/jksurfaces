import { sql } from "drizzle-orm"
import { db, hasDatabase, schema } from "./client"
import { SEED_PRODUCTS } from "./seed-data"
import { DEFAULT_SETTINGS } from "@/lib/services/dto"

/**
 * Seed dos 12 produtos reais da JK + configuracoes padrao.
 * Executar com: pnpm db:seed  (requer DATABASE_URL).
 *
 * Idempotente: nao duplica produtos ja existentes (chave = sku).
 */
async function main() {
  if (!hasDatabase || !db) {
    console.log("[v0] DATABASE_URL nao definido. Nada a semear no banco.")
    return
  }

  await db
    .insert(schema.settings)
    .values({
      id: "default",
      costPct: String(DEFAULT_SETTINGS.costPct),
      marginPct: String(DEFAULT_SETTINGS.marginPct),
      taxPct: String(DEFAULT_SETTINGS.taxPct),
    })
    .onConflictDoNothing()

  for (const p of SEED_PRODUCTS) {
    await db
      .insert(schema.products)
      .values({
        sku: p.sku,
        name: p.name,
        ean: p.ean,
        priceB2b: String(p.priceB2B),
        currentCost: String(p.currentCost),
        priority: p.priority,
      })
      .onConflictDoNothing({ target: schema.products.sku })
  }

  const count = await db.execute(sql`select count(*)::int as total from radar_jk_products`)
  console.log("[v0] Seed concluído. Produtos na tabela:", count)
  process.exit(0)
}

main().catch((err) => {
  console.error("[v0] Erro no seed:", err)
  process.exit(1)
})
