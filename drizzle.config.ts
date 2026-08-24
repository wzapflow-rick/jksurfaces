import type { Config } from "drizzle-kit"

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Aponte para o banco dedicado radar_jk (ex.: postgres://.../radar_jk)
    url: process.env.DATABASE_URL ?? "",
  },
} satisfies Config
