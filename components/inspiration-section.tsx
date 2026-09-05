import Image from 'next/image'

const ambientes = [
  { name: 'Banheiros', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Cozinhas', image: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Áreas externas', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85' },
  { name: 'Projetos contemporâneos', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85' },
]

export function InspirationSection() {
  return (
    <section id="inspiracao" className="texture px-5 py-24 md:px-10 md:py-36" aria-labelledby="inspiracao-title">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-5">Inspiração</p>
            <h2 id="inspiracao-title" className="display text-5xl text-paper md:text-7xl">Onde o detalhe vive.</h2>
          </div>
          <p className="max-w-xs text-sm leading-7 text-paper/50 md:pb-2">Ambientes que mostram como um bom acabamento muda a experiência de um espaço.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {ambientes.map((ambiente) => (
            <a key={ambiente.name} href="#curadoria" className="inspiration-tile group relative block overflow-hidden bg-surface">
              <div className="relative aspect-[3/4] w-full">
                <Image src={ambiente.image} alt={`Inspiração de ${ambiente.name}`} fill sizes="(min-width: 768px) 25vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
              </div>
              <h3 className="display absolute bottom-5 left-5 text-2xl text-paper md:text-3xl">{ambiente.name}</h3>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
