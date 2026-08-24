"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Select } from "@/components/ui/field"
import { updateHuntMissionStatusAction } from "@/app/actions/hunt"
import type { HuntStatus } from "@/types"
import { HUNT_STATUS_META } from "@/lib/utils"

const ORDER: HuntStatus[] = ["ATIVA", "PAUSADA", "CONCLUIDA", "CANCELADA"]

export function HuntStatusControl({ id, status }: { id: string; status: HuntStatus }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onChange(next: HuntStatus) {
    startTransition(async () => {
      await updateHuntMissionStatusAction(id, next)
      router.refresh()
    })
  }

  return (
    <Select
      aria-label="Alterar status da missão"
      defaultValue={status}
      disabled={pending}
      onChange={(e) => onChange(e.target.value as HuntStatus)}
      className="w-auto"
    >
      {ORDER.map((s) => (
        <option key={s} value={s}>
          {HUNT_STATUS_META[s].label}
        </option>
      ))}
    </Select>
  )
}
