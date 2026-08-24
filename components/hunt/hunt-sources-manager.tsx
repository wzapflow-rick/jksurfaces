"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"
import { Field, Input, Select } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { HuntSourceTypeIcon } from "./hunt-source-icon"
import {
  createHuntSourceAction,
  deleteHuntSourceAction,
  toggleHuntSourceAction,
} from "@/app/actions/hunt"
import type { ActionResult } from "@/app/actions/products"
import { HUNT_SOURCE_TYPE_META } from "@/lib/utils"
import type { HuntSource, HuntSourceType } from "@/types"

const TYPES: { value: HuntSourceType; label: string }[] = [
  { value: "MARKETPLACE", label: "Marketplace" },
  { value: "LOJA_FISICA", label: "Loja física" },
  { value: "FORNECEDOR", label: "Fornecedor" },
  { value: "OUTRO", label: "Outro" },
]

export function HuntSourcesManager({ sources }: { sources: HuntSource[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<ActionResult | null>(null)
  const [open, setOpen] = useState(false)

  function onCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createHuntSourceAction(formData)
      setResult(res)
      if (res.ok) {
        setOpen(false)
        router.refresh()
      }
    })
  }

  function onToggle(id: string, active: boolean) {
    startTransition(async () => {
      await toggleHuntSourceAction(id, active)
      router.refresh()
    })
  }

  function onDelete(id: string) {
    startTransition(async () => {
      await deleteHuntSourceAction(id)
      router.refresh()
    })
  }

  const fieldError = (name: string) => result?.fieldErrors?.[name]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sources.length} fonte(s) cadastrada(s)
        </p>
        <Button size="sm" variant={open ? "ghost" : "primary"} onClick={() => setOpen((o) => !o)}>
          <Plus className="h-4 w-4" />
          {open ? "Fechar" : "Nova fonte"}
        </Button>
      </div>

      {open && (
        <form
          action={onCreate}
          className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2"
        >
          <Field label="Nome da fonte" htmlFor="name" error={fieldError("name")}>
            <Input id="name" name="name" placeholder="Ex.: Enjoei" required />
          </Field>
          <Field label="Tipo" htmlFor="type" error={fieldError("type")}>
            <Select id="type" name="type" defaultValue="MARKETPLACE">
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="URL base (opcional)"
            htmlFor="urlBase"
            error={fieldError("urlBase")}
            className="sm:col-span-2"
          >
            <Input id="urlBase" name="urlBase" type="url" placeholder="https://www.exemplo.com.br" />
          </Field>
          <Field
            label="Template de busca (opcional)"
            htmlFor="searchUrlTemplate"
            error={fieldError("searchUrlTemplate")}
            hint="Use {q} onde entra o termo. Ex.: https://site.com/busca?q={q}"
            className="sm:col-span-2"
          >
            <Input
              id="searchUrlTemplate"
              name="searchUrlTemplate"
              placeholder="https://site.com/busca?q={q}"
            />
          </Field>
          {result?.error && !result.ok ? (
            <p className="rounded-md border border-status-stop/30 bg-status-stop/10 px-3 py-2 text-xs text-status-stop sm:col-span-2">
              {result.error}
            </p>
          ) : null}
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Salvando…" : "Adicionar fonte"}
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        {sources.map((source, i) => (
          <div
            key={source.id}
            className={`flex items-center justify-between gap-3 bg-card px-4 py-3 ${
              i > 0 ? "border-t border-border" : ""
            } ${!source.active ? "opacity-50" : ""}`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-2">
                <HuntSourceTypeIcon type={source.type} className="size-4 text-foreground" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{source.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {HUNT_SOURCE_TYPE_META[source.type].label}
                  {source.searchUrlTemplate ? " · busca automática" : source.urlBase ? " · link direto" : " · manual"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={source.active}
                  onChange={(e) => onToggle(source.id, e.target.checked)}
                  disabled={pending}
                />
                Ativa
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(source.id)}
                disabled={pending}
                aria-label={`Remover fonte ${source.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
