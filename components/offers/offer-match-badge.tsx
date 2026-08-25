import type { MatchMethod, MatchStatus } from "@/types"
import { MATCH_METHOD_META, MATCH_STATUS_META, cn } from "@/lib/utils"

/**
 * Badge do status de associação de uma oferta a um produto JK. Deixa explícito
 * quando a associação é de baixa confiança (REVIEW) — nunca tratada como certa.
 */
export function OfferMatchBadge({
  status,
  method,
  confidence,
  className,
}: {
  status: MatchStatus
  method: MatchMethod
  confidence: number
  className?: string
}) {
  const meta = MATCH_STATUS_META[status]
  const showDetail = status !== "UNMATCHED"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        meta.tone,
        className,
      )}
      title={showDetail ? `${MATCH_METHOD_META[method].label} · confiança ${Math.round(confidence * 100)}%` : undefined}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
      {showDetail ? (
        <span className="font-mono text-[10px] opacity-80">{Math.round(confidence * 100)}%</span>
      ) : null}
    </span>
  )
}
