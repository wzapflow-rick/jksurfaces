import MagnifyingCursor from '@/components/magnifying-cursor'

const products = [
  { brand: 'JK COLLECTION', name: 'Misturador monocomando de bancada', sku: 'JK-MB-001', finish: 'Níquel escovado', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=85' },
  { brand: 'JK COLLECTION', name: 'Chuveiro de teto slim', sku: 'JK-DC-014', finish: 'Grafite acetinado', image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=85' },
  { brand: 'JK COLLECTION', name: 'Cuba de apoio em pedra natural', sku: 'JK-AC-028', finish: 'Travertino', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85' },
  { brand: 'JK COLLECTION', name: 'Torneira de parede escultural', sku: 'JK-TW-006', finish: 'Champagne', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85' },
]

export function FeaturedProducts() {
  return (
    <div className="grid gap-10 md:grid-cols-2">
      {products.map((product, index) => (
        <article key={product.sku} className={`product-card group ${index % 2 === 1 ? 'md:mt-24' : ''}`}>
          <div className="product-zoom relative aspect-[1.05] overflow-hidden bg-ink" aria-label={`Passe o mouse para ampliar ${product.name}`}>
            <MagnifyingCursor image={{ src: product.image, alt: product.name }} fit="cover" zoom={2.2} lensSize={92} rim rimOptions={{ color: '#c7b79b', width: 1 }} />
            <span className="pointer-events-none absolute left-5 top-5 text-[9px] uppercase tracking-[.24em] text-paper/65">Seleção JK</span>
            <span className="pointer-events-none absolute bottom-5 right-5 text-[9px] uppercase tracking-[.18em] text-paper/55 opacity-0 transition-opacity duration-500 group-hover:opacity-100">Ampliar detalhe</span>
          </div>
          <div className="flex items-start justify-between gap-6 border-b border-white/15 py-5">
            <div>
              <p className="eyebrow mb-3 text-[9px]">{product.brand}</p>
              <h3 className="display max-w-sm text-3xl leading-none text-paper md:text-4xl">{product.name}</h3>
              <p className="mt-4 text-[10px] uppercase tracking-[.18em] text-paper/40">{product.finish} · SKU {product.sku}</p>
            </div>
            <a href="/produtos" className="shrink-0 pt-1 text-[9px] uppercase tracking-[.2em] text-champagne transition-colors hover:text-paper" aria-label={`Ver produto ${product.name}`}>Ver produto →</a>
          </div>
        </article>
      ))}
    </div>
  )
}
