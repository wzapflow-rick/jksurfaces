"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, X } from "lucide-react"
import { Field, Input, Select, Textarea } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { addBuyerProductAction, removeBuyerProductAction } from "@/app/actions/buyers"
import { formatBRL } from "@/lib/utils"
import type { BuyerProduct, Product } from "@/types"

interface LinkedRow {
  link: BuyerProduct
  product: Product | undefined
}

export function BuyerProducts({
  buyerId,
  linked,
  availableProducts,
}: {
  buyerId: string
  linked: LinkedRow[]
  availableProducts: Product[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function add(formData: FormData) {
    startTransition(async () => {
      const res = await addBuyerProductAction(formData)
      if (res.ok) {
        setOpen(false)
        setError(null)
        router.refresh()
      } else {
        setError(res.error ?? "Erro ao vincular produto.")
      }
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      await removeBuyerProductAction(id, buyerId)
      router.refresh()
    })
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight">Produtos de interesse</h2>
          <span className="tabular rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {linked.length}
          </span>
        </div>
        {!open ? (
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)} disabled={availableProducts.length === 0}>
            <Plus className="h-4 w-4" />
            Vincular
          </Button>
        ) : null}
      </div>

      {open ? (
        <form action={add} className="mb-5 flex flex-col gap-4 rounded-lg border border-border-strong bg-surface-2 p-4">
          <input type="hidden" name="buyerId" value={buyerId} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Produto" htmlFor="productId" className="sm:col-span-2">
              <Select id="productId" name="productId" required defaultValue="">
                <option value="" disabled>
                  Selecione um produto
                </option>
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Preço-alvo máx. (R$)" htmlFor="maxPrice">
              <Input id="maxPrice" name="maxPrice" type="number" step="0.01" min="0" placeholder="0,00" />
            </Field>
            <Field label="Frequência" htmlFor="frequency">
              <Input id="frequency" name="frequency" placeholder="Ex.: mensal" />
            </Field>
            <Field label="Qtd. mínima" htmlFor="minQty">
              <Input id="minQty" name="minQty" type="number" min="0" placeholder="0" />
            </Field>
            <Field label="Qtd. máxima" htmlFor="maxQty">
              <Input id="maxQty" name="maxQty" type="number" min="0" placeholder="0" />
            </Field>
            <Field label="Observações" htmlFor="bp-notes" className="sm:col-span-2">
              <Textarea id="bp-notes" name="notes" placeholder="Notas do interesse" />
            </Field>
          </div>
          {error ? <p className="text-xs text-status-stop">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Vinculando…" : "Vincular produto"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {linked.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {availableProducts.length === 0
            ? "Todos os produtos já estão vinculados."
            : "Nenhum produto vinculado a este comprador ainda."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {linked.map(({ link, product }) => (
            <li
              key={link.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5"
            >
              <div className="min-w-0">
                {product ? (
                  <Link href={`/produtos/${product.id}`} className="block">
                    <p className="tabular text-xs text-muted-foreground">{product.sku}</p>
                    <p className="truncate text-sm font-medium hover:underline">{product.name}</p>
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">Produto removido</p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {link.maxPrice != null ? `Alvo ${formatBRL(link.maxPrice)}` : "Sem alvo de preço"}
                  {link.frequency ? ` · ${link.frequency}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(link.id)}
                disabled={pending}
                aria-label="Remover vínculo"
                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-status-stop/10 hover:text-status-stop disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
