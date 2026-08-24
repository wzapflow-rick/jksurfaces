"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteRadarOpportunityAction } from "@/app/actions/radar"

export function RadarDeleteButton({ id, redirectTo }: { id: string; redirectTo?: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function onDelete() {
    startTransition(async () => {
      await deleteRadarOpportunityAction(id)
      if (redirectTo) router.push(redirectTo)
      router.refresh()
    })
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="danger" size="sm" onClick={onDelete} disabled={pending}>
          {pending ? "Removendo…" : "Confirmar"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
          Cancelar
        </Button>
      </div>
    )
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} aria-label="Remover oportunidade">
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
