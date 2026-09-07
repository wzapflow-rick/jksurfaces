import Image from 'next/image'

const categories = [
  { name: 'Torneiras', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Misturadores', image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Duchas & Chuveiros', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Acabamentos', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Metais', image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Acessórios', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85' },
]

export function CatalogCategories() {
  return (
    <section id="catalogo" className="px-5 py-24 md:px-10 md:py-36" aria-labelledby="catalogo-title">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-5">Produtos</p>
            <h2 id="catalogo-title" className="display text-4xl leading-[.98] text-paper md:text-6xl text-balance">
              Tudo para o detalhe que faz diferença.
            </h2>
            <p className="mt-6 max-w-lg text-sm leading-7 text-paper/55">
              Encontre metais, louças, acabamentos e acessórios para diferentes estilos e necessidades.
            </p>
          </div>
          <a href="#selecao" className="shrink-0 border-b border-champagne pb-2 text-[10px] uppercase tracking-[.24em] text-champagne transition-colors hover:text-paper">
            Explorar categorias →
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {categories.map((category) => (
            <a key={category.name} href="#selecao" className="category-tile group relative block overflow-hidden bg-surface">
              <div className="relative aspect-[3/4] w-full">
                <Image
                  src={category.image}
                  alt={`Categoria ${category.name}`}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="category-img object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" />
              </div>
              <div className="absolute inset-x-6 bottom-6 flex items-end justify-between">
                <h3 className="display text-3xl leading-none text-paper md:text-4xl">{category.name}</h3>
                <span aria-hidden="true" className="text-champagne opacity-0 transition-opacity duration-500 group-hover:opacity-100">→</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
