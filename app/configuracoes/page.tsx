import { repo, hasDatabase } from "@/lib/services/repository"
import { PageHeader } from "@/components/layout/page-header"
import { SettingsForm } from "@/components/settings/settings-form"
import { formatDate } from "@/lib/utils"
import { Database, HardDrive } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ConfiguracoesPage() {
  const settings = await repo.getSettings()
  const dbOn = hasDatabase

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configurações"
        subtitle="Parâmetros do motor de cálculo e estado do armazenamento de dados."
      />

      <SettingsForm settings={settings} />

      <section className="flex max-w-2xl flex-col gap-3 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold tracking-tight">Armazenamento</h2>
        <div className="flex items-start gap-3 rounded-lg border border-border-strong bg-surface-2 px-4 py-3">
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
              dbOn ? "bg-status-go/15 text-status-go" : "bg-status-watch/15 text-status-watch"
            }`}
          >
            {dbOn ? <Database className="h-4 w-4" /> : <HardDrive className="h-4 w-4" />}
          </div>
          <div className="text-sm">
            <p className="font-medium">{dbOn ? "PostgreSQL conectado" : "Modo memória (sem banco)"}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {dbOn
                ? "Os dados são persistidos no banco PostgreSQL configurado via DATABASE_URL."
                : "Defina a variável DATABASE_URL para persistir os dados. Sem ela, os 12 produtos da JK são carregados em memória e as alterações se perdem ao reiniciar."}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Regra atualizada em {formatDate(settings.updatedAt)}.
        </p>
      </section>
    </div>
  )
}
