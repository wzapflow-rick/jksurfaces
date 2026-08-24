"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Field, Input, Select, Textarea } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { RadarClassificationBadge } from "./radar-classification-badge"
import {
  createRadarOpportunityAction,
  updateRadarOpportunityAction,
} from "@/app/actions/radar"
import type { ActionResult } from "@/app/actions/products"
import { computeRadarMetrics, RADAR_RULE } from "@/lib/calculations/radar-opportunity"
import { formatBRL, formatPercent } from "@/lib/utils"
import type { RadarOpportunity, RadarSource } from "@/types"

/** Valores iniciais vindos de uma missão de caça (Fase 4) via "Encontrei". */
export interface RadarPrefill {
  name?: string
  sku?: string
  brand?: string
  source?: RadarSource
  salePrice?: number
  missionId?: string
}

const SOURCES: { value: string; label: string }[] = [
  { value: "OLX", label: "OLX" },
  { value: "MERCADO_LIVRE", label: "Mercado Livre" },
  { value: "CHATUBA", label: "Chatuba" },
  { value: "MARKETPLACE", label: "Marketplace" },
  { value: "OUTRO", label: "Outro" },
]

const STATUSES: { value: string; label: string }[] = [
  { value: "ENCONTRADA", label: "Encontrada" },
  { value: "EM_ANALISE", label: "Em análise" },
  { value: "APROVADA", label: "Aprovada para compra" },
  { value: "COMPRADA", label: "Comprada" },
  { value: "VENDIDA", label: "Vendida" },
  { value: "DESCARTADA", label: "Descartada" },
]

/** Converte ISO para o formato yyyy-mm-dd exigido pelo <input type="date">. */
function toDateInput(iso?: string): string {
  const date = iso ? new Date(iso) : new Date()
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
  return date.toISOString().slice(0, 10)
}

export function RadarForm({
  opportunity,
  prefill,
}: {
  opportunity?: RadarOpportunity
  prefill?: RadarPrefill
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<ActionResult | null>(null)

  // Estado da prévia ao vivo.
  const [announcedPrice, setAnnouncedPrice] = useState(opportunity?.announcedPrice ?? 0)
  const [shipping, setShipping] = useState(opportunity?.shipping ?? 0)
  const [otherCosts, setOtherCosts] = useState(opportunity?.otherCosts ?? 0)
  const [salePrice, setSalePrice] = useState(opportunity?.salePrice ?? prefill?.salePrice ?? 0)

  const metrics = computeRadarMetrics({ announcedPrice, shipping, otherCosts, salePrice })

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = opportunity
        ? await updateRadarOpportunityAction(opportunity.id, formData)
        : await createRadarOpportunityAction(formData)
      setResult(res)
      if (res.ok) {
        router.push(opportunity ? `/radar/${opportunity.id}` : `/radar/${res.id}`)
        router.refresh()
      }
    })
  }

  const fieldError = (name: string) => result?.fieldErrors?.[name]

  return (
    <form action={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {prefill?.missionId ? (
        <p className="lg:col-span-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
          Pré-preenchido a partir de uma missão de caça. Confira o preço anunciado e os custos reais.
        </p>
      ) : null}
      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-tight">Produto e fonte</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="SKU (opcional)" htmlFor="sku" error={fieldError("sku")}>
              <Input
                id="sku"
                name="sku"
                defaultValue={opportunity?.sku ?? prefill?.sku ?? ""}
                placeholder="Ex.: DECA-1234"
              />
            </Field>
            <Field label="Marca" htmlFor="brand" error={fieldError("brand")}>
              <Input
                id="brand"
                name="brand"
                defaultValue={opportunity?.brand ?? prefill?.brand ?? ""}
                placeholder="Ex.: Deca"
              />
            </Field>
            <Field
              label="Nome do produto"
              htmlFor="name"
              error={fieldError("name")}
              className="sm:col-span-2"
            >
              <Input
                id="name"
                name="name"
                defaultValue={opportunity?.name ?? prefill?.name ?? ""}
                placeholder="Descrição do produto anunciado"
                required
              />
            </Field>
            <Field label="Fonte da oportunidade" htmlFor="source" error={fieldError("source")}>
              <Select id="source" name="source" defaultValue={opportunity?.source ?? prefill?.source ?? "OLX"}>
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="URL do anúncio" htmlFor="url" error={fieldError("url")}>
              <Input
                id="url"
                name="url"
                type="url"
                defaultValue={opportunity?.url ?? ""}
                placeholder="https://"
              />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-tight">Custos e preço</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Preço anunciado (R$)"
              htmlFor="announcedPrice"
              error={fieldError("announcedPrice")}
            >
              <Input
                id="announcedPrice"
                name="announcedPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={opportunity?.announcedPrice ?? ""}
                onChange={(e) => setAnnouncedPrice(Number(e.target.value) || 0)}
                placeholder="0,00"
                required
              />
            </Field>
            <Field label="Quantidade disponível" htmlFor="availableQty" error={fieldError("availableQty")}>
              <Input
                id="availableQty"
                name="availableQty"
                type="number"
                min="0"
                defaultValue={opportunity?.availableQty ?? ""}
                placeholder="0"
              />
            </Field>
            <Field label="Frete (R$)" htmlFor="shipping" error={fieldError("shipping")}>
              <Input
                id="shipping"
                name="shipping"
                type="number"
                step="0.01"
                min="0"
                defaultValue={opportunity?.shipping ?? ""}
                onChange={(e) => setShipping(Number(e.target.value) || 0)}
                placeholder="0,00"
              />
            </Field>
            <Field label="Outros custos (R$)" htmlFor="otherCosts" error={fieldError("otherCosts")}>
              <Input
                id="otherCosts"
                name="otherCosts"
                type="number"
                step="0.01"
                min="0"
                defaultValue={opportunity?.otherCosts ?? ""}
                onChange={(e) => setOtherCosts(Number(e.target.value) || 0)}
                placeholder="0,00"
              />
            </Field>
            <Field
              label="Preço de venda JK (R$)"
              htmlFor="salePrice"
              error={fieldError("salePrice")}
              hint="Preço pelo qual a JK revende."
            >
              <Input
                id="salePrice"
                name="salePrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={opportunity?.salePrice ?? prefill?.salePrice ?? ""}
                onChange={(e) => setSalePrice(Number(e.target.value) || 0)}
                placeholder="0,00"
                required
              />
            </Field>
            <Field
              label="Custo total de aquisição"
              htmlFor="acquisitionPreview"
              hint="Calculado: anunciado + frete + outros custos."
            >
              <Input
                id="acquisitionPreview"
                value={formatBRL(metrics.acquisitionCost)}
                readOnly
                tabIndex={-1}
                className="cursor-default bg-muted text-muted-foreground"
              />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-tight">Acompanhamento</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Data da oportunidade" htmlFor="opportunityDate" error={fieldError("opportunityDate")}>
              <Input
                id="opportunityDate"
                name="opportunityDate"
                type="date"
                defaultValue={toDateInput(opportunity?.opportunityDate)}
                required
              />
            </Field>
            <Field label="Status" htmlFor="status" error={fieldError("status")}>
              <Select id="status" name="status" defaultValue={opportunity?.status ?? "ENCONTRADA"}>
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
                defaultValue={opportunity?.notes ?? ""}
                placeholder="Condições, prazo de retirada, estado do produto, etc."
              />
            </Field>
          </div>
        </section>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="sticky top-6 flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold tracking-tight">Análise da oportunidade</h2>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Regra JK: {RADAR_RULE.operationalPct}% custos/serviços · {RADAR_RULE.taxPct}% notas/impostos sobre o preço de venda.
          </p>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border-strong bg-surface-2 px-4 py-3">
            <span className="text-xs text-muted-foreground">Indicador</span>
            <RadarClassificationBadge classification={metrics.classification} />
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <PreviewRow label="Custo total de aquisição" value={formatBRL(metrics.acquisitionCost)} />
            <PreviewRow
              label={`Custos/serviços (${RADAR_RULE.operationalPct}%)`}
              value={formatBRL(metrics.operationalCost)}
            />
            <PreviewRow label={`Notas/impostos (${RADAR_RULE.taxPct}%)`} value={formatBRL(metrics.taxCost)} />
            <div className="border-t border-border pt-3">
              <PreviewRow
                label="Resultado estimado"
                value={formatBRL(metrics.estimatedResult)}
                accent={metrics.estimatedResult >= 0 ? "text-status-go" : "text-status-stop"}
                strong
              />
            </div>
            <PreviewRow label="Margem sobre venda" value={formatPercent(metrics.marginPct)} />
            <PreviewRow label="ROI sobre aquisição" value={formatPercent(metrics.roi)} />
          </div>

          {result?.error && !result.ok ? (
            <p className="rounded-md border border-status-stop/30 bg-status-stop/10 px-3 py-2 text-xs text-status-stop">
              {result.error}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : opportunity ? "Salvar alterações" : "Cadastrar oportunidade"}
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

function PreviewRow({
  label,
  value,
  accent,
  strong,
}: {
  label: string
  value: string
  accent?: string
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`tabular ${strong ? "text-base font-semibold" : "font-medium"} ${accent ?? "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  )
}
