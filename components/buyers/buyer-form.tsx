"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Field, Input, Textarea } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { createBuyerAction, updateBuyerAction } from "@/app/actions/buyers"
import type { ActionResult } from "@/app/actions/products"
import type { Buyer } from "@/types"

export function BuyerForm({ buyer }: { buyer?: Buyer }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<ActionResult | null>(null)

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = buyer ? await updateBuyerAction(buyer.id, formData) : await createBuyerAction(formData)
      setResult(res)
      if (res.ok) {
        router.push(buyer ? `/compradores/${buyer.id}` : `/compradores/${res.id}`)
        router.refresh()
      }
    })
  }

  const fieldError = (name: string) => result?.fieldErrors?.[name]

  return (
    <form action={onSubmit} className="flex max-w-2xl flex-col gap-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">Dados do comprador</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome" htmlFor="name" error={fieldError("name")} className="sm:col-span-2">
            <Input id="name" name="name" defaultValue={buyer?.name} placeholder="Nome do comprador" required />
          </Field>
          <Field label="Empresa" htmlFor="company" error={fieldError("company")}>
            <Input id="company" name="company" defaultValue={buyer?.company ?? ""} placeholder="Razão social" />
          </Field>
          <Field label="Telefone" htmlFor="phone" error={fieldError("phone")}>
            <Input id="phone" name="phone" defaultValue={buyer?.phone ?? ""} placeholder="(00) 00000-0000" />
          </Field>
          <Field label="E-mail" htmlFor="email" error={fieldError("email")} className="sm:col-span-2">
            <Input id="email" name="email" type="email" defaultValue={buyer?.email ?? ""} placeholder="email@empresa.com" />
          </Field>
          <Field label="Observações" htmlFor="notes" className="sm:col-span-2">
            <Textarea id="notes" name="notes" defaultValue={buyer?.notes ?? ""} placeholder="Notas internas" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={buyer ? buyer.active : true}
              className="h-4 w-4 accent-primary"
            />
            Comprador ativo
          </label>
        </div>
      </section>

      {result?.error && !result.ok ? (
        <p className="rounded-md border border-status-stop/30 bg-status-stop/10 px-3 py-2 text-xs text-status-stop">
          {result.error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : buyer ? "Salvar alterações" : "Cadastrar comprador"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
