import { Database } from "lucide-react"
import { hasDatabase } from "@/lib/services/repository"

/**
 * Aviso discreto quando o app roda sem DATABASE_URL. Nesse modo os dados vem
 * do seed em memoria (nao persistem). Some automaticamente ao conectar o banco.
 */
export function DbBanner() {
  if (hasDatabase) return null
  return (
    <div className="flex items-start gap-2.5 border-b border-status-watch/20 bg-status-watch/[0.06] px-5 py-2.5 text-xs text-status-watch md:px-8">
      <Database className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <p className="text-pretty leading-relaxed">
        Modo demonstração: <span className="font-medium">DATABASE_URL</span> não configurado. Os 12
        produtos vêm do seed em memória e alterações não persistem. Configure a variável e rode a
        migration em <span className="font-medium">drizzle/0000_init.sql</span> no PgAdmin para usar o
        PostgreSQL da JK.
      </p>
    </div>
  )
}
