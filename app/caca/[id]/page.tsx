import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink, Pencil, Search, Target } from "lucide-react"
import { getHuntMissionWithMetrics, buildSourceLinks } from "@/lib/services/hunt-service"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { HuntPriorityBadge, HuntStatusBadge } from "@/components/hunt/hunt-badges"
import { HuntSourceTypeIcon } from "@/components/hunt/hunt-source-icon"
import { HuntStatusControl } from "@/components/hunt/hunt-status-control"
import { HuntDeleteButton } from "@/components/hunt/hunt-delete-button"
import { RADAR_RULE, RECOMMENDED_MARGIN_PCT } from "@/lib/calculations/radar-opportunity"
import {
  formatBRL,
  formatPercent,
  HUNT_SOURCE_TYPE_META,
  huntSourceToRadarSource,
} from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function MissaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const mission = await getHuntMissionWithMetrics(id)
  if (!mission) notFound()

  const m = mission.metrics
  const links = buildSourceLinks(mission.sources, mission.searchTerm)

  // Prefill do fluxo "Encontrei" no Radar (Fase 3): nome, marca, sku, venda e
  // uma fonte plausível derivada da primeira fonte da missão.
  const radarSource = huntSourceToRadarSource(mission.sources[0]?.name ?? "")
  const foundParams = new URLSearchParams({
    name: mission.name,
    salePrice: String(mission.expectedSalePrice),
    source: radarSource,
    missionId: mission.id,
  })
  if (mission.sku) foundParams.set("sku", mission.sku)
  if (mission.brand) foundParams.set("brand", mission.brand)

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/caca"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Central de Caça
      </Link>

      <PageHeader
        title={mission.name}
        subtitle={`${mission.searchTerm}${mission.brand ? ` · ${mission.brand}` : ""}${
          mission.category ? ` · ${mission.category}` : ""
        }`}
        actions={
          <div className="flex items-center gap-2">
            <HuntStatusControl id={mission.id} status={mission.status} />
            <Link href={`/caca/${mission.id}/editar`}>
              <Button variant="secondary" size="sm">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            <HuntDeleteButton id={mission.id} redirectTo="/caca" />
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <HuntPriorityBadge priority={mission.priority} />
        <HuntStatusBadge status={mission.status} />
        <span className="tabular rounded-md border border-border-strong bg-surface-2 px-2.5 py-1 text-xs text-muted-foreground">
          Potencial {m.potentialScore}/100
        </span>
      </div>

      {/* Alvos de aquisição — o coração da caça */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-xl border border-status-go/30 bg-status-go/5 p-4">
          <span className="flex items-center gap-1.5 text-xs text-status-go">
            <Target className="size-3.5" />
            Preço ideal
          </span>
          <span className="font-mono text-2xl font-semibold tabular-nums text-status-go">
            {formatBRL(m.recommendedAcquisition)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Lucro estimado +{formatBRL(m.recommendedResult)} ({formatPercent(m.targetMarginPct)})
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-status-watch/30 bg-status-watch/5 p-4">
          <span className="flex items-center gap-1.5 text-xs text-status-watch">
            <Target className="size-3.5" />
            Preço máximo
          </span>
          <span className="font-mono text-2xl font-semibold tabular-nums text-status-watch">
            {formatBRL(m.maxAcquisition)}
          </span>
          <span className="text-[11px] text-muted-foreground">Ponto de equilíbrio (resultado zero)</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
          <span className="text-xs text-muted-foreground">Venda esperada JK</span>
          <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
            {formatBRL(mission.expectedSalePrice)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Regra: {RADAR_RULE.operationalPct}% + {RADAR_RULE.taxPct}% + {RECOMMENDED_MARGIN_PCT}% margem
          </span>
        </div>
      </div>

      {/* Painel de caça: links prontos de busca por fonte */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Search className="size-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">Onde caçar</h2>
        </div>
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma fonte selecionada.{" "}
            <Link href={`/caca/${mission.id}/editar`} className="text-primary hover:underline">
              Editar missão
            </Link>{" "}
            para adicionar fontes.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {links.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border-strong bg-muted/30 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-2">
                    <HuntSourceTypeIcon type={source.type} className="size-4 text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{source.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {HUNT_SOURCE_TYPE_META[source.type].label}
                      {source.isSearch ? " · busca automática" : ""}
                    </p>
                  </div>
                </div>
                {source.openUrl ? (
                  <a href={source.openUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="sm">
                      {source.isSearch ? "Buscar" : "Abrir"}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                ) : (
                  <span className="text-[11px] text-muted-foreground">manual</span>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          Os links de busca usam o termo{" "}
          <span className="font-mono text-foreground">{mission.searchTerm}</span>. Fontes sem busca
          automática (loja física, fornecedor) são consultadas manualmente.
        </p>
      </section>

      {/* Ponte para a Fase 3: achou o produto? Registra como oportunidade no Radar */}
      <section className="flex flex-col gap-4 rounded-xl border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Encontrou o produto?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre como oportunidade no Radar JK para calcular o resultado exato com o preço real.
          </p>
        </div>
        <Link href={`/radar/novo?${foundParams.toString()}`} className="shrink-0">
          <Button size="sm">
            <Target className="h-4 w-4" />
            Encontrei — analisar no Radar
          </Button>
        </Link>
      </section>

      {mission.notes ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-tight">Observações</h2>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{mission.notes}</p>
        </section>
      ) : null}
    </div>
  )
}
