import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

/**
 * Cliente Drizzle sobre o PostgreSQL proprio da JK.
 *
 * A conexao usa exclusivamente a variavel de ambiente DATABASE_URL.
 * Nenhuma credencial fica no codigo. Quando DATABASE_URL nao esta definido
 * (ex.: ambiente de preview antes de conectar ao banco), o cliente fica nulo
 * e a aplicacao usa o backend em memoria com os dados de seed.
 */

const globalForDb = globalThis as unknown as {
  __radarJkSql?: ReturnType<typeof postgres>
  __radarJkDb?: PostgresJsDatabase<typeof schema>
}

export const hasDatabase = Boolean(process.env.DATABASE_URL)

function createDb() {
  const url = process.env.DATABASE_URL
  if (!url) return null

  const sql =
    globalForDb.__radarJkSql ??
    postgres(url, {
      max: 5,
      prepare: false,
    })

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__radarJkSql = sql
  }

  const db = globalForDb.__radarJkDb ?? drizzle(sql, { schema })
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__radarJkDb = db
  }
  return db
}

export const db = createDb()
export { schema }
