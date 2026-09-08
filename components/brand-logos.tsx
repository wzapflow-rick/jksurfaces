const logos = [
  { src: '/logos/jk.png', alt: 'JK Surfaces' },
  { src: '/logos/deca.png', alt: 'Deca' },
]

// Repete o conjunto para preencher a faixa; o grupo é duplicado para o loop ser contínuo.
const filled = Array.from({ length: 5 }).flatMap(() => logos)

export function BrandLogos() {
  return (
    <section aria-labelledby="marcas-title" className="border-y border-white/10 bg-ink px-5 py-16 md:px-10 md:py-20">
      <p id="marcas-title" className="eyebrow mb-10 text-center">Marcas que você encontra na JK</p>
      <div className="brand-logos-mask overflow-hidden">
        <div className="brand-logos-track flex w-max items-center">
          {[0, 1].map((group) => (
            <ul key={group} className="flex shrink-0 items-center" aria-hidden={group === 1 ? true : undefined}>
              {filled.map((logo, i) => (
                <li key={`${group}-${i}`} className="flex w-[180px] items-center justify-center md:w-[240px]">
                  {/* Logos monocromáticas para tratamento uniforme na faixa. */}
                  <img
                    src={logo.src || '/placeholder.svg'}
                    alt={group === 1 ? '' : logo.alt}
                    className="h-9 w-auto select-none object-contain opacity-55 transition-opacity duration-300 hover:opacity-100 md:h-11"
                    draggable={false}
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  )
}
