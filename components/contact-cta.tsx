export function ContactCta() {
  return (
    <section id="contato" className="relative overflow-hidden bg-ink px-5 py-28 md:px-10 md:py-40" aria-labelledby="contato-title">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <p className="eyebrow mb-6">Pronto para comprar</p>
        <h2 id="contato-title" className="display text-5xl leading-[.95] text-paper md:text-8xl text-balance">
          Escolha agora e receba em casa.
        </h2>
        <p className="mt-8 max-w-md text-sm leading-7 text-paper/60 md:text-base">
          Entrega para todo o Brasil e pagamento seguro. Comece pelos produtos em destaque.
        </p>
        <a
          href="#destaques"
          className="mt-10 inline-flex items-center gap-3 bg-champagne px-8 py-4 text-[11px] uppercase tracking-[.24em] text-ink transition-colors hover:bg-paper"
        >
          Comprar agora <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  )
}
