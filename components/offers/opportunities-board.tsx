"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Trash2, ExternalLink } from "lucide-react"
import { Field, Input, Select, Textarea } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Score } from "@/components/ui/score"
import { createOfferAction, deleteOfferAction } from "@/app/actions/offers"
import { formatBRL, formatPercent } from "@/lib/utils"
import type { OfferWithMetrics, ProductWithMetrics } from "@/types"

export function OpportunitiesBoard({
  offers,
  products,
}: {
  offers: OfferWithMetrics[]
  products: ProductWithMetrics[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [productId, setProductId] = useState("")
  const [price, setPrice] = useState(0)
  const [shipping, setShipping] = useState(0)

  const selected = useMemo(() => products.find((p) => p.id === productId), [products, productId])
  const totalCost = price + shipping
  const maxCost = selected?.metrics.maxCost ?? 0
  const slack = maxCost - totalCost

  function add(formData: FormData) {
    startTransition(async () => {
      const res = await createOfferAction(formData)
      if (res.ok) {
        setOpen(false)
        setError(null)
        setProductId("")
        setPrice(0)
        setShipping(0)
        router.refresh()
      } else {
        setError(res.error ?? "Erro ao registrar oportunidade.")
      }
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteOfferAction(id)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        {!open ? (
          <Button onClick={() => setOpen(true)} disabled={products.length === 0}>
            <Plus className="h-4 w-4" />
            Registrar oportunidade
          </Button>
        ) : null}
      </div>

      {open ? (
        <form action={add} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold tracking-tight">Nova oportunidade</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Produto" htmlFor="productId" className="sm:col-span-2">
              <Select
                id="productId"
                name="productId"
                required
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                <option value="" disabled>
                  Selecione um produto
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name} (máx {formatBRL(p.metrics.maxCost)})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Fornecedor / origem" htmlFor="source">
              <Input id="source" name="source" placeholder="Ex.: Fornecedor X" required />
            </Field>
            <Field label="Link (opcional)" htmlFor="url">
              <Input id="url" name="url" type="url" placeholder="https://" />
            </Field>
            <Field label="Preço ofertado (R$)" htmlFor="price">
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                placeholder="0,00"
              />
            </Field>
            <Field label="Frete (R$)" htmlFor="shipping">
              <Input
                id="shipping"
                name="shipping"
                type="number"
                step="0.01"
                min="0"
                onChange={(e) => setShipping(Number(e.target.value) || 0)}
                placeholder="0,00"
              />
            </Field>
            <Field label="Quantidade disponível" htmlFor="availableQty">
              <Input id="availableQty" name="availableQty" type="number" min="0" placeholder="0" />
            </Field>
            <Field label="Observações" htmlFor="offer-notes">
              <Textarea id="offer-notes" name="notes" placeholder="Condições, prazo, etc." />
            </Field>
          </div>

          {selected ? (
            <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border-strong bg-surface-2 px-4 py-3 text-sm">
              <span className="text-xs text-muted-foreground">
                Custo total <strong className="tabular text-foreground">{formatBRL(totalCost)}</strong> vs. teto{" "}
                <strong className="tabular text-foreground">{formatBRL(maxCost)}</strong>
              </span>
              <span
                className={`tabular rounded-md px-2 py-1 text-xs font-medium ${
                  slack >= 0 ? "bg-status-go/10 text-status-go" : "bg-status-stop/10 text-status-stop"
                }`}
              >
                {slack >= 0 ? `Folga ${formatBRL(slack)}` : `Acima do teto ${formatBRL(Math.abs(slack))}`}
              </span>
            </div>
          ) : null}

          {error ? <p className="text-xs text-status-stop">{error}</p> : null}

          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Registrando…" : "Registrar"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {offers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <p className="text-sm font-medium">Nenhuma oportunidade registrada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre ofertas de fornecedores para avaliá-las contra o custo máximo de cada produto.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {offers.map((o) => (
            <div key={o.id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{o.source}</p>
                  <Link
                    href={`/produtos/${o.productId}`}
                    className="tabular text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {o.product.sku} — {o.product.name}
                  </Link>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {o.url ? (
                    <a
                      href={o.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Abrir link da oferta"
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => remove(o.id)}
                    disabled={pending}
                    aria-label="Remover oportunidade"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-status-stop/10 hover:text-status-stop disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <Metric label="Custo total" value={formatBRL(o.metrics.totalCost)} />
                <Metric label="Custo máx." value={formatBRL(o.metrics.maxCost)} />
                <Metric
                  label="Folga"
                  value={formatBRL(o.metrics.slack)}
                  accent={o.metrics.slack >= 0 ? "text-status-go" : "text-status-stop"}
                />
                <Metric label="Resultado" value={formatBRL(o.metrics.result)} />
                <Metric label="ROI" value={formatPercent(o.metrics.roi)} />
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Score</span>
                  <Score value={o.metrics.score} showBar={false} />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <StatusBadge status={o.metrics.status} />
                {o.availableQty != null ? (
                  <span className="tabular text-xs text-muted-foreground">{o.availableQty} un. disponíveis</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular font-medium ${accent ?? "text-foreground"}`}>{value}</span>
    </div>
  )
}
