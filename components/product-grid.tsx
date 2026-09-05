'use client'

import Image from 'next/image'
import { useFavorites } from '@/components/favorites-context'

const products = [
  { brand: 'JK Collection', name: 'Misturador monocomando de bancada', sku: 'JK-MB-001', finish: 'Níquel escovado', category: 'Misturadores', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=85' },
  { brand: 'JK Collection', name: 'Chuveiro de teto slim', sku: 'JK-DC-014', finish: 'Grafite acetinado', category: 'Duchas & Chuveiros', image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=85' },
  { brand: 'JK Collection', name: 'Cuba de apoio em pedra natural', sku: 'JK-AC-028', finish: 'Travertino', category: 'Acabamentos', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85' },
  { brand: 'JK Collection', name: 'Torneira de parede escultural', sku: 'JK-TW-006', finish: 'Champagne', category: 'Torneiras', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85' },
]

export function ProductGrid() {
  const { has, toggle } = useFavorites()

  return (
    <div className="grid gap-x-8 gap-y-14 md:grid-cols-2">
      {products.map((product) => {
        const saved = has(product.sku)
        return (
          <article key={product.sku} className="product-item group">
            <div className="relative aspect-[1.05] overflow-hidden bg-ink">
              <Image src={product.image} alt={product.name} fill sizes="(min-width: 768px) 50vw, 100vw" className="product-img object-cover transition duration-700 group-hover:scale-105" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-ink/25" aria-hidden="true" />
              <span className="pointer-events-none absolute left-5 top-5 text-[9px] uppercase tracking-[.24em] text-paper/80">{product.category}</span>
              <button
                type="button"
                onClick={() => toggle(product.sku)}
                aria-pressed={saved}
                aria-label={saved ? `Remover ${product.name} dos favoritos` : `Salvar ${product.name} nos favoritos`}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-ink/50 text-paper backdrop-blur transition-colors hover:text-champagne"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5.5 5.5 5.5c2 0 3.2 1.2 3.7 2.2h.6C10.3 6.7 11.5 5.5 13.5 5.5c3 0 4.5 3 3 6C19 15.65 12 20 12 20Z" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="flex items-start justify-between gap-6 border-b border-white/15 py-5">
              <div>
                <p className="eyebrow mb-3 text-[9px]">{product.brand}</p>
                <h3 className="display max-w-sm text-3xl leading-none text-paper md:text-4xl">{product.name}</h3>
                <p className="mt-4 text-[10px] uppercase tracking-[.18em] text-paper/40">{product.finish} · SKU {product.sku}</p>
              </div>
              <a href="#catalogo" className="shrink-0 pt-1 text-[9px] uppercase tracking-[.2em] text-champagne transition-colors hover:text-paper" aria-label={`Ver produto ${product.name}`}>Ver produto →</a>
            </div>
          </article>
        )
      })}
    </div>
  )
}
