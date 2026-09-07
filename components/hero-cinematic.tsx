import { HeroProductCarousel, type CarouselItem } from '@/components/hero-product-carousel'
import { RollingTitle } from '@/components/rolling-title'

const products: CarouselItem[] = [
  { src: '/products/faucet-1785.png', alt: 'Torneira de mesa touchless bica baixa para lavatório — linha 1785' },
  { src: '/products/faucet-disco.png', alt: 'Misturador de mesa bica alta com manoplas cruzeta — linha Disco' },
  { src: '/products/faucet-decamatic.png', alt: 'Misturador monocomando para lavatório — linha Decamatic Eco' },
  { src: '/products/faucet-polo.png', alt: 'Misturador de mesa bica alta quadrada — linha Polo' },
  { src: '/products/faucet-auto.png', alt: 'Torneira de mesa automática para lavatório — linha 1173' },
  { src: '/products/faucet-spin.png', alt: 'Misturador monocomando de mesa para cozinha — linha Spin' },
]

export function HeroCinematic() {
  return (
    <section id="top" className="hero3d relative flex min-h-screen flex-col overflow-hidden" aria-labelledby="hero-title">
      <div className="hero3d-grid absolute inset-0" aria-hidden="true" />
      <div className="hero3d-glow absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 pt-28 md:px-10 md:pt-32">
        <header className="mx-auto max-w-4xl text-center">
          <p className="eyebrow mb-6 reveal-up">Metais · acabamentos · soluções</p>
          <RollingTitle
            id="hero-title"
            className="display text-6xl leading-[.88] text-paper md:text-8xl lg:text-[8rem]"
            segments={[
              { text: 'Detalhes que ' },
              { text: 'definem', className: 'italic text-champagne' },
              { text: ' espaços.' },
            ]}
          />
        </header>

        <div className="hero3d-stage relative mt-4 flex flex-1 items-center justify-center md:mt-2">
          <div className="hero3d-floor" aria-hidden="true" />
          <HeroProductCarousel items={products} />
        </div>

        <footer className="relative z-10 mx-auto mb-12 flex max-w-xl flex-col items-center gap-6 text-center md:mb-16">
          <p className="max-w-md text-sm leading-7 text-paper/70">
            Uma curadoria precisa de metais e acabamentos para transformar matéria em presença. Arraste para explorar a coleção.
          </p>
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <a
              href="#selecao"
              className="inline-flex items-center gap-3 bg-champagne px-8 py-3 text-[11px] uppercase tracking-[.24em] text-ink transition-colors hover:bg-paper"
            >
              Explorar produtos <span aria-hidden="true">→</span>
            </a>
            <a
              href="#catalogo"
              className="inline-flex items-center gap-3 border-b border-white/25 pb-1 text-[11px] uppercase tracking-[.24em] text-paper/70 transition-colors hover:border-champagne hover:text-champagne"
            >
              Ver categorias
            </a>
          </div>
        </footer>
      </div>
    </section>
  )
}
