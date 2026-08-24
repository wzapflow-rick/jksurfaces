import { cn } from "@/lib/utils"

function scoreColor(score: number) {
  if (score >= 75) return "text-status-hot"
  if (score >= 55) return "text-status-go"
  if (score >= 35) return "text-status-watch"
  return "text-muted-foreground"
}

function scoreBar(score: number) {
  if (score >= 75) return "bg-status-hot"
  if (score >= 55) return "bg-status-go"
  if (score >= 35) return "bg-status-watch"
  return "bg-border-strong"
}

export function Score({ value, showBar = true, className }: { value: number; showBar?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("tabular text-sm font-semibold", scoreColor(value))}>{value}</span>
      {showBar ? (
        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", scoreBar(value))}
            style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}
