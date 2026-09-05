'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

type HeroCinematicProps = {
  image: string
}

type Part = {
  name: string
  label: string
  detail: string
  from: number
  to: number
  rotation: number
}

const parts: Part[] = [
  { name: 'Alavanca', label: 'DESIGN', detail: 'Forma que valoriza o espaço.', from: -210, to: -18, rotation: -4 },
  { name: 'Cartucho', label: 'TECNOLOGIA', detail: 'Precisão em cada componente.', from: -130, to: -8, rotation: 3 },
  { name: 'Anéis e vedações', label: 'PRECISÃO', detail: 'Cada encaixe tem uma função.', from: -72, to: -3, rotation: -2 },
  { name: 'Corpo e bica', label: 'QUALIDADE', detail: 'Materiais escolhidos para durar.', from: 92, to: 4, rotation: 2 },
  { name: 'Fixação', label: 'RESULTADO', detail: 'Mais que metais. Ambientes melhores.', from: 180, to: 12, rotation: -3 },
]

const partTransforms = [
  { x: -34, scale: 1.03 },
  { x: 26, scale: 0.98 },
  { x: -18, scale: 1.02 },
  { x: 20, scale: 1 },
  { x: -12, scale: 1.04 },
]

const sliceClips = [
  'inset(0 0 78% 0)',
  'inset(17% 0 55% 0)',
  'inset(35% 0 38% 0)',
  'inset(48% 0 18% 0)',
  'inset(70% 0 0 0)',
]

const stages = [
  { eyebrow: '01 / DESMONTADO', title: 'O detalhe inicia\na forma.', copy: 'Cada escolha importa.' },
  { eyebrow: '02 / TECNOLOGIA', title: 'Precisão em\ncada componente.', copy: 'O produto revela sua engenharia.' },
  { eyebrow: '03 / MONTAGEM', title: 'Tudo encontra\no seu lugar.', copy: 'A forma nasce do encaixe.' },
  { eyebrow: '04 / COMPLETO', title: 'Detalhes que\ndefinem espaços.', copy: 'Um grande resultado começa pequeno.' },
]

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

export function HeroCinematic({ image }: HeroCinematicProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const frameRef = useRef<number | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      if (frameRef.current !== null) return
      frameRef.current = window.requestAnimationFrame(() => {
        const section = sectionRef.current
        if (section) {
          const start = section.offsetTop
          const range = Math.max(section.offsetHeight - window.innerHeight, 1)
          setProgress(clamp((window.scrollY - start) / range))
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
        <header className="relative z-20 flex items-start justify-between" aria-label="Navegação principal">
          <a href="#top" aria-label="JK Surfaces — início" className="text-paper">
            <span className="display block text-4xl leading-none">JK</span>
            <span className="mt-1 block text-[8px] tracking-[.48em] text-paper/60">SURFACES</span>
          </a>
          <nav className="hidden items-center gap-7 pt-2 text-[9px] uppercase tracking-[.25em] text-paper/55 md:flex">
            <a href="/produtos" className="transition-colors hover:text-champagne">Produtos</a>
            <a href="#curadoria" className="transition-colors hover:text-champagne">Curadoria</a>
            <a href="#projetos" className="transition-colors hover:text-champagne">Sobre</a>
            <a href="#contato" className="transition-colors hover:text-champagne">Contato</a>
          </nav>
          <span className="font-mono text-[9px] tracking-[.2em] text-paper/35 md:hidden">JK / 001</span>
        </header>

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 items-center justify-center">
          <aside className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-8 md:flex" aria-label="Etapas da montagem">
            {stages.map((item, index) => (
              <div key={item.eyebrow} className={`flex items-center gap-3 transition-opacity duration-500 ${index === stageIndex ? 'opacity-100' : 'opacity-25'}`}>
                <span className="font-mono text-[10px] text-champagne">0{index + 1}</span>
                <span className="h-px w-5 bg-champagne/60" />
              </div>
            ))}
          </aside>

          <div className="hero-build-copy absolute left-0 top-1/2 z-10 max-w-[15rem] -translate-y-1/2 md:left-20 md:max-w-[17rem]">
            <p className="eyebrow mb-5 text-champagne">{stage.eyebrow}</p>
            <h1 id="hero-title" className="display whitespace-pre-line text-5xl leading-[.9] text-paper md:text-7xl">{stage.title}</h1>
            <p className="mt-7 text-sm leading-6 text-paper/55">{stage.copy}</p>
            <div className="mt-10 h-px w-16 bg-champagne/70" />
          </div>

          <div className="hero-build-object relative z-[1] aspect-[2/3] w-[min(47vw,25rem)] md:w-[min(31vw,31rem)]" aria-label="Demonstração visual de montagem de uma torneira premium">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(199,183,155,.16),transparent_58%)]" />
            {parts.map((part, index) => {
              const localProgress = clamp((progress - index * 0.08) / 0.72)
              const y = part.from + (part.to - part.from) * localProgress
              const x = partTransforms[index].x * (1 - localProgress)
              const scale = partTransforms[index].scale + Math.sin(localProgress * Math.PI) * 0.025
              return (
                <div key={part.name} className="hero-build-piece absolute inset-0" style={{ clipPath: sliceClips[index], transform: `translate3d(${x}px, ${y}px, 0) rotate(${part.rotation * (1 - localProgress)}deg) scale(${scale})`, opacity: 0.55 + localProgress * 0.45 }}>
                  <Image src={image} alt="" fill priority={index === 0} className="object-contain object-center" sizes="(min-width: 768px) 31vw, 47vw" />
                  <span className="sr-only">{part.name}</span>
                </div>
              )
            })}
            <div className="hero-build-glow absolute inset-x-1/4 bottom-[7%] h-8 rounded-full bg-champagne/20 blur-2xl" />
          </div>

          <div className="absolute bottom-3 right-0 hidden max-w-[15rem] text-right md:block">
            <p className="eyebrow mb-4 text-paper/40">Scroll para montar</p>
            <p className="text-sm leading-6 text-paper/50">O produto permanece. O estado muda.</p>
          </div>
        </div>

        <div className="relative z-20 flex items-end justify-between border-t border-white/10 pt-4 font-mono text-[9px] uppercase tracking-[.2em] text-paper/35">
          <span>Metais · acabamentos · soluções</span>
          <span>{String(Math.round(progress * 100)).padStart(3, '0')}%</span>
          <span className="hidden md:inline">Rio · Brasil</span>
        </div>
        <div className="absolute bottom-0 left-0 h-px bg-champagne transition-[width] duration-100" style={{ width: `${progress * 100}%` }} aria-hidden="true" />
      </div>
    </section>
  )
}
