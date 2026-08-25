"use client"

import { useState, useTransition } from "react"
import { Loader2, PackageSearch, Search } from "lucide-react"
import { captureSourceAction } from "@/app/actions/source-offers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/field"
import { OfferCard } from "@/components/offers/offer-card"
import type { SourceOfferWithMetrics } from "@/types"

/**
 * Busca ao vivo na Chatuba a partir de uma missão de caça (Fase 6.1). Usa a
 * venda esperada da missão como preço de referência para a prévia financeira
 * quando a oferta não está associada a um produto JK. A captura persiste as
 * ofertas; a página /ofertas mostra o histórico completo.
 */
export function HuntChatubaSearch({
  missionId,
  defaultQuery,
  expectedSalePrice,
}: {
  missionId: string
  defaultQuery: string
  expectedSalePrice: number
}) {
  const [query, setQuery] = useState(defaultQuery)
  const [offers, setOffers] = useState<SourceOfferWithMetrics[] | null>(null)
  const [summary, setSummary] = useState<{ created: number; updated: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function runSearch(term: string) {
    setError(null)
    startTransition(async () => {
      const res = await captureSourceAction("CHATUBA", term, expectedSalePrice)
      if (!res.ok) {
        setError(res.error ?? "Não foi possível buscar agora.")
        setOffers(null)
        setSummary(null)
        return
      }
      setOffers(res.offers ?? [])
      setSummary({ created: res.created ?? 0, updated: res.updated ?? 0 })
    })
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-1 flex items-center gap-2">
        <PackageSearch className="size-4 text-primary" />
        <h2 className="text-sm font-semibold tracking-tight">Buscar na Chatuba</h2>
      </div>
      <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground">
        Captura ofertas do catálogo público da Chatuba e as associa aos produtos JK, com prévia da
        regra financeira. A análise definitiva é sempre feita no Radar.
      </p>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          if (query.trim().length >= 2) runSearch(query)
        }}
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex.: torneira gourmet, chuveiro lorenzetti…"
          aria-label="Termo de busca na Chatuba"
        />
        <Button type="submit" disabled={pending || query.trim().length < 2} className="shrink-0">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {pending ? "Buscando…" : "Buscar"}
        </Button>
      </form>

      {error ? (
        <p className="mt-4 rounded-md border border-status-stop/30 bg-status-stop/10 px-3 py-2 text-xs text-status-stop">
          {error}
        </p>
      ) : null}

      {offers ? (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            {offers.length === 0
              ? "Nenhuma oferta encontrada para esse termo."
              : `${offers.length} oferta(s) · ${summary?.created ?? 0} nova(s), ${summary?.updated ?? 0} atualizada(s).`}
          </p>
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} missionId={missionId} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
