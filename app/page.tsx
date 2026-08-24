import { getDashboardData } from "@/lib/services/radar-service"
import { getHuntDashboardData } from "@/lib/services/hunt-service"
import { PageHeader } from "@/components/layout/page-header"
import { DbBanner } from "@/components/layout/db-banner"
import { StatCards } from "@/components/dashboard/stat-cards"
import { HuntSection } from "@/components/dashboard/hunt-section"
import { HuntMissionsSection } from "@/components/dashboard/hunt-missions-section"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatBRL } from "@/lib/utils"
import Link from "next/link"
import { AlertTriangle, Target } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [data, huntData] = await Promise.all([getDashboardData(), getHuntDashboardData()])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Radar JK"
        subtitle="Inteligência de aquisição — o que caçar hoje, dentro da regra financeira da JK."
        actions={
          <Link
            href="/radar/cacar"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Target className="h-4 w-4" />
            Caçar oportunidade
          </Link>
        }
      />

      <DbBanner />

      <StatCards data={data} />

      <HuntMissionsSection data={huntData} />

      <HuntSection products={data.hunt} />

      {data.attention.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-status-stop" strokeWidth={2} />
            <h2 className="text-sm font-semibold tracking-tight">Fora da regra</h2>
            <span className="tabular rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {data.attention.length}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            {data.attention.map((p, i) => (
              <Link
                key={p.id}
                href={`/produtos/${p.id}`}
                className={`flex items-center justify-between gap-4 bg-card px-4 py-3 transition-colors hover:bg-muted/40 ${
                  i > 0 ? "border-t border-border" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="tabular text-xs text-muted-foreground">{p.sku}</p>
                  <p className="truncate text-sm font-medium">{p.name}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="tabular hidden text-xs text-muted-foreground sm:block">
                    Custo {formatBRL(p.metrics.currentCost)} / máx {formatBRL(p.metrics.maxCost)}
                  </span>
                  <StatusBadge status={p.metrics.status} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
