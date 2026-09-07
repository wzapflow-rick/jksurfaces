import Image from 'next/image'

export function CuratedSection() {
  return (
    <section id="selecao-editorial" className="bg-surface px-5 py-24 md:px-10 md:py-36" aria-labelledby="curadoria-title">
      <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2 md:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden bg-ink md:order-2">
          <Image src="/images/curated.png" alt="Ambiente contemporâneo com pedra, madeira e metais em equilíbrio" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          <div className="pointer-events-none absolute inset-4 border border-white/20" aria-hidden="true" />
        </div>
        <div id="sobre" className="md:order-1">
          <p className="eyebrow mb-5">Editorial</p>
          <h2 id="curadoria-title" className="display text-5xl leading-[.95] text-paper md:text-7xl">Escolhas<br />que inspiram.</h2>
          <p className="mt-8 max-w-md text-sm leading-7 text-paper/60 md:text-base">
            Selecionamos marcas e produtos que unem qualidade, design e durabilidade. Cada escolha pensada para fazer sentido no dia a dia.
          </p>
          <a href="#inspiracao" className="mt-9 inline-flex items-center gap-3 border-b border-champagne pb-2 text-[10px] uppercase tracking-[.24em] text-champagne transition-colors hover:text-paper">
            Ver inspirações <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
