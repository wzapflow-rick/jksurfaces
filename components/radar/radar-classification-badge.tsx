import type { RadarClassification } from "@/types"
import { RADAR_CLASSIFICATION_META, cn } from "@/lib/utils"

export function RadarClassificationBadge({
  classification,
  className,
}: {
  classification: RadarClassification
  className?: string
}) {
  const meta = RADAR_CLASSIFICATION_META[classification]
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
