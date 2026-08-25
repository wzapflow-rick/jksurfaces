"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Check,
  ClipboardPaste,
  Link2,
  Loader2,
  Pencil,
  PencilLine,
  Target,
} from "lucide-react"
import { analyzeImportAction, saveImportAction } from "@/app/actions/olx-import"
import type { AnalyzeImportResult } from "@/lib/services/olx-import-service"
import type { FieldOrigin, ImportCondition } from "@/lib/sources/olx-import-parser"
import { CONDITION_LABEL } from "@/lib/sources/olx-import-parser"
import { computeRadarMetrics, RADAR_RULE } from "@/lib/calculations/radar-opportunity"
import { formatBRL } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, Input, Select, Textarea } from "@/components/ui/field"
import { OfferMatchBadge } from "@/components/offers/offer-match-badge"
import { RadarClassificationBadge } from "@/components/radar/radar-classification-badge"
import { RadarRecommendationBadge } from "@/components/radar/radar-recommendation-badge"

/** Contexto opcional vindo de uma missão de caça (seção 15). */
export interface ImportPrefill {
  missionId?: string
  name?: string
  sku?: string
  brand?: string
  salePrice?: number
}

type Phase = "input" | "review"

/** Campos com origem rastreada para a revisão humana (seção 14). */
type TrackedField =
  | "productTitle"
  | "brand"
  | "sku"
  | "ean"
  | "totalPrice"
  | "quantity"
  | "condition"
  | "location"
  | "priceNegotiable"

interface FormState {
  url: string
  productTitle: string
  brand: string
  sku: string
  ean: string
  totalPrice: string
  quantity: string
  condition: ImportCondition
  city: string
  state: string
  priceNegotiable: boolean
  shipping: string
  otherCosts: string
  salePrice: string
}

const EMPTY_FORM: FormState = {
  url: "",
  productTitle: "",
  brand: "",
  sku: "",
  ean: "",
  totalPrice: "",
  quantity: "1",
  condition: "UNKNOWN",
  city: "",
  state: "",
  priceNegotiable: false,
  shipping: "",
  otherCosts: "",
  salePrice: "",
}

const CONDITIONS: ImportCondition[] = ["NEW", "USED", "UNKNOWN"]

function toNum(value: string): number {
  const n = Number(value.replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

export function ImportWizard({ prefill }: { prefill?: ImportPrefill }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>("input")

  // Entradas iniciais.
  const [url, setUrl] = useState("")
  const [text, setText] = useState("")
  const [analyzePending, startAnalyze] = useTransition()
  const [inputError, setInputError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Revisão.
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [origins, setOrigins] = useState<Partial<Record<TrackedField, FieldOrigin>>>({})
  const [analysis, setAnalysis] = useState<AnalyzeImportResult | null>(null)
  const [conditionConflict, setConditionConflict] = useState(false)
  const [savePending, startSave] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveInfo, setSaveInfo] = useState<string | null>(null)

  /* ---- Preço unitário e prévia financeira (motor da Fase 3, sem duplicar) ---- */
  const totalPrice = toNum(form.totalPrice)
  const quantity = Math.max(1, Math.floor(toNum(form.quantity) || 1))
  const unitPriceValue = quantity > 0 ? Math.round((totalPrice / quantity) * 100) / 100 : totalPrice
  const salePrice = toNum(form.salePrice)
  const metrics = useMemo(
    () =>
      computeRadarMetrics({
        announcedPrice: unitPriceValue,
        shipping: toNum(form.shipping),
        otherCosts: toNum(form.otherCosts),
        salePrice,
      }),
    [unitPriceValue, form.shipping, form.otherCosts, salePrice],
  )

  function applyAnalysis(data: AnalyzeImportResult) {
    const p = data.parsed
    const referenceSale = prefill?.salePrice ?? data.matchedProduct?.priceB2B ?? 0
    setForm({
      url: data.url ?? "",
      productTitle: p.productTitle ?? prefill?.name ?? "",
      brand: p.brand ?? prefill?.brand ?? "",
      sku: p.sku ?? prefill?.sku ?? "",
      ean: p.ean ?? "",
      totalPrice: p.totalPrice !== null ? String(p.totalPrice) : "",
      quantity: String(p.quantity),
      condition: p.condition,
      city: p.location.city ?? "",
      state: p.location.state ?? "",
      priceNegotiable: p.priceNegotiable,
      shipping: "",
      otherCosts: "",
      salePrice: referenceSale > 0 ? String(referenceSale) : "",
    })
    setOrigins({
      productTitle: originFrom(p.found.productTitle),
      brand: originFrom(p.found.brand),
      sku: originFrom(p.found.sku),
      ean: originFrom(p.found.ean),
      totalPrice: originFrom(p.found.price),
      quantity: p.quantitySource === "DETECTED" ? "EXTRACTED" : "NOT_FOUND",
      condition: originFrom(p.found.condition),
      location: originFrom(p.found.location),
      priceNegotiable: p.priceNegotiable ? "EXTRACTED" : "NOT_FOUND",
    })
    setConditionConflict(p.conditionConflict)
    setAnalysis(data)
    setNotice(data.message)
    setPhase("review")
  }

  function runAnalyze() {
    setInputError(null)
    if (!url.trim() && !text.trim()) {
      setInputError("Informe a URL do anúncio ou cole o texto.")
      return
    }
    startAnalyze(async () => {
      const res = await analyzeImportAction({ url, text })
      if (!res.ok || !res.data) {
        setInputError(res.error ?? "Não foi possível analisar o anúncio.")
        return
      }
      applyAnalysis(res.data)
    })
  }

  function startManual() {
    setForm({ ...EMPTY_FORM, url: url.trim() })
    setOrigins({
      productTitle: "NOT_FOUND",
      brand: "NOT_FOUND",
      sku: "NOT_FOUND",
      ean: "NOT_FOUND",
      totalPrice: "NOT_FOUND",
      quantity: "NOT_FOUND",
      condition: "NOT_FOUND",
      location: "NOT_FOUND",
      priceNegotiable: "NOT_FOUND",
    })
    setConditionConflict(false)
    setAnalysis(null)
    setNotice(null)
    setPhase("review")
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K], tracked?: TrackedField) {
    setForm((f) => ({ ...f, [key]: value }))
    if (tracked) setOrigins((o) => ({ ...o, [tracked]: "MANUAL" }))
    setSaveInfo(null)
  }

  function buildSaveInput(includeSaleAndMission: boolean) {
    return {
      source: "OLX" as const,
      url: form.url.trim() || null,
      productTitle: form.productTitle.trim(),
      brand: form.brand.trim() || null,
      sku: form.sku.trim() || null,
      ean: form.ean.trim() || null,
      totalPrice,
      quantity,
      condition: form.condition,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      priceNegotiable: form.priceNegotiable,
      shipping: form.shipping.trim() ? toNum(form.shipping) : null,
      imageUrl: analysis?.imageUrl ?? null,
      notes: null,
      salePrice: includeSaleAndMission && salePrice > 0 ? salePrice : null,
      missionId: includeSaleAndMission ? prefill?.missionId ?? null : null,
    }
  }

  function validateBeforeSave(): string | null {
    if (!form.productTitle.trim()) return "O nome do produto é obrigatório."
    if (!(totalPrice > 0)) return "Informe um preço válido (maior que zero)."
    return null
  }

  function onSaveOnly() {
    const err = validateBeforeSave()
    if (err) {
      setSaveError(err)
      return
    }
    setSaveError(null)
    startSave(async () => {
      const res = await saveImportAction(buildSaveInput(true))
      if (!res.ok) {
        setSaveError(res.error ?? "Não foi possível salvar a oferta.")
        return
      }
      setSaveInfo(
        res.created
          ? "Oferta importada e salva."
          : res.priceChanged
            ? "Oferta já existente atualizada (preço alterado, registrado no histórico)."
            : "Oferta já existente atualizada.",
      )
    })
  }

  function onAnalyzeInRadar() {
    const err = validateBeforeSave()
    if (err) {
      setSaveError(err)
      return
    }
    setSaveError(null)
    startSave(async () => {
      const res = await saveImportAction(buildSaveInput(true))
      if (!res.ok || !res.radarHref) {
        setSaveError(res.error ?? "Não foi possível enviar ao Radar.")
        return
      }
      router.push(res.radarHref)
    })
  }

  /* ------------------------------------------------------------------ INPUT */
  if (phase === "input") {
    return (
      <div className="flex flex-col gap-5">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-1 flex items-center gap-2">
            <Link2 className="size-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Cole o link da OLX</h2>
          </div>
          <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
            Tentamos ler apenas o conteúdo público do anúncio. Se não for possível, você continua
            colando o texto ou preenchendo manualmente — a URL é sempre preservada.
          </p>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.olx.com.br/..."
            aria-label="URL do anúncio OLX"
            inputMode="url"
          />
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-1 flex items-center gap-2">
            <ClipboardPaste className="size-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight">Cole o texto do anúncio</h2>
          </div>
          <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
            Análise 100% local e determinística: identifica produto, marca, SKU, preço, quantidade,
            lote, condição, localização e se o preço é negociável.
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            placeholder={"Torneira Deca 1176.C nova\nR$ 180\n3 unidades\nAracaju SE\naceito proposta"}
            aria-label="Texto do anúncio"
          />
        </section>

        {inputError ? (
          <p className="rounded-md border border-status-stop/30 bg-status-stop/10 px-3 py-2 text-xs text-status-stop">
            {inputError}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={startManual}
            disabled={analyzePending}
            className="sm:order-1"
          >
            <PencilLine className="h-4 w-4" />
            Preencher manualmente
          </Button>
          <Button type="button" onClick={runAnalyze} disabled={analyzePending} className="sm:order-2">
            {analyzePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
            {analyzePending ? "Analisando…" : "Importar anúncio"}
          </Button>
        </div>
      </div>
    )
  }

  /* ----------------------------------------------------------------- REVIEW */
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6">
        {notice ? (
          <p className="rounded-md border border-status-watch/30 bg-status-watch/10 px-3 py-2 text-xs text-status-watch">
            {notice}
          </p>
        ) : null}

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Revise os dados encontrados</h2>
            <Button type="button" variant="ghost" size="sm" onClick={() => setPhase("input")}>
              <Pencil className="h-3.5 w-3.5" />
              Trocar entrada
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReviewField label="Produto" origin={origins.productTitle} className="sm:col-span-2">
              <Input
                value={form.productTitle}
                onChange={(e) => setField("productTitle", e.target.value, "productTitle")}
                placeholder="Nome do produto anunciado"
              />
            </ReviewField>
            <ReviewField label="Marca" origin={origins.brand}>
              <Input
                value={form.brand}
                onChange={(e) => setField("brand", e.target.value, "brand")}
                placeholder="Ex.: Deca"
              />
            </ReviewField>
            <ReviewField label="SKU" origin={origins.sku}>
              <Input
                value={form.sku}
                onChange={(e) => setField("sku", e.target.value, "sku")}
                placeholder="Ex.: 1176.C"
                className="font-mono"
              />
            </ReviewField>
            <ReviewField label="EAN" origin={origins.ean}>
              <Input
                value={form.ean}
                onChange={(e) => setField("ean", e.target.value, "ean")}
                placeholder="Código de barras"
                className="font-mono"
              />
            </ReviewField>
            <ReviewField label="Condição" origin={origins.condition}>
              <Select
                value={form.condition}
                onChange={(e) => setField("condition", e.target.value as ImportCondition, "condition")}
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {CONDITION_LABEL[c]}
                  </option>
                ))}
              </Select>
            </ReviewField>
          </div>

          {conditionConflict ? (
            <p className="mt-3 flex items-center gap-1.5 rounded-md border border-status-hot/30 bg-status-hot/10 px-3 py-2 text-xs text-status-hot">
              <AlertTriangle className="size-3.5 shrink-0" />
              Informação conflitante de condição — revise manualmente (marcada como não identificada).
            </p>
          ) : null}
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-tight">Preço, quantidade e custos</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReviewField label="Preço total anunciado (R$)" origin={origins.totalPrice}>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.totalPrice}
                onChange={(e) => setField("totalPrice", e.target.value, "totalPrice")}
                placeholder="0,00"
              />
            </ReviewField>
            <ReviewField label="Quantidade" origin={origins.quantity}>
              <Input
                type="number"
                min="1"
                step="1"
                value={form.quantity}
                onChange={(e) => setField("quantity", e.target.value, "quantity")}
                placeholder="1"
              />
            </ReviewField>
            <Field label="Preço unitário (calculado)" hint="Preço total dividido pela quantidade.">
              <Input
                value={formatBRL(unitPriceValue)}
                readOnly
                tabIndex={-1}
                className="cursor-default bg-muted text-muted-foreground"
              />
            </Field>
            <Field label="Frete (R$)">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.shipping}
                onChange={(e) => setField("shipping", e.target.value)}
                placeholder="0,00"
              />
            </Field>
            <Field label="Outros custos (R$)">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.otherCosts}
                onChange={(e) => setField("otherCosts", e.target.value)}
                placeholder="0,00"
              />
            </Field>
            <Field label="Preço de venda JK (R$)" hint="Referência para a prévia financeira.">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.salePrice}
                onChange={(e) => setField("salePrice", e.target.value)}
                placeholder="0,00"
              />
            </Field>
          </div>

          {quantity > 1 ? (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border-strong bg-surface-2 px-4 py-3 text-xs">
              <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
                LOTE
              </span>
              <span className="text-muted-foreground">
                {quantity} unidades · {formatBRL(totalPrice)} total ·{" "}
                <span className="font-medium text-foreground">{formatBRL(unitPriceValue)}/unid.</span>
              </span>
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-tight">Origem e localização</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="URL do anúncio">
              <Input
                value={form.url}
                onChange={(e) => setField("url", e.target.value)}
                placeholder="https://"
                type="url"
              />
            </Field>
            <div />
            <ReviewField label="Cidade" origin={origins.location}>
              <Input
                value={form.city}
                onChange={(e) => setField("city", e.target.value, "location")}
                placeholder="Ex.: Aracaju"
              />
            </ReviewField>
            <ReviewField label="UF" origin={origins.location}>
              <Input
                value={form.state}
                onChange={(e) => setField("state", e.target.value.toUpperCase(), "location")}
                placeholder="Ex.: SE"
                maxLength={2}
                className="uppercase"
              />
            </ReviewField>
            <label className="flex items-center gap-2 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.priceNegotiable}
                onChange={(e) =>
                  setField("priceNegotiable", e.target.checked, "priceNegotiable")
                }
                className="size-4 rounded border-border-strong bg-input accent-primary"
              />
              <span className="text-sm text-foreground">Preço negociável</span>
              {origins.priceNegotiable ? <OriginMark origin={origins.priceNegotiable} /> : null}
            </label>
          </div>
        </section>
      </div>

      {/* Aside: match + prévia financeira + ações */}
      <aside className="flex flex-col gap-4">
        <div className="sticky top-6 flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold tracking-tight">Correspondência e análise</h2>

          {analysis ? (
            <div className="flex flex-col gap-2">
              <OfferMatchBadge
                status={analysis.match.status}
                method={analysis.match.matchMethod}
                confidence={analysis.match.confidence}
              />
              {analysis.matchedProduct ? (
                <p className="text-[11px] text-muted-foreground">
                  → {analysis.matchedProduct.name}{" "}
                  <span className="font-mono">({analysis.matchedProduct.sku})</span>
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Sem produto JK associado — confirme o SKU/EAN ou informe a venda de referência.
                </p>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Preenchimento manual: confira o SKU para associar a um produto JK no Radar.
            </p>
          )}

          <div className="flex flex-col items-center gap-2 rounded-lg border border-border-strong bg-surface-2 px-4 py-4">
            <RadarRecommendationBadge recommendation={metrics.recommendation} />
            <RadarClassificationBadge classification={metrics.classification} />
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <Row label="Preço unitário" value={formatBRL(unitPriceValue)} />
            <Row label="Preço máx. JK" value={formatBRL(metrics.maxPurchasePrice)} />
            <Row label="Preço ideal JK" value={formatBRL(metrics.recommendedPurchasePrice)} />
            <div className="border-t border-border pt-2">
              <Row
                label="Resultado estimado"
                value={formatBRL(metrics.estimatedResult)}
                accent={metrics.estimatedResult >= 0 ? "text-status-go" : "text-status-stop"}
                strong
              />
            </div>
          </div>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Prévia com a regra JK ({RADAR_RULE.operationalPct}% + {RADAR_RULE.taxPct}%). A análise
            definitiva é feita no Radar.
          </p>

          {saveError ? (
            <p className="rounded-md border border-status-stop/30 bg-status-stop/10 px-3 py-2 text-xs text-status-stop">
              {saveError}
            </p>
          ) : null}
          {saveInfo ? (
            <p className="rounded-md border border-status-go/30 bg-status-go/10 px-3 py-2 text-xs text-status-go">
              {saveInfo}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <Button type="button" onClick={onAnalyzeInRadar} disabled={savePending}>
              {savePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
              Analisar no Radar
            </Button>
            <Button type="button" variant="secondary" onClick={onSaveOnly} disabled={savePending}>
              Salvar oferta
            </Button>
          </div>
        </div>
      </aside>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function originFrom(found: boolean): FieldOrigin {
  return found ? "EXTRACTED" : "NOT_FOUND"
}

function ReviewField({
  label,
  origin,
  children,
  className,
}: {
  label: string
  origin?: FieldOrigin
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {origin ? <OriginMark origin={origin} /> : null}
      </div>
      {children}
    </div>
  )
}

function OriginMark({ origin }: { origin: FieldOrigin }) {
  if (origin === "EXTRACTED") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-status-go">
        <Check className="size-3" />
        Extraído
      </span>
    )
  }
  if (origin === "MANUAL") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
        <Pencil className="size-3" />
        Editado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-status-watch">
      <AlertTriangle className="size-3" />
      Não identificado
    </span>
  )
}

function Row({
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
        className={`font-mono tabular-nums ${strong ? "text-base font-semibold" : "font-medium"} ${accent ?? "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  )
}
