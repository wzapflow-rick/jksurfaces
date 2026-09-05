const steps = [
  { number: '01', title: 'Entender', text: 'Lemos o projeto antes de escolher o produto. Contexto, escala e uso guiam cada decisão.' },
  { number: '02', title: 'Especificar', text: 'Traduzimos intenção em acabamentos, medidas e soluções que funcionam no detalhe.' },
  { number: '03', title: 'Entregar', text: 'Acompanhamos a escolha até a instalação para que o resultado mantenha a promessa.' },
]

export function ProcessSection() {
  return (
    <section id="processo" className="process-section texture px-5 py-28 md:px-10 md:py-40" aria-labelledby="processo-title">
      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[.7fr_1.3fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow mb-6">04 / Como trabalhamos</p>
          <h2 id="processo-title" className="display max-w-md text-6xl leading-[.88] text-paper md:text-8xl">Do primeiro traço ao último detalhe.</h2>
          <p className="mt-8 max-w-sm text-sm leading-7 text-paper/55">Uma curadoria próxima, técnica e sensível para transformar referências em espaços que fazem sentido.</p>
        </div>
        <div className="divide-y divide-white/10 border-y border-white/10">
          {steps.map((step) => (
            <article key={step.number} className="process-step grid gap-5 py-10 md:grid-cols-[5rem_1fr] md:gap-8 md:py-14">
              <span className="font-mono text-xs tracking-[.2em] text-champagne">{step.number}</span>
              <div><h3 className="display text-4xl text-paper md:text-6xl">{step.title}</h3><p className="mt-4 max-w-md text-sm leading-7 text-paper/50">{step.text}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
