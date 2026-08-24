"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, ArrowUpRight } from "lucide-react"
import type {
  RadarClassification,
  RadarOpportunityWithMetrics,
  RadarSource,
  RadarStatus,
} from "@/types"
import { RadarClassificationBadge } from "./radar-classification-badge"
import { RadarStatusBadge } from "./radar-status-badge"
import { Input, Select } from "@/components/ui/field"
import {
  formatBRL,
  formatDate,
  RADAR_CLASSIFICATION_META,
  RADAR_SOURCE_META,
  RADAR_STATUS_META,
} from "@/lib/utils"

const SOURCE_FILTERS: { value: RadarSource | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todas as fontes" },
  ...(Object.keys(RADAR_SOURCE_META) as RadarSource[]).map((value) => ({
    value,
    label: RADAR_SOURCE_META[value].label,
  })),
]

const STATUS_FILTERS: { value: RadarStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos os status" },
  ...(Object.keys(RADAR_STATUS_META) as RadarStatus[]).map((value) => ({
    value,
    label: RADAR_STATUS_META[value].label,
  })),
]

const CLASSIFICATION_FILTERS: { value: RadarClassification | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todas as classificações" },
  ...(Object.keys(RADAR_CLASSIFICATION_META) as RadarClassification[]).map((value) => ({
    value,
    label: RADAR_CLASSIFICATION_META[value].label,
  })),
]

const PERIOD_FILTERS: { value: string; label: string }[] = [
  { value: "ALL", label: "Qualquer período" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
]

export function RadarTable({ opportunities }: { opportunities: RadarOpportunityWithMetrics[] }) {
  const [query, setQuery] = useState("")
  const [source, setSource] = useState<RadarSource | "ALL">("ALL")
  const [status, setStatus] = useState<RadarStatus | "ALL">("ALL")
  const [classification, setClassification] = useState<RadarClassification | "ALL">("ALL")
  const [period, setPeriod] = useState("ALL")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const now = Date.now()
    return opportunities.filter((o) => {
      const matchesQuery =
        !q ||
        o.name.toLowerCase().includes(q) ||
        (o.sku ?? "").toLowerCase().includes(q) ||
        (o.brand ?? "").toLowerCase().includes(q)
      const matchesSource = source === "ALL" || o.source === source
      const matchesStatus = status === "ALL" || o.status === status
      const matchesClassification =
        classification === "ALL" || o.metrics.classification === classification
      let matchesPeriod = true
      if (period !== "ALL") {
        const days = Number(period)
        const diff = (now - new Date(o.opportunityDate).getTime()) / (1000 * 60 * 60 * 24)
        matchesPeriod = diff <= days
      }
      return (
        matchesQuery &&
        matchesSource &&
        matchesStatus &&
        matchesClassification &&
        matchesPeriod
      )
    })
  }, [opportunities, query, source, status, classification, period])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por SKU, produto ou marca…"
            className="pl-9"
            aria-label="Buscar oportunidades"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            value={source}
            onChange={(e) => setSource(e.target.value as RadarSource | "ALL")}
            aria-label="Filtrar por fonte"
          >
            {SOURCE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as RadarStatus | "ALL")}
            aria-label="Filtrar por status"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
          <Select
            value={classification}
            onChange={(e) => setClassification(e.target.value as RadarClassification | "ALL")}
            aria-label="Filtrar por classificação"
          >
            {CLASSIFICATION_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            aria-label="Filtrar por período"
          >
            {PERIOD_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Fonte</th>
                <th className="px-4 py-3 text-right font-medium">Qtd.</th>
                <th className="px-4 py-3 text-right font-medium">Aquisição</th>
                <th className="px-4 py-3 text-right font-medium">Venda</th>
                <th className="px-4 py-3 text-right font-medium">Resultado</th>
                <th className="px-4 py-3 font-medium">Classificação</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Nenhuma oportunidade encontrada com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr
                    key={o.id}
                    className="group border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/radar/${o.id}`} className="block">
                        {o.sku ? <p className="tabular text-xs text-muted-foreground">{o.sku}</p> : null}
                        <p className="line-clamp-1 font-medium">{o.name}</p>
                        {o.brand ? <p className="text-xs text-muted-foreground">{o.brand}</p> : null}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {RADAR_SOURCE_META[o.source].label}
                    </td>
                    <td className="tabular px-4 py-3 text-right text-muted-foreground">
                      {o.availableQty ?? "—"}
                    </td>
                    <td className="tabular px-4 py-3 text-right">
                      {formatBRL(o.metrics.acquisitionCost)}
                    </td>
                    <td className="tabular px-4 py-3 text-right">{formatBRL(o.salePrice)}</td>
                    <td
                      className={`tabular px-4 py-3 text-right font-medium ${
                        o.metrics.estimatedResult >= 0 ? "text-status-go" : "text-status-stop"
                      }`}
                    >
                      {formatBRL(o.metrics.estimatedResult)}
                    </td>
                    <td className="px-4 py-3">
                      <RadarClassificationBadge classification={o.metrics.classification} />
                    </td>
                    <td className="px-4 py-3">
                      <RadarStatusBadge status={o.status} />
                    </td>
                    <td className="tabular px-4 py-3 text-muted-foreground">
                      {formatDate(o.opportunityDate)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/radar/${o.id}`}
                        className="inline-flex text-muted-foreground transition-colors group-hover:text-foreground"
                        aria-label={`Abrir ${o.name}`}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} de {opportunities.length} oportunidades
      </p>
    </div>
  )
}
