import type { RadarStatus } from "@/types"
import { RADAR_STATUS_META, cn } from "@/lib/utils"

export function RadarStatusBadge({
  status,
  className,
}: {
  status: RadarStatus
  className?: string
}) {
  const meta = RADAR_STATUS_META[status]
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        meta.tone,
        className,
      )}
    >
      {meta.label}
    </span>
  )
}
