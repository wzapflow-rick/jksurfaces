"use client"

import { useState } from "react"
import { Check, Copy, ExternalLink, Play, Search, SkipForward } from "lucide-react"
import type { HuntSource, SearchQuery } from "@/types"
import { buildSourceOpenUrl, SEARCH_QUERY_TYPE_META } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Props {
  queries: SearchQuery[]
  /** Fontes selecionadas na missão. Só as com template de busca abrem consultas. */
  sources: HuntSource[]
}

/**
 * CONSULTAS INTELIGENTES (Fase 5) — client component.
 *
 * Não faz scraping nem chama APIs: apenas abre a URL de pesquisa da fonte
 * escolhida, montada a partir do seu template configurado + a consulta. A
 * pesquisa em lote é uma sequência CONTROLADA (uma aba por vez), preparando a
 * automação futura sem abrir dezenas de abas de uma vez.
 */
export function HuntSearchQueries({ queries, sources }: Props) {
  const searchable = sources.filter((s) => Boolean(s.searchUrlTemplate))
  const [selectedSourceId, setSelectedSourceId] = useState<string>(searchable[0]?.id ?? "")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [seqIndex, setSeqIndex] = useState<number | null>(null)

  const selectedSource = searchable.find((s) => s.id === selectedSourceId) ?? null

  function openQuery(query: string) {
    if (!selectedSource) return
    const { openUrl } = buildSourceOpenUrl(selectedSource, query)
    if (openUrl) window.open(openUrl, "_blank", "noopener,noreferrer")
  }

  async function copyQuery(q: SearchQuery) {
    try {
      await navigator.clipboard.writeText(q.query)
      setCopiedId(q.id)
      setTimeout(() => setCopiedId((c) => (c === q.id ? null : c)), 1500)
    } catch {
      /* clipboard indisponível — ignora silenciosamente */
    }
  }

  function startSequence() {
    if (!selectedSource || queries.length === 0) return
    openQuery(queries[0].query)
    setSeqIndex(queries.length > 1 ? 1 : null)
  }

  function openNextInSequence() {
    if (seqIndex === null) return
    openQuery(queries[seqIndex].query)
    setSeqIndex(seqIndex + 1 < queries.length ? seqIndex + 1 : null)
  }

  if (queries.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-card p-5">
        <SectionTitle />
        <p className="mt-3 text-sm text-muted-foreground">
          Nenhuma consulta gerada ainda. Elas são criadas automaticamente a partir do produto, marca
          e SKU da missão.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle count={queries.length} />
        {searchable.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Pesquisar em:</span>
            {searchable.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedSourceId(s.id)}
                aria-pressed={s.id === selectedSourceId}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                  s.id === selectedSourceId
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border-strong bg-surface-2 text-muted-foreground hover:text-foreground",
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {queries.map((q) => {
          const meta = SEARCH_QUERY_TYPE_META[q.type]
          return (
            <li
              key={q.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border-strong bg-muted/30 px-4 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Search className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate font-mono text-sm text-foreground">{q.query}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    "hidden rounded-md border px-2 py-0.5 text-[10px] font-medium sm:inline",
                    meta.tone,
                  )}
                >
                  {meta.label}
                </span>
                <span className="tabular-nums text-[11px] text-muted-foreground" title="Prioridade">
                  {q.priority}
                </span>
                <button
                  type="button"
                  onClick={() => copyQuery(q)}
                  aria-label={`Copiar consulta ${q.query}`}
                  className="flex size-7 items-center justify-center rounded-md border border-border-strong bg-surface-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {copiedId === q.id ? (
                    <Check className="size-3.5 text-status-go" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openQuery(q.query)}
                  disabled={!selectedSource}
                  title={selectedSource ? undefined : "Selecione uma fonte com busca automática"}
                >
                  Pesquisar
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      {searchable.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border-strong pt-4">
          {seqIndex === null ? (
            <Button variant="secondary" size="sm" onClick={startSequence} disabled={!selectedSource}>
              <Play className="h-3.5 w-3.5" />
              Pesquisar todas em sequência
            </Button>
          ) : (
            <Button size="sm" onClick={openNextInSequence}>
              <SkipForward className="h-3.5 w-3.5" />
              Abrir próxima ({seqIndex + 1}/{queries.length})
            </Button>
          )}
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {seqIndex === null
              ? `Abre uma aba por vez em ${selectedSource?.name ?? "—"}, da mais específica para a mais ampla.`
              : "Abra a próxima quando terminar de analisar a aba atual."}
          </p>
        </div>
      ) : (
        <p className="mt-4 border-t border-border-strong pt-4 text-[11px] leading-relaxed text-muted-foreground">
          Nenhuma fonte com busca automática selecionada nesta missão. Copie as consultas ou adicione
          uma fonte com pesquisa (ex.: OLX, Mercado Livre) na edição da missão.
        </p>
      )}
    </section>
  )
}

function SectionTitle({ count }: { count?: number }) {
  return (
    <div className="flex items-center gap-2">
      <Search className="size-4 text-primary" />
      <h2 className="text-sm font-semibold tracking-tight">Consultas inteligentes</h2>
      {typeof count === "number" ? (
        <span className="tabular-nums rounded-md border border-border-strong bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted-foreground">
          {count}
        </span>
      ) : null}
    </div>
  )
}
