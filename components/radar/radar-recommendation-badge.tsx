import type { RadarRecommendation } from "@/types"
import { RADAR_RECOMMENDATION_META, cn } from "@/lib/utils"

export function RadarRecommendationBadge({
  recommendation,
  size = "md",
  className,
}: {
  recommendation: RadarRecommendation
  size?: "sm" | "md"
  className?: string
}) {
  const meta = RADAR_RECOMMENDATION_META[recommendation]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-full border font-semibold uppercase tracking-wide",
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3.5 py-1.5 text-sm",
        meta.tone,
        className,
      )}
    >
      <span className={cn("rounded-full", size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2", meta.dot)} aria-hidden />
      {size === "sm" ? meta.short : meta.label}
    </span>
  )
}
