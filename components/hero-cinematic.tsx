'use client'

import { useEffect, useRef, useState } from 'react'

const stages = [
  { eyebrow: '01 / DESIGN', title: 'A forma inicia\no detalhe.', copy: 'Linhas precisas para espaços que permanecem.' },
  { eyebrow: '02 / TECNOLOGIA', title: 'Precisão em\ncada componente.', copy: 'Engenharia silenciosa por trás do gesto.' },
  { eyebrow: '03 / QUALIDADE', title: 'Matéria feita\npara durar.', copy: 'Acabamentos escolhidos para todos os dias.' },
  { eyebrow: '04 / RESULTADO', title: 'Mais que metais.\nAmbientes melhores.', copy: 'A experiência JK SURFACES completa.' },
]

function ProductAssembly({ progress }: { progress: number }) {
  const assembled = Math.min(1, progress * 1.18)
  const piece = (start: number, spread: number, rotate: number) => {
    const amount = 1 - Math.min(1, Math.max(0, (assembled - start) / (1 - start)))
    return { transform: `translate3d(${Math.sin(start * 20) * 18 * amount}px, ${spread * amount}px, 0) rotate(${rotate * amount}deg)` }
  }

  return (
    <div className="hero-build-object relative h-[min(74vh,720px)] w-[min(58vw,620px)]" aria-label="Torneira JK SURFACES em montagem técnica">
      <div className="hero-part hero-part-handle" style={piece(.08, -230, -8)}><span /></div>
      <div className="hero-part hero-part-screw" style={piece(.17, -174, 4)} />
      <div className="hero-part hero-part-ring hero-part-ring-one" style={piece(.25, -126, -3)} />
      <div className="hero-part hero-part-cartridge" style={piece(.33, -80, 2)}><span /></div>
      <div className="hero-part hero-part-ring hero-part-ring-two" style={piece(.42, -35, -2)} />
      <div className="hero-part hero-part-body" style={piece(.52, 82, 2)}><span /></div>
      <div className="hero-part hero-part-collar" style={piece(.62, 142, -3)} />
      <div className="hero-part hero-part-thread" style={piece(.71, 188, 1)} />
      <div className="hero-part hero-part-washer" style={piece(.79, 232, -2)} />
      <div className="hero-part hero-part-hoses" style={piece(.87, 282, 2)}><span /><i /></div>
      <div className="absolute inset-x-1/4 bottom-3 h-5 rounded-[50%] bg-champagne/10 blur-xl" />
    </div>
  )
}

export function HeroCinematic() {
  const sectionRef = useRef<HTMLElement>(null)
  const frameRef = useRef<number | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      if (frameRef.current !== null) return
      frameRef.current = window.requestAnimationFrame(() => {
        const section = sectionRef.current
        if (section) {
          const rect = section.getBoundingClientRect()
          const range = Math.max(section.offsetHeight - window.innerHeight, 1)
          setProgress(Math.min(1, Math.max(0, -rect.top / range)))
        }
        frameRef.current = null
      })
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
    }
  }, [])

  const stageIndex = Math.min(stages.length - 1, Math.floor(progress * stages.length))
  const stage = stages[stageIndex]

  return (
    <section ref={sectionRef} className="hero-build relative min-h-[360vh] bg-ink" aria-labelledby="hero-title">
      <div className="sticky top-0 flex min-h-screen flex-col overflow-hidden px-5 py-5 md:px-10 md:py-7">
        <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(242,241,236,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(242,241,236,.04)_1px,transparent_1px)] [background-size:72px_72px]" />
        <header className="relative z-20 flex items-start justify-between" aria-label="Navegação principal">
          <a href="#top" aria-label="JK Surfaces — início" className="text-paper"><span className="display block text-4xl leading-none">JK</span><span className="mt-1 block text-[8px] tracking-[.48em] text-paper/60">SURFACES</span></a>
          <nav className="hidden items-center gap-7 pt-2 text-[9px] uppercase tracking-[.25em] text-paper/55 md:flex"><a href="/produtos" className="transition-colors hover:text-champagne">Produtos</a><a href="#curadoria" className="transition-colors hover:text-champagne">Curadoria</a><a href="#projetos" className="transition-colors hover:text-champagne">Sobre</a><a href="#contato" className="transition-colors hover:text-champagne">Contato</a></nav>
          <span className="font-mono text-[9px] tracking-[.2em] text-paper/35 md:hidden">JK / 001</span>
        </header>

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 items-center justify-center">
          <aside className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-8 md:flex" aria-label="Etapas da montagem">{stages.map((item, index) => <div key={item.eyebrow} className={`flex items-center gap-3 transition-opacity duration-500 ${index === stageIndex ? 'opacity-100' : 'opacity-25'}`}><span className="font-mono text-[10px] text-champagne">0{index + 1}</span><span className="h-px w-5 bg-champagne/60" /></div>)}</aside>
          <div className="hero-build-copy absolute left-0 top-1/2 z-10 max-w-[15rem] -translate-y-1/2 md:left-20 md:max-w-[17rem]"><p className="eyebrow mb-5 text-champagne">{stage.eyebrow}</p><h1 id="hero-title" className="display whitespace-pre-line text-5xl leading-[.9] text-paper md:text-7xl">{stage.title}</h1><p className="mt-7 text-sm leading-6 text-paper/55">{stage.copy}</p><div className="mt-10 h-px w-16 bg-champagne/70" /></div>
          <ProductAssembly progress={progress} />
          <div className="absolute bottom-3 right-0 hidden max-w-[15rem] text-right md:block"><p className="eyebrow mb-4 text-paper/40">Scroll para montar</p><p className="text-sm leading-6 text-paper/50">Cada componente encontra seu lugar.</p></div>
        </div>

        <div className="relative z-20 flex items-end justify-between border-t border-white/10 pt-4 font-mono text-[9px] uppercase tracking-[.2em] text-paper/35"><span>Metais · acabamentos · soluções</span><span>{String(Math.round(progress * 100)).padStart(3, '0')}%</span><span className="hidden md:inline">Rio · Brasil</span></div>
        <div className="absolute bottom-0 left-0 h-px bg-champagne transition-[width] duration-100" style={{ width: `${progress * 100}%` }} aria-hidden="true" />
      </div>
    </section>
  )
}
