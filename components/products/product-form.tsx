"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Field, Input, Select, Textarea } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { createProductAction, updateProductAction, type ActionResult } from "@/app/actions/products"
import { calcMaxCost, calcResult, calcRoi } from "@/lib/calculations/pricing"
import { formatBRL, formatPercent } from "@/lib/utils"
import type { Product, PricingSettings } from "@/types"

export function ProductForm({
  product,
  settings,
}: {
  product?: Product
  settings: PricingSettings
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<ActionResult | null>(null)

  // Live preview state
  const [priceB2B, setPriceB2B] = useState(product?.priceB2B ?? 0)
  const [currentCost, setCurrentCost] = useState(product?.currentCost ?? 0)

  const maxCost = calcMaxCost(priceB2B, settings)
  const previewResult = calcResult(priceB2B, currentCost, settings)
  const previewRoi = calcRoi(priceB2B, currentCost, settings)
  const slack = maxCost - currentCost

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = product
        ? await updateProductAction(product.id, formData)
        : await createProductAction(formData)
      setResult(res)
      if (res.ok) {
        router.push(product ? `/produtos/${product.id}` : `/produtos/${res.id}`)
        router.refresh()
      }
    })
  }

  const fieldError = (name: string) => result?.fieldErrors?.[name]

  return (
    <form action={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-tight">Identificação</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="SKU" htmlFor="sku" error={fieldError("sku")}>
              <Input id="sku" name="sku" defaultValue={product?.sku} placeholder="JK-0001" required />
            </Field>
            <Field label="EAN / Código de barras" htmlFor="ean" error={fieldError("ean")}>
              <Input id="ean" name="ean" defaultValue={product?.ean ?? ""} placeholder="7891234567890" />
            </Field>
            <Field label="Nome do produto" htmlFor="name" error={fieldError("name")} className="sm:col-span-2">
              <Input id="name" name="name" defaultValue={product?.name} placeholder="Descrição comercial" required />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-tight">Financeiro</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Preço de venda B2B (R$)"
              htmlFor="priceB2B"
              error={fieldError("priceB2B")}
              hint="Preço praticado na venda para o mercado."
            >
              <Input
                id="priceB2B"
                name="priceB2B"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.priceB2B ?? ""}
                onChange={(e) => setPriceB2B(Number(e.target.value) || 0)}
                placeholder="0,00"
                required
              />
            </Field>
            <Field
              label="Custo de aquisição atual (R$)"
              htmlFor="currentCost"
              error={fieldError("currentCost")}
              hint="Melhor custo conhecido hoje."
            >
              <Input
                id="currentCost"
                name="currentCost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.currentCost ?? ""}
                onChange={(e) => setCurrentCost(Number(e.target.value) || 0)}
                placeholder="0,00"
                required
              />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-tight">Comercial e demanda</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Prioridade comercial" htmlFor="priority">
              <Select id="priority" name="priority" defaultValue={product?.priority ?? "NORMAL"}>
                <option value="HIGH">Alta</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Baixa</option>
              </Select>
            </Field>
            <Field
              label="Status manual (opcional)"
              htmlFor="manualStatus"
              hint="Sobrescreve o cálculo automático."
            >
              <Select id="manualStatus" name="manualStatus" defaultValue={product?.manualStatus ?? ""}>
                <option value="">Automático</option>
                <option value="HUNT_AGGRESSIVE">Caçar agressivamente</option>
                <option value="HUNT">Caçar</option>
                <option value="MONITOR">Monitorar</option>
                <option value="DO_NOT_BUY">Não comprar</option>
              </Select>
            </Field>
            <Field label="Demanda mensal (un.)" htmlFor="monthlyDemand">
              <Input
                id="monthlyDemand"
                name="monthlyDemand"
                type="number"
                min="0"
                defaultValue={product?.monthlyDemand ?? ""}
                placeholder="0"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Qtd. mínima" htmlFor="minQty">
                <Input id="minQty" name="minQty" type="number" min="0" defaultValue={product?.minQty ?? ""} placeholder="0" />
              </Field>
              <Field label="Qtd. máxima" htmlFor="maxQty">
                <Input id="maxQty" name="maxQty" type="number" min="0" defaultValue={product?.maxQty ?? ""} placeholder="0" />
              </Field>
            </div>
            <Field label="Observações" htmlFor="notes" className="sm:col-span-2">
              <Textarea id="notes" name="notes" defaultValue={product?.notes ?? ""} placeholder="Notas internas" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="active"
                defaultChecked={product ? product.active : true}
                className="h-4 w-4 accent-primary"
              />
              Produto ativo (monitorado no radar)
            </label>
          </div>
        </section>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="sticky top-6 flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold tracking-tight">Prévia do cálculo</h2>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Regra JK: custo {settings.costPct}% · margem {settings.marginPct}% · impostos {settings.taxPct}% do preço de venda.
          </p>
          <div className="flex flex-col gap-3 text-sm">
            <PreviewRow label="Custo máx. de compra" value={formatBRL(maxCost)} strong />
            <PreviewRow
              label="Folga vs. custo atual"
              value={formatBRL(slack)}
              accent={slack >= 0 ? "text-status-go" : "text-status-stop"}
            />
            <PreviewRow label="Resultado após imposto" value={formatBRL(previewResult)} />
            <PreviewRow label="ROI estimado" value={formatPercent(previewRoi)} />
          </div>

          {result?.error && !result.ok ? (
            <p className="rounded-md border border-status-stop/30 bg-status-stop/10 px-3 py-2 text-xs text-status-stop">
              {result.error}
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando…" : product ? "Salvar alterações" : "Cadastrar produto"}
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
      <span className={`tabular ${strong ? "text-base font-semibold" : "font-medium"} ${accent ?? "text-foreground"}`}>
        {value}
      </span>
    </div>
  )
}
