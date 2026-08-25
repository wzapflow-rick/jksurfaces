import type { ComponentType, ReactNode } from "react"
import Link from "next/link"
import { ExternalLink, ImageOff, Layers, MapPin, Target, Tag } from "lucide-react"
import type { SourceOfferWithMetrics } from "@/types"
import {
  formatBRL,
  formatDate,
  OFFER_CONDITION_META,
  offerSourceLabel,
  offerSourceToRadarSource,
} from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RadarClassificationBadge } from "@/components/radar/radar-classification-badge"
import { RadarRecommendationBadge } from "@/components/radar/radar-recommendation-badge"
import { OfferMatchBadge } from "./offer-match-badge"
import { OfferDeleteButton } from "./offer-delete-button"

/**
 * Monta o link "Analisar no Radar" a partir de uma oferta capturada, levando
 * todos os dados possíveis via query params (a análise definitiva é sempre no
 * motor do Radar — este card só exibe a prévia). Usa o PREÇO UNITÁRIO como
 * preço anunciado no Radar (é o valor que o motor financeiro compara).
 */
export function buildRadarHref(offer: SourceOfferWithMetrics, missionId?: string): string {
  const unit = offer.unitPrice ?? offer.price
  const params = new URLSearchParams({
    name: offer.productTitle,
    source: offerSourceToRadarSource(offer.source),
    url: offer.url.startsWith("http") ? offer.url : "",
    announcedPrice: String(unit),
  })
  if (offer.shipping !== null) params.set("shipping", String(offer.shipping))
  if (offer.quantity > 1) params.set("availableQty", String(offer.quantity))
  if (offer.sku) params.set("sku", offer.sku)
  if (offer.brand) params.set("brand", offer.brand)
  if (offer.metrics) params.set("salePrice", String(offer.metrics.salePrice))
  if (offer.product) params.set("sku", offer.product.sku)
  if (missionId) params.set("missionId", missionId)
  return `/radar/novo?${params.toString()}`
}

export function OfferCard({
  offer,
  missionId,
  showDelete = false,
}: {
  offer: SourceOfferWithMetrics
  missionId?: string
  showDelete?: boolean
}) {
  const m = offer.metrics
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border-strong bg-surface-2">
          {offer.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={offer.imageUrl || "/placeholder.svg"}
              alt={offer.productTitle}
              className="h-full w-full object-contain"
              loading="lazy"
              crossOrigin="anonymous"
            />
          ) : (
            <ImageOff className="size-6 text-muted-foreground" aria-hidden />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium leading-snug text-foreground text-pretty">
              {offer.productTitle}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="rounded border border-border-strong bg-surface-2 px-1.5 py-0.5 font-medium text-foreground">
              {offerSourceLabel(offer.source)}
            </span>
            {offer.brand ? <span>{offer.brand}</span> : null}
            {offer.seller ? <span>Vendido por {offer.seller}</span> : null}
            {offer.sku ? <span className="font-mono">SKU {offer.sku}</span> : null}
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
              {formatBRL(offer.price)}
            </span>
            {offer.isLot ? (
              <span className="text-[11px] text-muted-foreground">
                · {formatBRL(offer.unitPrice ?? offer.price)}/un
              </span>
            ) : null}
            {offer.shipping !== null ? (
              <span className="text-[11px] text-muted-foreground">
                + {formatBRL(offer.shipping)} frete
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
            {offer.isLot ? (
              <Badge tone="border-primary/30 bg-primary/10 text-primary" icon={Layers}>
                Lote · {offer.quantity} un
              </Badge>
            ) : null}
            {offer.condition ? (
              <Badge tone={OFFER_CONDITION_META[offer.condition]?.tone ?? ""} icon={Tag}>
                {OFFER_CONDITION_META[offer.condition]?.label ?? offer.condition}
              </Badge>
            ) : null}
            {offer.priceNegotiable ? (
              <Badge tone="border-status-watch/30 bg-status-watch/10 text-status-watch">
                Negociável
              </Badge>
            ) : null}
            {offer.location ? (
              <Badge tone="border-border-strong bg-surface-2 text-muted-foreground" icon={MapPin}>
                {offer.location}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <OfferMatchBadge
          status={offer.matchStatus}
          method={offer.matchMethod}
          confidence={offer.matchConfidence}
        />
        {offer.product ? (
          <span className="text-[11px] text-muted-foreground">
            → {offer.product.name}
          </span>
        ) : null}
      </div>

      {m ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border-strong bg-surface-2 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <RadarRecommendationBadge recommendation={m.recommendation} size="sm" />
            <RadarClassificationBadge classification={m.classification} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <Metric label="Preço máx. JK" value={formatBRL(m.maxPurchasePrice)} />
            <Metric label="Preço ideal JK" value={formatBRL(m.recommendedPurchasePrice)} />
            <Metric
              label="Folga até o máx."
              value={formatBRL(m.differenceToMax)}
              accent={m.differenceToMax >= 0 ? "text-status-go" : "text-status-stop"}
            />
            <Metric
              label="Resultado estimado"
              value={formatBRL(m.estimatedResult)}
              accent={m.estimatedResult >= 0 ? "text-status-go" : "text-status-stop"}
            />
          </div>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Prévia com preço de venda de referência {formatBRL(m.salePrice)}. A análise final é feita no Radar.
          </p>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border-strong bg-surface-2/50 px-3 py-2 text-[11px] text-muted-foreground">
          Sem preço de venda JK de referência — associe a um produto para ver a análise financeira.
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-muted-foreground">Capturado {formatDate(offer.capturedAt)}</span>
        <div className="flex items-center gap-2">
          {showDelete ? <OfferDeleteButton id={offer.id} /> : null}
          {offer.url.startsWith("http") ? (
            <a href={offer.url} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm">
                Abrir
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          ) : null}
          <Link href={buildRadarHref(offer, missionId)}>
            <Button size="sm">
              <Target className="h-3.5 w-3.5" />
              Analisar no Radar
            </Button>
          </Link>
        </div>
      </div>
    </article>
  )
}

function Badge({
  children,
  tone,
  icon: Icon,
}: {
  children: ReactNode
  tone: string
  icon?: ComponentType<{ className?: string }>
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-medium ${tone}`}
    >
      {Icon ? <Icon className="size-3" /> : null}
      {children}
    </span>
  )
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-medium tabular-nums ${accent ?? "text-foreground"}`}>{value}</span>
    </div>
  )
}
