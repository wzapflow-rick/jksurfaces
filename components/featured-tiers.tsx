import Image from 'next/image'
import { AddToCartButton } from '@/components/add-to-cart-button'
import { formatMoney } from '@/lib/format'
import type { StorefrontProduct } from '@/lib/shopify'

// Vitrine: 3 faixas de preço (Essencial / Mais escolhido / Premium).
// Os produtos vêm do Shopify (getProducts ordena por preço), então o índice
// 0/1/2 mapeia naturalmente para essencial/intermediário/premium.
type TierMeta = { tag: string; badge?: string; highlight?: boolean }

const tierMeta: TierMeta[] = [
  { tag: 'Essencial' },
  { tag: 'Intermediário', badge: 'Mais escolhido', highlight: true },
  { tag: 'Premium' },
]

function installmentLabel(amount: string, currencyCode: string): string {
  const value = Number.parseFloat(amount)
  if (!Number.isFinite(value) || value <= 0) return ''
  const parts = value >= 800 ? 10 : value >= 300 ? 6 : 3
  return `ou ${parts}x de ${formatMoney(value / parts, currencyCode)} sem juros`
}

export function FeaturedTiers({ products }: { products: StorefrontProduct[] }) {
  const featured = products.slice(0, 3)

  return (
    <section id="destaques" className="bg-ink px-5 py-24 md:px-10 md:py-32" aria-labelledby="destaques-title">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-5">Destaques da loja</p>
            <h2 id="destaques-title" className="display text-4xl leading-[.98] text-paper md:text-6xl text-balance">
              Escolha o seu e receba em casa.
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-7 text-paper/55">
              Três opções para cada bolso, com entrega para todo o Brasil. Do essencial ao alto padrão.
            </p>
          </div>
          <a
            href="#catalogo"
            className="shrink-0 border-b border-champagne pb-2 text-[10px] uppercase tracking-[.24em] text-champagne transition-colors hover:text-paper"
          >
            Ver todas as categorias →
          </a>
        </div>

        {featured.length === 0 ? (
          <p className="border border-white/10 bg-surface/60 px-6 py-16 text-center text-sm text-paper/50">
            Estamos atualizando o catálogo. Volte em instantes para conferir os destaques.
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {featured.map((product, index) => {
              const meta = tierMeta[index] ?? tierMeta[tierMeta.length - 1]
              const price = product.priceRange.minVariantPrice
              return (
                <article
                  key={product.id}
                  className={`tier-card group relative flex flex-col overflow-hidden border transition-colors ${
                    meta.highlight ? 'border-champagne bg-surface' : 'border-white/10 bg-surface/60 hover:border-white/25'
                  }`}
                >
                  {meta.badge && (
                    <span className="absolute right-4 top-4 z-10 bg-champagne px-3 py-1 text-[10px] uppercase tracking-[.2em] text-ink">
                      {meta.badge}
                    </span>
                  )}

                  <div className="relative flex aspect-square w-full items-center justify-center bg-gradient-to-b from-white/[.06] to-transparent p-8">
                    <Image
                      src={product.featuredImage?.url || '/placeholder.svg'}
                      alt={product.featuredImage?.altText ?? product.title}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-contain p-8 transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                  <div className="flex flex-1 flex-col border-t border-white/10 p-7">
                    <p className="font-mono text-[11px] uppercase tracking-[.28em] text-champagne">{meta.tag}</p>
                    <h3 className="display mt-3 text-2xl leading-tight text-paper">{product.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-paper/55">{product.description}</p>

                    <div className="mt-6 flex flex-1 flex-col justify-end">
                      <p className="display text-3xl text-paper">{formatMoney(price.amount, price.currencyCode)}</p>
                      <p className="mt-1 text-[11px] tracking-wide text-paper/45">{installmentLabel(price.amount, price.currencyCode)}</p>

                      <AddToCartButton
                        variantId={product.variantId}
                        available={product.availableForSale}
                        highlight={meta.highlight}
                        label={product.title}
                      />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <p className="mt-8 text-center text-[11px] tracking-wide text-paper/35">
          Compra 100% segura — checkout processado pelo Shopify.
        </p>
      </div>
    </section>
  )
}
