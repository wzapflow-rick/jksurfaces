import type { RadarRecommendation } from "@/types"
import { formatBRL, RADAR_RECOMMENDATION_META, cn } from "@/lib/utils"

/**
 * Comparação visual da caça: onde o PREÇO ENCONTRADO cai em relação ao preço
 * recomendado e ao preço máximo de aquisição.
 *
 * Faixas do trilho:
 *   0 → recomendado ......... verde  (caçar)
 *   recomendado → máximo .... âmbar  (avaliar)
 *   acima do máximo ......... vermelho (não vale)
 *
 * Puramente apresentacional — todos os números vêm do motor central.
 */
export function RadarPriceLadder({
  foundPrice,
  recommendedPrice,
  maxPrice,
  recommendation,
}: {
  foundPrice: number
  recommendedPrice: number
  maxPrice: number
  recommendation: RadarRecommendation
}) {
  const meta = RADAR_RECOMMENDATION_META[recommendation]
  const foundTone: Record<RadarRecommendation, string> = {
    CACAR: "text-status-go",
    AVALIAR: "text-status-hot",
    NAO_VALE: "text-status-stop",
  }

  // Valores de exibição não podem ser negativos.
  const recDisplay = Math.max(recommendedPrice, 0)
  const maxDisplay = Math.max(maxPrice, 0)

  // Domínio do trilho: acomoda o maior valor entre encontrado e máximo.
  const domain = Math.max(foundPrice, maxDisplay, 1) * 1.15
  const pct = (v: number) => `${Math.min(Math.max((v / domain) * 100, 0), 100)}%`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <PriceRow
          label="Preço encontrado"
          value={foundPrice}
          emphasis
          accent={foundTone[recommendation]}
        />
        <PriceRow label="Preço recomendado de compra" value={recDisplay} accent="text-status-go" />
        <PriceRow label="Preço máximo de aquisição" value={maxDisplay} accent="text-foreground" />
      </div>

      {/* Trilho de faixas */}
      <div className="flex flex-col gap-2">
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-status-stop/30">
          {/* faixa verde (0 → recomendado) */}
          <div
            className="absolute inset-y-0 left-0 bg-status-go/70"
            style={{ width: pct(recDisplay) }}
            aria-hidden
          />
          {/* faixa âmbar (recomendado → máximo) */}
          <div
            className="absolute inset-y-0 bg-status-hot/70"
            style={{ left: pct(recDisplay), width: pct(Math.max(maxDisplay - recDisplay, 0)) }}
            aria-hidden
          />
        </div>

        {/* marcador do preço encontrado */}
        <div className="relative h-4">
          <div
            className="absolute top-0 -translate-x-1/2 transition-all"
            style={{ left: pct(foundPrice) }}
          >
            <div className={cn("mx-auto h-3 w-3 rotate-45 rounded-[2px] border-2 border-card", meta.dot)} />
          </div>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">{meta.hint}</p>
    </div>
  )
}

function PriceRow({
  label,
  value,
  accent,
  emphasis,
}: {
  label: string
  value: number
  accent?: string
  emphasis?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "tabular font-semibold",
          emphasis ? "text-base" : "text-sm",
          accent && accent.startsWith("text-") ? accent : "text-foreground",
        )}
      >
        {formatBRL(value)}
      </span>
    </div>
  )
}
