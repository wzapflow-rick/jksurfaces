import Link from "next/link"
import { Crosshair, Plus, Store } from "lucide-react"
import { getHuntMissionsWithMetrics } from "@/lib/services/hunt-service"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { HuntMissionCard } from "@/components/hunt/hunt-mission-card"

export const dynamic = "force-dynamic"

export default async function CacaPage() {
  const missions = await getHuntMissionsWithMetrics()

  const active = missions.filter((m) => m.status === "ATIVA")
  const others = missions.filter((m) => m.status !== "ATIVA")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Central de Caça"
        subtitle="Missões de aquisição: o que procurar, onde caçar e até quanto pagar para lucrar."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/caca/fontes">
              <Button variant="secondary" size="sm">
                <Store className="h-4 w-4" />
                Fontes de caça
              </Button>
            </Link>
            <Link href="/caca/nova">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Nova missão
              </Button>
            </Link>
          </div>
        }
      />

      {missions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border-strong bg-card/40 px-6 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full border border-border-strong bg-muted">
            <Crosshair className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Nenhuma missão de caça</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Crie uma missão para saber até quanto pagar por um produto e onde procurá-lo — com o
              cálculo reverso da regra JK.
            </p>
          </div>
          <Link href="/caca/nova">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Criar primeira missão
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Crosshair className="size-4 text-primary" />
                <h2 className="text-sm font-semibold tracking-tight">
                  Caçar agora
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{active.length}</span>
                </h2>
                <p className="text-xs text-muted-foreground">ordenadas por prioridade e potencial</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {active.map((mission) => (
                  <HuntMissionCard key={mission.id} mission={mission} />
                ))}
              </div>
            </section>
          )}

          {others.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold tracking-tight text-muted-foreground">
                Pausadas / concluídas
                <span className="ml-2 font-mono text-xs">{others.length}</span>
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {others.map((mission) => (
                  <HuntMissionCard key={mission.id} mission={mission} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
