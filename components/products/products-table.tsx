"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, ArrowUpRight } from "lucide-react"
import type { AcquisitionStatus, ProductWithMetrics } from "@/types"
import { StatusBadge } from "@/components/ui/status-badge"
import { Score } from "@/components/ui/score"
import { Input, Select } from "@/components/ui/field"
import { formatBRL, formatPercent, STATUS_META } from "@/lib/utils"

const STATUS_FILTERS: { value: AcquisitionStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos os status" },
  { value: "HUNT_AGGRESSIVE", label: STATUS_META.HUNT_AGGRESSIVE.label },
  { value: "HUNT", label: STATUS_META.HUNT.label },
  { value: "MONITOR", label: STATUS_META.MONITOR.label },
  { value: "DO_NOT_BUY", label: STATUS_META.DO_NOT_BUY.label },
]

export function ProductsTable({ products }: { products: ProductWithMetrics[] }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<AcquisitionStatus | "ALL">("ALL")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.ean ?? "").toLowerCase().includes(q)
      const matchesStatus = status === "ALL" || p.metrics.status === status
      return matchesQuery && matchesStatus
    })
  }, [products, query, status])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, SKU ou EAN…"
            className="pl-9"
            aria-label="Buscar produtos"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as AcquisitionStatus | "ALL")}
          className="sm:w-56"
          aria-label="Filtrar por status"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 text-right font-medium">Venda B2B</th>
                <th className="px-4 py-3 text-right font-medium">Custo atual</th>
                <th className="px-4 py-3 text-right font-medium">Custo máx.</th>
                <th className="px-4 py-3 text-right font-medium">Folga</th>
                <th className="px-4 py-3 text-right font-medium">ROI</th>
                <th className="px-4 py-3 text-right font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Nenhum produto encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="group border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link href={`/produtos/${p.id}`} className="block">
                        <p className="tabular text-xs text-muted-foreground">{p.sku}</p>
                        <p className="line-clamp-1 font-medium">{p.name}</p>
                      </Link>
                    </td>
                    <td className="tabular px-4 py-3 text-right">{formatBRL(p.metrics.priceB2B)}</td>
                    <td className="tabular px-4 py-3 text-right">{formatBRL(p.metrics.currentCost)}</td>
                    <td className="tabular px-4 py-3 text-right text-muted-foreground">
                      {formatBRL(p.metrics.maxCost)}
                    </td>
                    <td
                      className={`tabular px-4 py-3 text-right font-medium ${
                        p.metrics.differenceToMaxCost >= 0 ? "text-status-go" : "text-status-stop"
                      }`}
                    >
                      {formatBRL(p.metrics.differenceToMaxCost)}
                    </td>
                    <td className="tabular px-4 py-3 text-right">{formatPercent(p.metrics.roi)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Score value={p.metrics.score} showBar={false} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.metrics.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/produtos/${p.id}`}
                        className="inline-flex text-muted-foreground transition-colors group-hover:text-foreground"
                        aria-label={`Abrir ${p.name}`}
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
        {filtered.length} de {products.length} produtos
      </p>
    </div>
  )
}
