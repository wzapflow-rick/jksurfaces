"use client"

import Link from "next/link"
import { ExternalLink, MapPin, Target, TrendingUp } from "lucide-react"
import type { HuntMissionWithMetrics } from "@/types"
import { buildSourceOpenUrl, formatBRL, formatPercent } from "@/lib/utils"
import { HuntPriorityBadge, HuntStatusBadge } from "./hunt-badges"
import { HuntSourceTypeIcon } from "./hunt-source-icon"

export function HuntMissionCard({ mission }: { mission: HuntMissionWithMetrics }) {
  const { metrics } = mission

  return (
    <article className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:border-border-strong">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <HuntPriorityBadge priority={mission.priority} />
            <HuntStatusBadge status={mission.status} />
          </div>
          <Link
            href={`/caca/${mission.id}`}
            className="block truncate text-base font-semibold text-foreground hover:text-primary"
          >
            {mission.name}
          </Link>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {mission.searchTerm}
            {mission.brand ? ` · ${mission.brand}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="size-3" />
            Potencial
          </span>
          <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
            {metrics.potentialScore}
          </span>
        </div>
      </header>

      {/* Alvos financeiros derivados do motor reverso (Fase 3) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border-strong bg-muted/40 p-3">
          <span className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
            <Target className="size-3" />
            Pagar até
          </span>
          <p className="font-mono text-lg font-semibold tabular-nums text-status-watch">
            {formatBRL(metrics.maxAcquisition)}
          </p>
          <p className="text-[11px] text-muted-foreground">equilíbrio</p>
        </div>
        <div className="rounded-md border border-status-go/30 bg-status-go/5 p-3">
          <span className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-status-go">
            <Target className="size-3" />
            Ideal
          </span>
          <p className="font-mono text-lg font-semibold tabular-nums text-status-go">
            {formatBRL(metrics.recommendedAcquisition)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            +{formatBRL(metrics.recommendedResult)} ({formatPercent(metrics.targetMarginPct)})
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Venda esperada</span>
        <span className="font-mono tabular-nums text-foreground">
          {formatBRL(mission.expectedSalePrice)}
        </span>
      </div>

      {/* Fontes de caça com link direto de busca */}
      {mission.sources.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <span className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
            <MapPin className="size-3" />
            Onde caçar
          </span>
          <div className="flex flex-wrap gap-2">
            {mission.sources.map((source) => {
              const { openUrl, isSearch } = buildSourceOpenUrl(source, mission.searchTerm)
              const inner = (
                <>
                  <HuntSourceTypeIcon type={source.type} className="size-3.5" />
                  <span className="truncate">{source.name}</span>
                  {openUrl && <ExternalLink className="size-3 opacity-60" />}
                </>
              )
              const base =
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors"
              return openUrl ? (
                <a
                  key={source.id}
                  href={openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={isSearch ? `Buscar "${mission.searchTerm}" em ${source.name}` : source.name}
                  className={`${base} border-border-strong bg-muted/40 text-foreground hover:border-primary hover:text-primary`}
                >
                  {inner}
                </a>
              ) : (
                <span
                  key={source.id}
                  className={`${base} border-border bg-muted/20 text-muted-foreground`}
                  title={`${source.name} — sem busca automática`}
                >
                  {inner}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </article>
  )
}
