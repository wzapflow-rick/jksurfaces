import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Pencil } from "lucide-react"
import { getProductWithMetrics } from "@/lib/services/radar-service"
import { repo } from "@/lib/services/repository"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Score } from "@/components/ui/score"
import { ActiveToggle } from "@/components/products/active-toggle"
import { formatBRL, formatPercent, PRIORITY_META } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function ProdutoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product, settings, buyers, buyerProducts, offers] = await Promise.all([
    getProductWithMetrics(id),
    repo.getSettings(),
    repo.listBuyers(),
    repo.listBuyerProductsByProduct(id),
    repo.listOffers(),
  ])
  if (!product) notFound()

  const m = product.metrics
  const productOffers = offers.filter((o) => o.productId === id)
  const buyerById = new Map(buyers.map((b) => [b.id, b]))
  const interestedBuyers = buyerProducts
    .map((bp) => ({ bp, buyer: buyerById.get(bp.buyerId) }))
    .filter((x) => x.buyer)

  // Repartição da regra sobre o preço de venda.
  const marginValue = (m.priceB2B * settings.marginPct) / 100
  const split = [
    { label: `Custo de aquisição (${settings.costPct}%)`, value: m.maxCost, tone: "bg-chart-1" },
    { label: `Margem / lucro (${settings.marginPct}%)`, value: marginValue, tone: "bg-chart-2" },
    { label: `Impostos / notas (${settings.taxPct}%)`, value: m.tax, tone: "bg-chart-3" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/produtos"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Produtos
      </Link>

      <PageHeader
        title={product.name}
        subtitle={`SKU ${product.sku}${product.ean ? ` · EAN ${product.ean}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <ActiveToggle id={product.id} active={product.active} />
            <Link href={`/produtos/${product.id}/editar`}>
              <Button variant="secondary" size="sm">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={m.status} />
        <Score value={m.score} />
        <span className="rounded-md border border-border-strong bg-surface-2 px-2.5 py-1 text-xs text-muted-foreground">
          Prioridade {PRIORITY_META[product.priority].label}
        </span>
        {product.manualStatus ? (
          <span className="rounded-md border border-status-watch/30 bg-status-watch/10 px-2.5 py-1 text-xs text-status-watch">
            Status definido manualmente
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MetricCard label="Preço de venda B2B" value={formatBRL(m.priceB2B)} />
        <MetricCard
          label="Custo máximo de compra"
          value={formatBRL(m.maxCost)}
          hint={`Teto da regra (${settings.costPct}% do preço)`}
          highlight
        />
        <MetricCard
          label="Custo de aquisição atual"
          value={formatBRL(m.currentCost)}
          hint={
            m.differenceToMaxCost >= 0
              ? `Folga de ${formatBRL(m.differenceToMaxCost)}`
              : `Acima do teto em ${formatBRL(Math.abs(m.differenceToMaxCost))}`
          }
          accent={m.differenceToMaxCost >= 0 ? "text-status-go" : "text-status-stop"}
        />
        <MetricCard label="Resultado após imposto" value={formatBRL(m.result)} />
        <MetricCard label="ROI estimado" value={formatPercent(m.roi)} />
        <MetricCard label="Imposto previsto" value={formatBRL(m.tax)} hint={`${settings.taxPct}% do preço`} />
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold tracking-tight">Composição do preço de venda</h2>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {split.map((s) => (
            <div
              key={s.label}
              className={s.tone}
              style={{ width: `${m.priceB2B > 0 ? (s.value / m.priceB2B) * 100 : 0}%` }}
              title={s.label}
            />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {split.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${s.tone}`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="tabular text-sm font-medium">{formatBRL(s.value)}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          Os {settings.marginPct}% de margem já contemplam frete, embalagem, movimentação, custo financeiro, descontos,
          devoluções, avarias e capital parado. Nesta fase esses custos não são somados novamente.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold tracking-tight">Demanda e observações</h2>
          <dl className="flex flex-col gap-3 text-sm">
            <Row label="Demanda mensal" value={product.monthlyDemand != null ? `${product.monthlyDemand} un.` : "—"} />
            <Row label="Compra mínima" value={product.minQty != null ? `${product.minQty} un.` : "—"} />
            <Row label="Compra máxima" value={product.maxQty != null ? `${product.maxQty} un.` : "—"} />
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">Observações</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{product.notes || "—"}</p>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Compradores interessados</h2>
            <span className="tabular rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {interestedBuyers.length}
            </span>
          </div>
          {interestedBuyers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum comprador vinculado a este produto.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {interestedBuyers.map(({ bp, buyer }) => (
                <li key={bp.id}>
                  <Link
                    href={`/compradores/${buyer!.id}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-border-strong"
                  >
                    <span className="min-w-0 truncate font-medium">{buyer!.name}</span>
                    <span className="tabular shrink-0 text-xs text-muted-foreground">
                      {bp.maxPrice != null ? `até ${formatBRL(bp.maxPrice)}` : "sem alvo"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Oportunidades registradas</h2>
          <span className="tabular rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {productOffers.length}
          </span>
        </div>
        {productOffers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma oferta registrada. Cadastre em{" "}
            <Link href="/oportunidades" className="text-primary hover:underline">
              Oportunidades
            </Link>
            .
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {productOffers.map((o) => {
              const total = o.price + o.shipping
              const withinCap = total <= m.maxCost
              return (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.source}</p>
                    <p className="tabular text-xs text-muted-foreground">
                      {formatBRL(o.price)} + frete {formatBRL(o.shipping)} = {formatBRL(total)}
                    </p>
                  </div>
                  <span
                    className={`tabular shrink-0 rounded-md px-2 py-1 text-xs ${
                      withinCap
                        ? "bg-status-go/10 text-status-go"
                        : "bg-status-stop/10 text-status-stop"
                    }`}
                  >
                    {withinCap ? "Dentro do teto" : "Acima do teto"}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
  accent,
  highlight,
}: {
  label: string
  value: string
  hint?: string
  accent?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-xl border p-4 ${
        highlight ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`tabular text-xl font-semibold tracking-tight ${accent ?? "text-foreground"}`}>{value}</span>
      {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="tabular text-sm font-medium">{value}</dd>
    </div>
  )
}
