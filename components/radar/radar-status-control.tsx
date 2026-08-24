"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Select } from "@/components/ui/field"
import { updateRadarStatusAction } from "@/app/actions/radar"
import type { RadarStatus } from "@/types"
import { RADAR_STATUS_META } from "@/lib/utils"

const ORDER: RadarStatus[] = [
  "ENCONTRADA",
  "EM_ANALISE",
  "APROVADA",
  "COMPRADA",
  "VENDIDA",
  "DESCARTADA",
]

export function RadarStatusControl({ id, status }: { id: string; status: RadarStatus }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onChange(next: RadarStatus) {
    startTransition(async () => {
      await updateRadarStatusAction(id, next)
      router.refresh()
    })
  }

  return (
    <Select
      aria-label="Alterar status da oportunidade"
      defaultValue={status}
      disabled={pending}
      onChange={(e) => onChange(e.target.value as RadarStatus)}
      className="w-auto"
    >
      {ORDER.map((s) => (
        <option key={s} value={s}>
          {RADAR_STATUS_META[s].label}
        </option>
      ))}
    </Select>
  )
}
