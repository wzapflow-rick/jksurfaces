"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toggleProductActiveAction } from "@/app/actions/products"
import { cn } from "@/lib/utils"

export function ActiveToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      await toggleProductActiveAction(id, !active)
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      role="switch"
      aria-checked={active}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
        active
          ? "border-status-go/30 bg-status-go/10 text-status-go"
          : "border-border-strong bg-surface-2 text-muted-foreground",
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", active ? "bg-status-go" : "bg-muted-foreground")} />
      {active ? "Ativo" : "Inativo"}
    </button>
  )
}
