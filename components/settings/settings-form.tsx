"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { Field, Input } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { updateSettingsAction } from "@/app/actions/settings"
import type { ActionResult } from "@/app/actions/products"
import type { PricingSettings } from "@/types"

export function SettingsForm({ settings }: { settings: PricingSettings }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<ActionResult | null>(null)
  const [saved, setSaved] = useState(false)

  const [cost, setCost] = useState(settings.costPct)
  const [margin, setMargin] = useState(settings.marginPct)
  const [tax, setTax] = useState(settings.taxPct)

  const total = Number((cost + margin + tax).toFixed(2))
  const balanced = Math.abs(total - 100) < 0.001

  function onSubmit(formData: FormData) {
    setSaved(false)
    startTransition(async () => {
      const res = await updateSettingsAction(formData)
      setResult(res)
      if (res.ok) {
        setSaved(true)
        router.refresh()
      }
    })
  }

  return (
    <form action={onSubmit} className="flex max-w-2xl flex-col gap-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold tracking-tight">Regra financeira da JK</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Distribuição percentual dentro do preço de venda. A soma precisa ser exatamente 100%. Alterar aqui recalcula
          automaticamente todos os produtos, custos máximos e scores.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Custo de aquisição (%)" htmlFor="costPct" error={result?.fieldErrors?.costPct}>
            <Input
              id="costPct"
              name="costPct"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={cost}
              onChange={(e) => setCost(Number(e.target.value) || 0)}
              required
            />
          </Field>
          <Field label="Margem / lucro (%)" htmlFor="marginPct">
            <Input
              id="marginPct"
              name="marginPct"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value) || 0)}
              required
            />
          </Field>
          <Field label="Impostos / notas (%)" htmlFor="taxPct">
            <Input
              id="taxPct"
              name="taxPct"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={tax}
              onChange={(e) => setTax(Number(e.target.value) || 0)}
              required
            />
          </Field>
        </div>

        <div
          className={`mt-4 flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
            balanced
              ? "border-status-go/30 bg-status-go/10 text-status-go"
              : "border-status-stop/30 bg-status-stop/10 text-status-stop"
          }`}
        >
          <span className="font-medium">Soma total</span>
          <span className="tabular font-semibold">{total}%</span>
        </div>
        {!balanced ? (
          <p className="mt-2 text-xs text-status-stop">A soma precisa ser exatamente 100% para salvar.</p>
        ) : null}
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || !balanced}>
          {pending ? "Salvando…" : "Salvar regra"}
        </Button>
        {saved && result?.ok ? (
          <span className="flex items-center gap-1.5 text-sm text-status-go">
            <Check className="h-4 w-4" />
            Regra atualizada
          </span>
        ) : null}
      </div>
    </form>
  )
}
