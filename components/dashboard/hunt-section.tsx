import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import type { ProductWithMetrics } from "@/types"
import { StatusBadge } from "@/components/ui/status-badge"
import { Score } from "@/components/ui/score"
import { formatBRL, formatPercent } from "@/lib/utils"

export function HuntSection({ products }: { products: ProductWithMetrics[] }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-sm font-semibold tracking-tight">Caçar agora</h2>
        <span className="tabular rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {products.length}
        </span>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum produto na faixa de caça com o custo atual. Cadastre uma oferta para reavaliar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/produtos/${p.id}`}
              className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-border-strong"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="tabular text-xs text-muted-foreground">{p.sku}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug">{p.name}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <Metric label="Venda B2B" value={formatBRL(p.metrics.priceB2B)} />
                <Metric label="Custo atual" value={formatBRL(p.metrics.currentCost)} />
                <Metric label="Custo máx." value={formatBRL(p.metrics.maxCost)} />
                <Metric
                  label="Folga"
                  value={formatBRL(p.metrics.differenceToMaxCost)}
                  accent={p.metrics.differenceToMaxCost >= 0 ? "text-status-go" : "text-status-stop"}
                />
                <Metric label="ROI" value={formatPercent(p.metrics.roi)} accent="text-foreground" />
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Score</span>
                  <Score value={p.metrics.score} showBar={false} />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <StatusBadge status={p.metrics.status} />
                <span className="tabular text-xs text-muted-foreground">
                  Resultado {formatBRL(p.metrics.result)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular font-medium ${accent ?? "text-foreground"}`}>{value}</span>
    </div>
  )
}
