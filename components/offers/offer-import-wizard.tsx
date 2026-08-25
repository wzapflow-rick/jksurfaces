"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardPaste,
  Link2,
  Pencil,
  Sparkles,
  Target,
} from "lucide-react"
import type { FieldOrigin, OfferCondition } from "@/types"
import { formatBRL } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, Input, Select, Textarea } from "@/components/ui/field"
import {
  analyzeAdAction,
  importOfferAction,
  type ImportActionResult,
} from "@/app/actions/offer-import"

/* Estado editável do formulário de revisão. */
interface FormState {
  productTitle: string
  brand: string
  sku: string
  ean: string
  price: string
  quantity: string
  condition: OfferCondition
  priceNegotiable: boolean
  location: string
  shipping: string
  url: string
  notes: string
}

const EMPTY: FormState = {
  productTitle: "",
  brand: "",
  sku: "",
  ean: "",
  price: "",
  quantity: "1",
  condition: "UNKNOWN",
  priceNegotiable: false,
  location: "",
  shipping: "",
  url: "",
  notes: "",
}

type Origins = Record<string, FieldOrigin>

/** Prefill opcional vindo de uma missão de caça. */
export interface ImportWizardPrefill {
  missionId?: string
  brand?: string
  sku?: string
  salePrice?: number
}

export function OfferImportWizard({ prefill }: { prefill?: ImportWizardPrefill }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // Entrada bruta.
  const [rawUrl, setRawUrl] = useState("")
  const [rawText, setRawText] = useState("")

  // Estado revisado + origens por campo.
  const [analyzed, setAnalyzed] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [origins, setOrigins] = useState<Origins>({})
  const [conflicts, setConflicts] = useState<string[]>([])
  const [autoReadFailed, setAutoReadFailed] = useState(false)

  // Feedback.
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportActionResult | null>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    // Editar um campo muda sua origem para "editado".
    setOrigins((o) => ({ ...o, [key]: "EDITED" }))
    setResult(null)
  }

  /* --------------------------- Analisar --------------------------- */
  function handleAnalyze() {
    setError(null)
    setResult(null)
    startTransition(async () => {
      const res = await analyzeAdAction({ text: rawText, url: rawUrl })
      if (!res.ok || !res.parsed) {
        setError(res.error ?? "Não foi possível analisar o anúncio.")
        return
      }
      const p = res.parsed
      setForm({
        productTitle: p.productTitle ?? "",
        brand: p.brand ?? prefill?.brand ?? "",
        sku: p.sku ?? prefill?.sku ?? "",
        ean: p.ean ?? "",
        price: p.price !== null ? String(p.price) : "",
        quantity: String(p.quantity),
        condition: p.condition,
        priceNegotiable: p.priceNegotiable,
        location: p.location.city
          ? `${p.location.city}${p.location.state ? ` - ${p.location.state}` : ""}`
          : "",
        shipping: "",
        url: p.url ?? rawUrl.trim(),
        notes: "",
      })
      setOrigins(p.origins ?? {})
      setConflicts(p.conflicts ?? [])
      setAutoReadFailed(Boolean(res.autoReadFailed))
      setAnalyzed(true)
    })
  }

  function handleManual() {
    setError(null)
    setResult(null)
    setForm({ ...EMPTY, url: rawUrl.trim(), brand: prefill?.brand ?? "", sku: prefill?.sku ?? "" })
    setOrigins({})
    setConflicts([])
    setAutoReadFailed(false)
    setAnalyzed(true)
  }

  /* --------------------------- Importar --------------------------- */
  const priceNum = Number(form.price) || 0
  const qtyNum = Math.max(1, Math.floor(Number(form.quantity) || 1))
  const unit = qtyNum > 0 ? priceNum / qtyNum : priceNum
  const isLot = qtyNum > 1

  function handleImport() {
    setError(null)
    if (!form.productTitle.trim()) {
      setError("Informe o nome do produto antes de importar.")
      return
    }
    if (unit <= 0) {
      setError("Informe um preço válido.")
      return
    }
    startTransition(async () => {
      const res = await importOfferAction({
        source: "OLX",
        url: form.url.trim() || null,
        productTitle: form.productTitle.trim(),
        brand: form.brand.trim() || null,
        sku: form.sku.trim() || null,
        ean: form.ean.trim() || null,
        price: priceNum,
        quantity: qtyNum,
        unitPrice: unit,
        isLot,
        condition: form.condition,
        priceNegotiable: form.priceNegotiable,
        location: form.location.trim() || null,
        shipping: form.shipping.trim() === "" ? null : Number(form.shipping) || 0,
        notes: form.notes.trim() || null,
        fieldOrigins: origins,
      })
      if (!res.ok) {
        setError(res.error ?? "Não foi possível importar.")
        return
      }
      setResult(res)
      router.refresh()
    })
  }

  function radarHref(): string {
    const r = result?.radar
    const params = new URLSearchParams({
      name: form.productTitle.trim(),
      source: "OLX",
      announcedPrice: String(r?.unitPrice ?? unit),
    })
    if (form.url.trim().startsWith("http")) params.set("url", form.url.trim())
    if (form.shipping.trim() !== "") params.set("shipping", form.shipping.trim())
    if (qtyNum > 1) params.set("availableQty", String(qtyNum))
    const sku = r?.productSku ?? (form.sku.trim() || "")
    if (sku) params.set("sku", sku)
    if (form.brand.trim()) params.set("brand", form.brand.trim())
    const salePrice = r?.salePrice ?? prefill?.salePrice
    if (salePrice) params.set("salePrice", String(salePrice))
    if (prefill?.missionId) params.set("missionId", prefill.missionId)
    return `/radar/novo?${params.toString()}`
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ---------------- Passo 1: entrada ---------------- */}
      <section className="rounded-lg border border-border-strong bg-surface-1 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Importar anúncio da OLX</h2>
        </div>
        <div className="flex flex-col gap-3">
          <Field
            label="Link do anúncio (opcional)"
            htmlFor="import-url"
            hint="Tentamos ler dados públicos do link. Se a OLX bloquear a leitura automática, cole o texto abaixo."
          >
            <div className="flex items-center gap-2">
              <Link2 className="size-4 shrink-0 text-muted-foreground" />
              <Input
                id="import-url"
                type="url"
                inputMode="url"
                placeholder="https://... (cole o link do anúncio)"
                value={rawUrl}
                onChange={(e) => setRawUrl(e.target.value)}
              />
            </div>
          </Field>
          <Field
            label="Texto do anúncio"
            htmlFor="import-text"
            hint="Cole o título, o preço e a descrição do anúncio. Nós extraímos os campos automaticamente para você revisar."
          >
            <Textarea
              id="import-text"
              placeholder={"Ex.: Torneira Deca 1176 nova na caixa\nR$ 250\nKit com 4 unidades\nRio de Janeiro - RJ\nAceito proposta"}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={5}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleAnalyze} disabled={pending || (!rawText.trim() && !rawUrl.trim())}>
              <Sparkles className="size-4" />
              {pending ? "Analisando..." : "Analisar anúncio"}
            </Button>
            <Button variant="secondary" onClick={handleManual} disabled={pending}>
              <Pencil className="size-4" />
              Preencher manualmente
            </Button>
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-md border border-status-stop/30 bg-status-stop/10 px-3 py-2 text-sm text-status-stop">
          {error}
        </p>
      ) : null}

      {/* ---------------- Passo 2: revisão ---------------- */}
      {analyzed ? (
        <section className="rounded-lg border border-border-strong bg-surface-1 p-4">
          <div className="mb-1 flex items-center gap-2">
            <ClipboardPaste className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Revisar antes de importar</h2>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Revise cada campo. O sistema nunca inventa dados: campos não reconhecidos ficam em
            branco para você preencher. Nada é enviado ao Radar automaticamente.
          </p>

          {autoReadFailed ? (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-status-watch/30 bg-status-watch/10 px-3 py-2 text-xs text-status-watch">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                Não foi possível ler o link automaticamente (a OLX protege o acesso automatizado).
                Cole o texto do anúncio acima e analise novamente, ou preencha os campos manualmente.
                O link foi preservado.
              </span>
            </div>
          ) : null}

          {conflicts.length > 0 ? (
            <div className="mb-4 flex flex-col gap-1 rounded-md border border-status-watch/30 bg-status-watch/10 px-3 py-2 text-xs text-status-watch">
              {conflicts.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Produto" htmlFor="f-title" className="sm:col-span-2">
              <div className="flex items-center gap-2">
                <OriginMark origin={origins.productTitle} />
                <Input
                  id="f-title"
                  value={form.productTitle}
                  onChange={(e) => set("productTitle", e.target.value)}
                  placeholder="Nome do produto anunciado"
                />
              </div>
            </Field>

            <Field label="Marca" htmlFor="f-brand">
              <div className="flex items-center gap-2">
                <OriginMark origin={origins.brand} />
                <Input id="f-brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
              </div>
            </Field>

            <Field label="SKU / referência" htmlFor="f-sku">
              <div className="flex items-center gap-2">
                <OriginMark origin={origins.sku} />
                <Input id="f-sku" value={form.sku} onChange={(e) => set("sku", e.target.value)} />
              </div>
            </Field>

            <Field label="Preço total anunciado (R$)" htmlFor="f-price">
              <div className="flex items-center gap-2">
                <OriginMark origin={origins.price} />
                <Input
                  id="f-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </Field>

            <Field label="Quantidade (lote)" htmlFor="f-qty">
              <div className="flex items-center gap-2">
                <OriginMark origin={origins.quantity} />
                <Input
                  id="f-qty"
                  type="number"
                  step="1"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                />
              </div>
            </Field>

            <Field label="Condição" htmlFor="f-cond">
              <div className="flex items-center gap-2">
                <OriginMark origin={origins.condition} />
                <Select
                  id="f-cond"
                  value={form.condition}
                  onChange={(e) => set("condition", e.target.value as OfferCondition)}
                >
                  <option value="NEW">Novo</option>
                  <option value="USED">Usado</option>
                  <option value="UNKNOWN">A revisar</option>
                </Select>
              </div>
            </Field>

            <Field label="Frete (R$, opcional)" htmlFor="f-ship">
              <Input
                id="f-ship"
                type="number"
                step="0.01"
                min="0"
                value={form.shipping}
                onChange={(e) => set("shipping", e.target.value)}
                placeholder="0,00"
              />
            </Field>

            <Field label="Localização" htmlFor="f-loc">
              <div className="flex items-center gap-2">
                <OriginMark origin={origins.location} />
                <Input
                  id="f-loc"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="Cidade - UF"
                />
              </div>
            </Field>

            <Field label="Link do anúncio" htmlFor="f-url" className="sm:col-span-2">
              <Input id="f-url" value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://" />
            </Field>

            <Field label="Observações" htmlFor="f-notes" className="sm:col-span-2">
              <Textarea id="f-notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
            </Field>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground sm:col-span-2">
              <input
                type="checkbox"
                checked={form.priceNegotiable}
                onChange={(e) => set("priceNegotiable", e.target.checked)}
                className="size-4 rounded border-border-strong"
              />
              Preço negociável (não altera o valor analisado)
            </label>
          </div>

          {/* Prévia do preço unitário — o valor que o Radar vai usar. */}
          {priceNum > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-md border border-border-strong bg-surface-2 px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                Preço unitário:{" "}
                <span className="font-mono font-semibold text-foreground">{formatBRL(unit)}</span>
              </span>
              {isLot ? (
                <span className="text-xs text-muted-foreground">
                  ({formatBRL(priceNum)} ÷ {qtyNum} un — este é o valor comparado no Radar)
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={handleImport} disabled={pending}>
              {pending ? "Importando..." : "Importar oferta"}
            </Button>
            {result?.ok ? (
              <Link href={radarHref()}>
                <Button variant="secondary">
                  <Target className="size-4" />
                  Analisar no Radar
                </Button>
              </Link>
            ) : null}
          </div>

          {result?.ok ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-status-go">
              <CheckCircle2 className="size-4" />
              {result.created ? "Oferta importada!" : "Oferta atualizada!"}
              {result.priceChange
                ? ` Preço ${result.priceChange.pct >= 0 ? "subiu" : "caiu"} ${Math.abs(
                    result.priceChange.pct,
                  ).toFixed(1)}% desde a última importação.`
                : ""}{" "}
              <Link href="/ofertas" className="underline">
                Ver em Ofertas
              </Link>
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}

/** Marca visual da origem de um campo: extraído (✓), editado (✎) ou ausente (⚠). */
function OriginMark({ origin }: { origin?: FieldOrigin }) {
  if (origin === "EXTRACTED") {
    return (
      <span title="Extraído do anúncio" className="text-status-go">
        <CheckCircle2 className="size-4" />
      </span>
    )
  }
  if (origin === "EDITED") {
    return (
      <span title="Editado por você" className="text-primary">
        <Pencil className="size-4" />
      </span>
    )
  }
  return (
    <span title="Não identificado — preencha" className="text-status-watch">
      <AlertTriangle className="size-4" />
    </span>
  )
}
