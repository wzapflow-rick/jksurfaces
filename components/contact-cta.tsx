export function ContactCta() {
  return (
    <section id="contato" className="relative overflow-hidden bg-ink px-5 py-28 md:px-10 md:py-40" aria-labelledby="contato-title">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <p className="eyebrow mb-6">Atendimento</p>
        <h2 id="contato-title" className="display text-5xl leading-[.95] text-paper md:text-8xl text-balance">
          Seu projeto começa nas escolhas.
        </h2>
        <p className="mt-8 max-w-md text-sm leading-7 text-paper/60 md:text-base">
          Encontre produtos que unem qualidade, funcionalidade e design.
        </p>
        {/* Preparado para receber o link do WhatsApp da JK futuramente. */}
        <button
          type="button"
          className="mt-10 inline-flex items-center gap-3 border border-champagne px-8 py-4 text-[11px] uppercase tracking-[.24em] text-champagne transition-colors hover:bg-champagne hover:text-ink"
        >
          Falar com a JK <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  )
}
