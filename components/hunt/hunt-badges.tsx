import type { HuntPriority, HuntStatus } from "@/types"
import { HUNT_PRIORITY_META, HUNT_STATUS_META, cn } from "@/lib/utils"

export function HuntPriorityBadge({
  priority,
  className,
}: {
  priority: HuntPriority
  className?: string
}) {
  const meta = HUNT_PRIORITY_META[priority]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        meta.tone,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </span>
  )
}

export function HuntStatusBadge({
  status,
  className,
}: {
  status: HuntStatus
  className?: string
}) {
  const meta = HUNT_STATUS_META[status]
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
