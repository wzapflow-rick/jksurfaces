"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, PackageSearch, Search } from "lucide-react"
import { captureSourceAction } from "@/app/actions/source-offers"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/field"
import { OfferCard } from "./offer-card"
import type { MatchStatus, SourceOfferWithMetrics } from "@/types"

type StatusFilter = "ALL" | MatchStatus

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "Todas as associações" },
  { value: "MATCHED", label: "Associadas" },
  { value: "REVIEW", label: "A revisar" },
  { value: "UNMATCHED", label: "Sem produto JK" },
]

/**
 * Explorador das ofertas capturadas (Fase 6.1). Permite capturar novas ofertas
 * da Chatuba e filtrar as já persistidas por texto e status de associação. A
 * lista base vem do servidor; a captura persiste e recarrega via router.refresh.
 */
export function OffersExplorer({ offers }: { offers: SourceOfferWithMetrics[] }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [text, setText] = useState("")
  const [status, setStatus] = useState<StatusFilter>("ALL")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onCapture() {
    if (query.trim().length < 2) return
    setError(null)
    startTransition(async () => {
      const res = await captureSourceAction("CHATUBA", query)
      if (!res.ok) {
        setError(res.error ?? "Não foi possível capturar agora.")
        return
      }
      setQuery("")
      router.refresh()
    })
  }

  const filtered = useMemo(() => {
    const t = text.trim().toLowerCase()
    return offers.filter((o) => {
      if (status !== "ALL" && o.matchStatus !== status) return false
      if (!t) return true
      return (
        o.productTitle.toLowerCase().includes(t) ||
        (o.brand?.toLowerCase().includes(t) ?? false) ||
        (o.sku?.toLowerCase().includes(t) ?? false) ||
        (o.product?.name.toLowerCase().includes(t) ?? false)
      )
    })
  }, [offers, text, status])

  const counts = useMemo(
    () => ({
      total: offers.length,
      matched: offers.filter((o) => o.matchStatus === "MATCHED").length,
      review: offers.filter((o) => o.matchStatus === "REVIEW").length,
      unmatched: offers.filter((o) => o.matchStatus === "UNMATCHED").length,
    }),
    [offers],
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Captura */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-1 flex items-center gap-2">
          <PackageSearch className="size-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">Capturar ofertas da Chatuba</h2>
        </div>
        <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground">
          Busca no catálogo público da Chatuba, associa aos produtos JK e persiste com histórico de
          preço. Ofertas repetidas são atualizadas, nunca duplicadas.
        </p>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
            onCapture()
          }}
        >
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex.: bacia sanitária, registro de gaveta…"
            aria-label="Termo de captura na Chatuba"
          />
          <Button type="submit" disabled={pending || query.trim().length < 2} className="shrink-0">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {pending ? "Capturando…" : "Capturar"}
          </Button>
        </form>
        {error ? (
          <p className="mt-3 rounded-md border border-status-stop/30 bg-status-stop/10 px-3 py-2 text-xs text-status-stop">
            {error}
          </p>
        ) : null}
      </section>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Capturadas" value={counts.total} />
        <StatCard label="Associadas" value={counts.matched} tone="text-status-go" />
        <StatCard label="A revisar" value={counts.review} tone="text-status-watch" />
        <StatCard label="Sem produto JK" value={counts.unmatched} tone="text-muted-foreground" />
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Filtrar por nome, marca, SKU ou produto JK…"
            aria-label="Filtrar ofertas"
          />
        </div>
        <div className="sm:w-56">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            aria-label="Filtrar por status de associação"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong bg-card/40 px-6 py-12 text-center text-sm text-muted-foreground">
          {offers.length === 0
            ? "Nenhuma oferta capturada ainda. Faça uma busca acima para começar."
            : "Nenhuma oferta corresponde aos filtros."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filtered.map((offer) => (
            <OfferCard key={offer.id} offer={offer} showDelete />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`font-mono text-2xl font-semibold tabular-nums ${tone ?? "text-foreground"}`}>
        {value}
      </span>
    </div>
  )
}
