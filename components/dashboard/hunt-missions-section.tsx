import Link from "next/link"
import { ArrowUpRight, Target } from "lucide-react"
import type { HuntMissionWithMetrics } from "@/types"
import type { HuntDashboardData } from "@/lib/services/hunt-service"
import { HuntPriorityBadge } from "@/components/hunt/hunt-badges"
import { formatBRL } from "@/lib/utils"

const STAT_LABELS: { key: keyof HuntDashboardData; label: string }[] = [
  { key: "activeCount", label: "Missões ativas" },
  { key: "highPriorityCount", label: "Prioridade alta" },
  { key: "foundTodayCount", label: "Encontradas hoje" },
  { key: "concludedCount", label: "Concluídas" },
]

export function HuntMissionsSection({ data }: { data: HuntDashboardData }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" strokeWidth={2} />
          <h2 className="text-sm font-semibold tracking-tight">Central de Caça</h2>
        </div>
        <Link
          href="/caca"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Ver todas
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAT_LABELS.map((s) => (
          <div key={s.key} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
              {data[s.key] as number}
            </p>
          </div>
        ))}
      </div>

      {data.huntNow.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.huntNow.slice(0, 6).map((mission) => (
            <MissionRow key={mission.id} mission={mission} />
          ))}
        </div>
      )}
    </section>
  )
}

function MissionRow({ mission }: { mission: HuntMissionWithMetrics }) {
  return (
    <Link
      href={`/caca/${mission.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <HuntPriorityBadge priority={mission.priority} />
          <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug">{mission.name}</p>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
        <span className="text-muted-foreground">Pagar até</span>
        <span className="font-mono tabular-nums text-status-go">
          {formatBRL(mission.metrics.recommendedAcquisition)}
        </span>
      </div>
    </Link>
  )
}
