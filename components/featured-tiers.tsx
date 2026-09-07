import Image from 'next/image'

// Vitrine de pré-lançamento: 3 faixas de preço (Essencial / Mais escolhido / Premium).
// Dados de placeholder usando as torneiras já recortadas — serão substituídos pelos
// produtos reais do Shopify (nome, preço, imagem e checkout) na próxima etapa.
type Tier = {
  id: string
  badge?: string
  tag: string
  name: string
  benefit: string
  price: string
  installment: string
  image: string
  alt: string
  highlight?: boolean
}

const tiers: Tier[] = [
  {
    id: 'essencial',
    tag: 'Essencial',
    name: 'Torneira Automática 1173',
    benefit: 'Fechamento automático, economia de água e instalação simples.',
    price: 'R$ 149',
    installment: 'ou 3x de R$ 49,67 sem juros',
    image: '/products/faucet-auto.png',
    alt: 'Torneira de mesa automática para lavatório, acabamento cromado',
  },
  {
    id: 'intermediario',
    badge: 'Mais escolhido',
    tag: 'Intermediário',
    name: 'Misturador Monocomando Spin',
    benefit: 'Controle único de temperatura e vazão, ideal para cozinhas.',
    price: 'R$ 429',
    installment: 'ou 6x de R$ 71,50 sem juros',
    image: '/products/faucet-spin.png',
    alt: 'Misturador monocomando de mesa para cozinha, acabamento cromado',
    highlight: true,
  },
  {
    id: 'premium',
    tag: 'Premium',
    name: 'Misturador Bica Alta Polo',
    benefit: 'Design quadrado assinado e acabamento de alto padrão.',
    price: 'R$ 1.190',
    installment: 'ou 10x de R$ 119 sem juros',
    image: '/products/faucet-polo.png',
    alt: 'Misturador de mesa bica alta com design quadrado, acabamento cromado',
  },
]

export function FeaturedTiers() {
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

        <div className="grid gap-5 md:grid-cols-3">
          {tiers.map((tier) => (
            <article
              key={tier.id}
              className={`tier-card group relative flex flex-col overflow-hidden border transition-colors ${
                tier.highlight ? 'border-champagne bg-surface' : 'border-white/10 bg-surface/60 hover:border-white/25'
              }`}
            >
              {tier.badge && (
                <span className="absolute right-4 top-4 z-10 bg-champagne px-3 py-1 text-[10px] uppercase tracking-[.2em] text-ink">
                  {tier.badge}
                </span>
              )}

              <div className="relative flex aspect-square w-full items-center justify-center bg-gradient-to-b from-white/[.06] to-transparent p-8">
                <Image
                  src={tier.image || '/placeholder.svg'}
                  alt={tier.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-contain p-8 transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              <div className="flex flex-1 flex-col border-t border-white/10 p-7">
                <p className="font-mono text-[11px] uppercase tracking-[.28em] text-champagne">{tier.tag}</p>
                <h3 className="display mt-3 text-2xl leading-tight text-paper">{tier.name}</h3>
                <p className="mt-3 text-sm leading-6 text-paper/55">{tier.benefit}</p>

                <div className="mt-6 flex flex-1 flex-col justify-end">
                  <p className="display text-3xl text-paper">{tier.price}</p>
                  <p className="mt-1 text-[11px] tracking-wide text-paper/45">{tier.installment}</p>

                  {/* CTA pronto para conectar ao checkout do Shopify na próxima etapa. */}
                  <button
                    type="button"
                    className={`mt-6 inline-flex items-center justify-center gap-3 px-6 py-3 text-[11px] uppercase tracking-[.24em] transition-colors ${
                      tier.highlight
                        ? 'bg-champagne text-ink hover:bg-paper'
                        : 'border border-white/25 text-paper hover:border-champagne hover:text-champagne'
                    }`}
                    aria-label={`Comprar ${tier.name}`}
                  >
                    Comprar agora <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-[11px] tracking-wide text-paper/35">
          Vitrine de pré-lançamento — produtos e valores ilustrativos. Catálogo oficial em breve.
        </p>
      </div>
    </section>
  )
}
