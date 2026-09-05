import Image from 'next/image'

export function HeroCinematic() {
  return (
    <section id="top" className="hero-scene relative flex min-h-screen items-end overflow-hidden" aria-labelledby="hero-title">
      <Image
        src="/images/hero-space.png"
        alt="Banheiro contemporâneo com metais champagne sobre cuba de pedra natural"
        fill
        priority
        sizes="100vw"
        className="hero-scene-image object-cover"
      />
      <div className="hero-scene-veil absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 w-full px-5 pb-16 md:px-10 md:pb-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-6 reveal-up">Metais · acabamentos · soluções</p>
            <h1 id="hero-title" className="display text-6xl leading-[.9] text-paper md:text-8xl lg:text-9xl reveal-up">
              Detalhes que
              <br />
              <span className="text-champagne">definem</span> espaços.
            </h1>
            <p className="mt-8 max-w-md text-sm leading-7 text-paper/70 md:text-base reveal-up">
              Uma curadoria precisa para transformar matéria em presença. A JK SURFACES aproxima o design daquilo que você toca todos os dias.
            </p>
            <a
              href="#catalogo"
              className="mt-9 inline-flex items-center gap-3 border-b border-champagne pb-2 text-[11px] uppercase tracking-[.24em] text-champagne transition-colors hover:text-paper reveal-up"
            >
              Explorar produtos <span aria-hidden="true">→</span>
            </a>
          </div>

          <div className="flex items-center gap-4 text-[9px] uppercase tracking-[.24em] text-paper/45">
            <span className="hero-scroll-line" aria-hidden="true" />
            Role para descobrir
          </div>
        </div>
      </div>
    </section>
  )
}
