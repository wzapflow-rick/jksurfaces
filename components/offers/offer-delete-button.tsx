"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { deleteSourceOfferAction } from "@/app/actions/source-offers"
import { Button } from "@/components/ui/button"

export function OfferDeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onDelete() {
    if (!confirm("Remover esta oferta capturada?")) return
    startTransition(async () => {
      await deleteSourceOfferAction(id)
      router.refresh()
    })
  }

  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      onClick={onDelete}
      disabled={pending}
      aria-label="Remover oferta"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Remover
    </Button>
  )
}
