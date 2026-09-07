'use client'

import { useEffect, useRef, useState } from 'react'

// Each stage is a layer (stage-01..05). Today they share one demo asset, but the
// structure is ready to receive an individual transparent PNG per part later.
const stages = [
  { id: 'stage-01', index: '01', label: 'Qualidade', text: 'Produtos escolhidos para durar.', image: '/images/faucet.png', offset: [-150, -30] },
  { id: 'stage-02', index: '02', label: 'Funcionalidade', text: 'Soluções pensadas para o dia a dia.', image: '/images/faucet.png', offset: [130, -14] },
  { id: 'stage-03', index: '03', label: 'Design', text: 'Detalhes que valorizam o ambiente.', image: '/images/faucet.png', offset: [-100, 6] },
  { id: 'stage-04', index: '04', label: 'Confiança', text: 'Boas escolhas do início ao fim.', image: '/images/faucet.png', offset: [120, 18] },
  { id: 'stage-05', index: '05', label: 'Projeto', text: 'O detalhe certo completa o espaço.', image: '/images/faucet.png', offset: [-140, 34] },
]

const clamp = (value: number) => Math.min(1, Math.max(0, value))
const easeOut = (value: number) => 1 - Math.pow(1 - value, 3)

export function ProductAssembly() {
  const sectionRef = useRef<HTMLElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const section = sectionRef.current
        if (!section) return
        const rect = section.getBoundingClientRect()
        const range = Math.max(section.offsetHeight - window.innerHeight, 1)
        setProgress(clamp(-rect.top / range))
      })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const assemble = easeOut(clamp(progress * 1.4))
  const activeStage = Math.min(stages.length - 1, Math.floor(progress * stages.length))
  const spaceReveal = clamp((progress - 0.68) / 0.28)
  const showFinal = progress > 0.82

  return (
    <section ref={sectionRef} id="experiencia" className="product-assembly relative" aria-labelledby="experiencia-title">
      <div className="product-assembly-sticky sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="product-assembly-space absolute inset-0" style={{ opacity: spaceReveal * 0.65, transform: `scale(${1.08 - spaceReveal * 0.08})` }} aria-hidden="true" />
        <div className="product-assembly-veil absolute inset-0" aria-hidden="true" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 px-5 md:grid-cols-[1fr_1fr] md:px-10">
          <div className="order-2 md:order-1">
            <p className="eyebrow mb-6" id="experiencia-title">Nossa essência</p>
            <div className="assembly-text-frame relative">
              {stages.map((stage, index) => {
                const isActive = index === activeStage
                return (
                  <div
                    key={stage.id}
                    className="assembly-text"
                    style={{
                      opacity: isActive ? 1 : 0,
                      clipPath: isActive ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)',
                      pointerEvents: isActive ? 'auto' : 'none',
                    }}
                    aria-hidden={!isActive}
                  >
                    <span className="font-mono text-xs tracking-[.3em] text-champagne">{stage.index} / 05</span>
                    <h3 className="display mt-4 text-6xl leading-none text-paper md:text-7xl">{stage.label}</h3>
                    <p className="mt-5 max-w-sm text-sm leading-7 text-paper/60">{stage.text}</p>
                  </div>
                )
              })}
            </div>

            <div className="assembly-progress mt-10 flex items-center gap-3" aria-hidden="true">
              {stages.map((stage, index) => (
                <span key={stage.id} className={`assembly-progress-dot ${index <= activeStage ? 'is-active' : ''}`} />
              ))}
            </div>

            <div className="assembly-final mt-10" style={{ opacity: showFinal ? 1 : 0, transform: showFinal ? 'translateY(0)' : 'translateY(12px)' }}>
              <p className="display text-2xl text-paper md:text-3xl">Boas escolhas transformam projetos.</p>
              <a href="#catalogo" className="mt-5 inline-flex items-center gap-3 border-b border-champagne pb-2 text-[10px] uppercase tracking-[.24em] text-champagne transition-colors hover:text-paper">
                Explorar produtos <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          <div className="order-1 flex justify-center md:order-2">
            <div className={`assembly-stage ${showFinal ? 'is-complete' : ''}`}>
              <div className="assembly-ghost" style={{ opacity: 0.14 + assemble * 0.1, filter: `blur(${(1 - assemble) * 7}px)` }} aria-hidden="true" />
              {stages.map((stage, index) => {
                const local = easeOut(clamp((assemble - index * 0.06) / 0.7))
                const [ox, oy] = stage.offset
                return (
                  <div
                    key={stage.id}
                    className="assembly-band"
                    style={{
                      top: `${index * 20}%`,
                      backgroundImage: `url(${stage.image})`,
                      backgroundPosition: `50% ${index * 25}%`,
                      transform: `translate3d(${ox * (1 - local)}px, ${oy * (1 - local)}px, 0)`,
                      opacity: 0.2 + local * 0.8,
                    }}
                    aria-hidden="true"
                  />
                )
              })}
              <span className="assembly-sheen" aria-hidden="true" />
              <span className="sr-only">Composição visual de um produto, do detalhe ao resultado.</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 z-10 h-px bg-champagne/70 transition-[width] duration-100" style={{ width: `${progress * 100}%` }} aria-hidden="true" />
      </div>
    </section>
  )
}
