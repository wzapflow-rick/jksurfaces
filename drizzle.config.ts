import type { Config } from "drizzle-kit"

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  // Only manage tables that belong to the Radar JK namespace so we never
  // touch pre-existing tables in the shared JK PostgreSQL database.
  tablesFilter: ["radar_jk_*"],
} satisfies Config
