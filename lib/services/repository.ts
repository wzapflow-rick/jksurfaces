import { hasDatabase } from "@/lib/db/client"
import { memoryRepo } from "./memory-repo"
import { postgresRepo } from "./postgres-repo"
import type { Repository } from "./repository-interface"

/**
 * Ponto unico de acesso a dados. Usa o PostgreSQL da JK quando DATABASE_URL
 * esta configurado; caso contrario cai no backend em memoria (seed) para o
 * preview. Trocar de backend nao exige mudar nenhuma tela ou service.
 */
export const repo: Repository = hasDatabase ? postgresRepo : memoryRepo

export { hasDatabase }
