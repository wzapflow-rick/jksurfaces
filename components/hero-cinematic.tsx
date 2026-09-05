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
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 12
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 8
    setOffset({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) })
  }

  return (
    <section
      className="hero-cinematic relative flex min-h-[92vh] items-end overflow-hidden px-5 pb-14 pt-36 md:px-10 md:pb-20"
      aria-labelledby="hero-title"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setOffset({ x: 0, y: 0 })}
    >
      <div className="hero-photo absolute inset-[-8px]" style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}>
        <Image src={image} alt="Interior contemporâneo com metais e superfícies naturais" fill priority className="object-cover object-center" sizes="100vw" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-ink/15" />
      <div className="hero-opening" aria-hidden="true">
        <span className="hero-opening-line" />
        <span className="hero-strip hero-strip-a" />
        <span className="hero-strip hero-strip-b" />
        <span className="hero-strip hero-strip-c" />
        <span className="hero-strip hero-strip-d" />
        <span className="hero-strip hero-strip-e" />
        <span className="hero-strip hero-strip-f" />
      </div>
      <div className="relative mx-auto w-full max-w-7xl">
        <p className="hero-copy hero-copy-eyebrow eyebrow mb-5">Metais · acabamentos · design · soluções</p>
        <h1 id="hero-title" className="hero-copy hero-copy-title display max-w-4xl text-6xl leading-[.87] text-paper md:text-9xl">
          <span className="hero-title-line"><span>Detalhes que</span></span>
          <span className="hero-title-line"><em className="text-champagne">definem</em> espaços.</span>
        </h1>
        <div className="hero-copy hero-copy-support mt-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <p className="max-w-sm text-sm leading-6 text-paper/65">Uma curadoria precisa para transformar matéria em presença. A JK SURFACES aproxima o design daquilo que você toca todos os dias.</p>
          <a href="#curadoria" className="magnetic w-fit border border-champagne px-6 py-4 text-[10px] uppercase tracking-[.24em] text-champagne transition-colors hover:bg-champagne hover:text-ink">Explorar produtos →</a>
        </div>
      </div>
      <span className="hero-scroll-mark" aria-hidden="true" />
    </section>
  )
}
