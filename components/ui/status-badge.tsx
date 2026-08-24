import type { AcquisitionStatus } from "@/types"
import { STATUS_META, cn } from "@/lib/utils"

export function StatusBadge({
  status,
  short = false,
  className,
}: {
  status: AcquisitionStatus
  short?: boolean
  className?: string
}) {
  const meta = STATUS_META[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        meta.tone,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
      {short ? meta.short : meta.label}
    </span>
  )
}
