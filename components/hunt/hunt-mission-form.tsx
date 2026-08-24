"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Field, Input, Select, Textarea } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { HuntSourceTypeIcon } from "./hunt-source-icon"
import { createHuntMissionAction, updateHuntMissionAction } from "@/app/actions/hunt"
import type { ActionResult } from "@/app/actions/products"
import {
  computeAcquisitionTargets,
  RADAR_RULE,
  RECOMMENDED_MARGIN_PCT,
} from "@/lib/calculations/radar-opportunity"
import { formatBRL, formatPercent } from "@/lib/utils"
import type { HuntMission, HuntSource } from "@/types"

const PRIORITIES = [
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Média" },
  { value: "BAIXA", label: "Baixa" },
]

const STATUSES = [
  { value: "ATIVA", label: "Ativa" },
  { value: "PAUSADA", label: "Pausada" },
  { value: "CONCLUIDA", label: "Concluída" },
  { value: "CANCELADA", label: "Cancelada" },
]

export function HuntMissionForm({
  mission,
  sources,
}: {
  mission?: HuntMission
  sources: HuntSource[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<ActionResult | null>(null)

  const [salePrice, setSalePrice] = useState(mission?.expectedSalePrice ?? 0)
  const [selectedSources, setSelectedSources] = useState<string[]>(mission?.sourceIds ?? [])

  const targets = computeAcquisitionTargets(salePrice)

  function toggleSource(id: string) {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    )
  }

  function onSubmit(formData: FormData) {
    // sourceIds vêm do estado controlado, não dos checkboxes nativos.
    formData.delete("sourceIds")
    for (const id of selectedSources) formData.append("sourceIds", id)

    startTransition(async () => {
      const res = mission
        ? await updateHuntMissionAction(mission.id, formData)
        : await createHuntMissionAction(formData)
      setResult(res)
      if (res.ok) {
        router.push(mission ? `/caca/${mission.id}` : `/caca/${res.id}`)
        router.refresh()
      }
    })
  }

  const fieldError = (name: string) => result?.fieldErrors?.[name]

  return (
    <form action={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-tight">O que caçar</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Nome da missão"
              htmlFor="name"
              error={fieldError("name")}
              className="sm:col-span-2"
              hint="Como você identifica esta caça."
            >
              <Input
                id="name"
                name="name"
                defaultValue={mission?.name}
                placeholder="Ex.: Vaso sanitário Deca Ravena"
                required
              />
            </Field>
            <Field
              label="Produto / termo de busca"
              htmlFor="searchTerm"
              error={fieldError("searchTerm")}
              className="sm:col-span-2"
              hint="Usado para montar os links de busca nas fontes."
            >
              <Input
                id="searchTerm"
                name="searchTerm"
                defaultValue={mission?.searchTerm}
                placeholder="Ex.: vaso sanitário deca ravena branco"
                required
              />
            </Field>
            <Field label="Marca" htmlFor="brand" error={fieldError("brand")}>
              <Input id="brand" name="brand" defaultValue={mission?.brand ?? ""} placeholder="Ex.: Deca" />
            </Field>
            <Field label="Categoria" htmlFor="category" error={fieldError("category")}>
              <Input
                id="category"
                name="category"
                defaultValue={mission?.category ?? ""}
                placeholder="Ex.: Louças"
              />
            </Field>
            <Field label="SKU (opcional)" htmlFor="sku" error={fieldError("sku")}>
              <Input id="sku" name="sku" defaultValue={mission?.sku ?? ""} placeholder="Ex.: DECA-1234" />
            </Field>
            <Field
              label="Preço de venda esperado (R$)"
              htmlFor="expectedSalePrice"
              error={fieldError("expectedSalePrice")}
              hint="Base do cálculo de quanto pagar."
            >
              <Input
                id="expectedSalePrice"
                name="expectedSalePrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={mission?.expectedSalePrice ?? ""}
                onChange={(e) => setSalePrice(Number(e.target.value) || 0)}
                placeholder="0,00"
                required
              />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Onde caçar</h2>
            <span className="text-xs text-muted-foreground">
              {selectedSources.length} selecionada(s)
            </span>
          </div>
          {sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma fonte cadastrada. Cadastre fontes em Fontes de caça.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {sources.map((source) => {
                const checked = selectedSources.includes(source.id)
                return (
                  <label
                    key={source.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors ${
                      checked
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border-strong bg-muted/20 text-muted-foreground hover:border-border-strong hover:text-foreground"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={checked}
                      onChange={() => toggleSource(source.id)}
                    />
                    <HuntSourceTypeIcon type={source.type} className="size-4 shrink-0" />
                    <span className="truncate">{source.name}</span>
                    {source.searchUrlTemplate && (
                      <span className="ml-auto text-[10px] uppercase tracking-wide text-status-go">
                        busca
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          )}
          {fieldError("sourceIds") && (
            <p className="mt-2 text-xs text-status-stop">{fieldError("sourceIds")}</p>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-tight">Prioridade e status</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Prioridade" htmlFor="priority" error={fieldError("priority")}>
              <Select id="priority" name="priority" defaultValue={mission?.priority ?? "MEDIA"}>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status" htmlFor="status" error={fieldError("status")}>
              <Select id="status" name="status" defaultValue={mission?.status ?? "ATIVA"}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Observações" htmlFor="notes" className="sm:col-span-2">
              <Textarea
                id="notes"
                name="notes"
                defaultValue={mission?.notes ?? ""}
                placeholder="Especificações, cor, estado aceitável, urgência, etc."
              />
            </Field>
          </div>
        </section>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="sticky top-6 flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold tracking-tight">Até quanto pagar</h2>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Motor reverso da JK: {RADAR_RULE.operationalPct}% custos/serviços ·{" "}
            {RADAR_RULE.taxPct}% notas/impostos · margem-alvo de {RECOMMENDED_MARGIN_PCT}% sobre o
            preço de venda.
          </p>

          <div className="rounded-lg border border-status-go/30 bg-status-go/5 px-4 py-3">
            <span className="text-xs text-status-go">Preço ideal (com lucro)</span>
            <p className="font-mono text-2xl font-bold tabular-nums text-status-go">
              {formatBRL(targets.recommendedAcquisition)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Resultado estimado +{formatBRL(targets.recommendedResult)} (
              {formatPercent(targets.targetMarginPct)})
            </p>
          </div>

          <div className="rounded-lg border border-status-watch/30 bg-status-watch/5 px-4 py-3">
            <span className="text-xs text-status-watch">Preço máximo (equilíbrio)</span>
            <p className="font-mono text-xl font-bold tabular-nums text-status-watch">
              {formatBRL(targets.maxAcquisition)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Acima disso, a operação dá prejuízo.
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="text-xs text-muted-foreground">Folga entre os dois</span>
            <span className="font-mono tabular-nums text-foreground">{formatBRL(targets.buffer)}</span>
          </div>

          {result?.error && !result.ok ? (
            <p className="rounded-md border border-status-stop/30 bg-status-stop/10 px-3 py-2 text-xs text-status-stop">
              {result.error}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : mission ? "Salvar alterações" : "Criar missão"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </div>
      </aside>
    </form>
  )
}
