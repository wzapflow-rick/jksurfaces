import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react"
import { getRadarOpportunityWithMetrics } from "@/lib/services/radar-service"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { RadarClassificationBadge } from "@/components/radar/radar-classification-badge"
import { RadarRecommendationBadge } from "@/components/radar/radar-recommendation-badge"
import { RadarPriceLadder } from "@/components/radar/radar-price-ladder"
import { RadarStatusControl } from "@/components/radar/radar-status-control"
import { RadarDeleteButton } from "@/components/radar/radar-delete-button"
import { RADAR_RULE } from "@/lib/calculations/radar-opportunity"
import { formatBRL, formatDate, formatPercent, RADAR_SOURCE_META } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function OportunidadeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const opportunity = await getRadarOpportunityWithMetrics(id)
  if (!opportunity) notFound()

  const m = opportunity.metrics

  const split = [
    { label: "Custo de aquisição", value: m.acquisitionCost, tone: "bg-chart-1" },
    { label: `Custos/serviços (${RADAR_RULE.operationalPct}%)`, value: m.operationalCost, tone: "bg-chart-2" },
    { label: `Notas/impostos (${RADAR_RULE.taxPct}%)`, value: m.taxCost, tone: "bg-chart-3" },
    {
      label: "Resultado estimado",
      value: Math.max(m.estimatedResult, 0),
      tone: "bg-chart-4",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/radar"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Radar JK
      </Link>

      <PageHeader
        title={opportunity.name}
        subtitle={`${RADAR_SOURCE_META[opportunity.source].label}${
          opportunity.sku ? ` · SKU ${opportunity.sku}` : ""
        }${opportunity.brand ? ` · ${opportunity.brand}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <RadarStatusControl id={opportunity.id} status={opportunity.status} />
            <Link href={`/radar/${opportunity.id}/editar`}>
              <Button variant="secondary" size="sm">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            <RadarDeleteButton id={opportunity.id} redirectTo="/radar" />
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <RadarRecommendationBadge recommendation={m.recommendation} size="sm" />
        <RadarClassificationBadge classification={m.classification} />
        <span className="tabular rounded-md border border-border-strong bg-surface-2 px-2.5 py-1 text-xs text-muted-foreground">
          Encontrada em {formatDate(opportunity.opportunityDate)}
        </span>
        {opportunity.availableQty != null ? (
          <span className="tabular rounded-md border border-border-strong bg-surface-2 px-2.5 py-1 text-xs text-muted-foreground">
            {opportunity.availableQty} un. disponíveis
          </span>
        ) : null}
        {opportunity.url ? (
          <a
            href={opportunity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border-strong bg-surface-2 px-2.5 py-1 text-xs text-primary transition-colors hover:border-primary/40"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver anúncio
          </a>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MetricCard label="Preço anunciado" value={formatBRL(opportunity.announcedPrice)} />
        <MetricCard
          label="Custo total de aquisição"
          value={formatBRL(m.acquisitionCost)}
          hint="Anunciado + frete + outros custos"
        />
        <MetricCard label="Preço de venda JK" value={formatBRL(opportunity.salePrice)} />
        <MetricCard
          label="Resultado estimado"
          value={formatBRL(m.estimatedResult)}
          hint="Venda − aquisição − 30% − 8%"
          accent={m.estimatedResult >= 0 ? "text-status-go" : "text-status-stop"}
          highlight
        />
        <MetricCard label="Margem sobre venda" value={formatPercent(m.marginPct)} />
        <MetricCard label="ROI sobre aquisição" value={formatPercent(m.roi)} />
        <MetricCard
          label="Preço recomendado de compra"
          value={formatBRL(Math.max(m.recommendedPurchasePrice, 0))}
          hint="Reserva a margem-alvo da caça"
        />
        <MetricCard
          label="Preço máximo de aquisição"
          value={formatBRL(Math.max(m.maxPurchasePrice, 0))}
          hint="Limite para o resultado não ficar negativo"
        />
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">Faixa de compra da caça</h2>
        <RadarPriceLadder
          foundPrice={opportunity.announcedPrice}
          recommendedPrice={m.recommendedPurchasePrice}
          maxPrice={m.maxPurchasePrice}
          recommendation={m.recommendation}
        />
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">Composição do preço de venda</h2>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {split.map((s) => (
            <div
              key={s.label}
              className={s.tone}
              style={{
                width: `${opportunity.salePrice > 0 ? (s.value / opportunity.salePrice) * 100 : 0}%`,
              }}
              title={s.label}
            />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {split.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${s.tone}`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="tabular text-sm font-medium">{formatBRL(s.value)}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          Regra JK aplicada sobre o preço de venda: {RADAR_RULE.operationalPct}% para custos e serviços da operação e{" "}
          {RADAR_RULE.taxPct}% para notas fiscais e impostos. O restante é o resultado estimado da revenda.
        </p>
      </section>

      {opportunity.notes ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-tight">Observações</h2>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{opportunity.notes}</p>
        </section>
      ) : null}
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
  accent,
  highlight,
}: {
  label: string
  value: string
  hint?: string
  accent?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-xl border p-4 ${
        highlight ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`tabular text-xl font-semibold tracking-tight ${accent ?? "text-foreground"}`}>
        {value}
      </span>
      {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
    </div>
  )
}
