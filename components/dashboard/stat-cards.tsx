import Link from "next/link"
import { Package, Flame, Crosshair, Trophy, Wallet } from "lucide-react"
import type { DashboardData } from "@/lib/services/radar-service"
import { formatBRL } from "@/lib/utils"

export function StatCards({ data }: { data: DashboardData }) {
  const best = data.bestOpportunity

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Stat icon={Package} label="Produtos monitorados" value={String(data.monitoredCount)} />
      <Stat
        icon={Flame}
        label="Alta prioridade"
        value={String(data.highPriorityCount)}
        accent="text-status-hot"
      />
      <Stat icon={Crosshair} label="Oportunidades abertas" value={String(data.openOpportunities)} accent="text-status-go" />
      <Stat
        icon={Trophy}
        label="Melhor oportunidade"
        value={best ? `Score ${best.metrics.score}` : "—"}
        sub={best ? best.sku : "Sem candidatos"}
        href={best ? `/produtos/${best.id}` : undefined}
        accent="text-status-hot"
      />
      <Stat
        icon={Wallet}
        label="Capital potencial"
        value={formatBRL(data.potentialCapital)}
        sub="Para caçar agora"
      />
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  href,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  href?: string
  accent?: string
}) {
  const inner = (
    <div className="flex h-full flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-border-strong">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${accent ?? "text-muted-foreground"}`} strokeWidth={2} />
      </div>
      <div>
        <p className="tabular text-2xl font-semibold tracking-tight">{value}</p>
        {sub ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p> : null}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    )
  }
  return inner
}
