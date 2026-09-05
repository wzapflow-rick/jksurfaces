'use client'

import Image from 'next/image'
import { useState, type PointerEvent } from 'react'

type HeroCinematicProps = {
  image: string
}

export function HeroCinematic({ image }: HeroCinematicProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === 'touch') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 10
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 6
    setOffset({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) })
  }

  return (
    <section
      className="hero-cinematic hero-atelier relative min-h-[92vh] overflow-hidden px-5 pb-8 pt-28 md:px-10 md:pb-10 md:pt-10"
      aria-labelledby="hero-title"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setOffset({ x: 0, y: 0 })}
    >
      <div className="hero-atelier-grid relative mx-auto grid min-h-[calc(92vh-4.5rem)] max-w-7xl overflow-hidden border border-white/10 bg-ink md:grid-cols-[.74fr_1.26fr]">
        <div className="hero-atelier-copy relative z-10 flex flex-col justify-between px-6 py-7 md:px-10 md:py-10">
          <div className="flex items-start justify-between gap-4">
            <p className="hero-copy hero-copy-eyebrow eyebrow">JK / 001 — matéria em foco</p>
            <span className="hero-index font-mono text-[10px] tracking-[.2em] text-paper/35">01—04</span>
          </div>
          <div className="mt-20 md:mt-0">
            <p className="hero-copy hero-copy-eyebrow mb-6 max-w-[14rem] text-[10px] uppercase leading-5 tracking-[.24em] text-paper/45">Metais · acabamentos · design · soluções</p>
            <h1 id="hero-title" className="hero-copy hero-copy-title display max-w-[11ch] text-[4.4rem] leading-[.82] text-paper md:text-[7.4rem]">
              A forma
              <em className="hero-atelier-emphasis block text-champagne">encontra</em>
              a matéria.
            </h1>
            <p className="hero-copy hero-copy-support mt-8 max-w-[21rem] text-sm leading-6 text-paper/55">Objetos, superfícies e acabamentos escolhidos para espaços que pedem presença.</p>
          </div>
          <div className="hero-copy hero-copy-support mt-10 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
            <a href="#curadoria" className="magnetic group flex items-center gap-4 text-[10px] uppercase tracking-[.24em] text-champagne"><span className="flex size-9 items-center justify-center rounded-full border border-champagne/60 transition-colors group-hover:bg-champagne group-hover:text-ink">↗</span> Ver seleção</a>
            <span className="font-mono text-[9px] uppercase tracking-[.2em] text-paper/30">Est. 2018</span>
          </div>
        </div>

        <div className="hero-atelier-media relative min-h-[24rem] overflow-hidden border-t border-white/10 md:border-l md:border-t-0">
          <div className="hero-photo absolute inset-[-8px]" style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}>
            <Image src={image} alt="Interior contemporâneo com metais e superfícies naturais" fill priority className="object-cover object-center" sizes="(min-width: 768px) 65vw, 100vw" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-ink/45 via-transparent to-ink/10" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink/70 to-transparent" />
          <span className="absolute bottom-5 left-5 font-mono text-[9px] uppercase tracking-[.22em] text-paper/55">Superfície / luz / silêncio</span>
          <span className="absolute right-5 top-5 font-mono text-[9px] tracking-[.2em] text-paper/55">{"42° 59' 32\" S"}</span>
        </div>

        <div className="hero-atelier-stamp pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 rotate-90 font-mono text-[9px] uppercase tracking-[.32em] text-paper/45 md:block">JK SURFACES — OBJECTS WITH PRESENCE</div>
      </div>

      <div className="hero-copy hero-copy-support mx-auto flex max-w-7xl items-center justify-between gap-6 pt-5 font-mono text-[9px] uppercase tracking-[.2em] text-paper/35">
        <span>Curadoria para interiores</span>
        <span className="hidden md:inline">Arraste para explorar ↓</span>
        <span>Rio · Brasil</span>
      </div>

      <div className="hero-opening" aria-hidden="true">
        <span className="hero-opening-line" />
        <span className="hero-strip hero-strip-a" />
        <span className="hero-strip hero-strip-b" />
        <span className="hero-strip hero-strip-c" />
        <span className="hero-strip hero-strip-d" />
        <span className="hero-strip hero-strip-e" />
        <span className="hero-strip hero-strip-f" />
      </div>
    </section>
  )
}
