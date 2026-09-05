export function ProjectShowcase() {
  return (
    <section id="projetos" className="bg-surface px-5 py-28 md:px-10 md:py-40" aria-labelledby="projetos-title">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-5">Projetos</p>
            <h2 id="projetos-title" className="display max-w-2xl text-6xl leading-[.88] text-paper md:text-8xl">A matéria em contexto.</h2>
          </div>
          <p className="max-w-xs text-sm leading-7 text-paper/50 md:pb-2">Em breve, uma seleção de projetos reais e suas escolhas de acabamento.</p>
        </div>
        <div className="border-y border-white/10 py-16 text-center">
          <p className="text-sm leading-7 text-paper/50">Os projetos da JK SURFACES serão apresentados aqui assim que houver conteúdo oficial para compartilhar.</p>
        </div>
      </div>
    </section>
  )
}
