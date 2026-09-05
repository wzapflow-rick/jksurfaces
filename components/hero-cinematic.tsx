'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

const brandMark = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/JK-ffYCn9gcm0msoGpOKk1Rrmf3uB6iMr.png'

export function HeroCinematic() {
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
        setProgress(Math.min(1, Math.max(0, -rect.top / range)))
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

  const reveal = Math.min(1, progress * 1.8)
  const markStyle = {
    transform: `translate3d(0, ${-progress * 22}vh, 0) scale(${1 - progress * 0.56}) rotateY(${progress * 360}deg)`,
    opacity: 1 - Math.max(0, progress - 0.72) * 2.8,
  }

  return (
    <section ref={sectionRef} id="top" className="hero-editorial relative min-h-[220vh] bg-ink" aria-labelledby="hero-title">
      <div className="hero-editorial-stage sticky top-0 flex min-h-screen flex-col overflow-hidden px-5 py-5 md:px-10 md:py-7">
        <div className="hero-editorial-grid absolute inset-0" aria-hidden="true" />
        <header className="relative z-20 flex items-start justify-between" aria-label="Navegação principal">
          <a href="#top" aria-label="JK Surfaces — início" className="brand-header-mark"><Image src={brandMark} alt="JK" width={112} height={112} className="h-12 w-12 object-contain md:h-14 md:w-14" /></a>
          <nav className="hidden items-center gap-7 pt-2 text-[9px] uppercase tracking-[.25em] text-paper/55 md:flex"><a href="/produtos" className="transition-colors hover:text-champagne">Produtos</a><a href="#curadoria" className="transition-colors hover:text-champagne">Curadoria</a><a href="#processo" className="transition-colors hover:text-champagne">Processo</a><a href="#contato" className="transition-colors hover:text-champagne">Contato</a></nav>
          <span className="font-mono text-[9px] tracking-[.2em] text-paper/35 md:hidden">JK / 001</span>
        </header>

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 items-center justify-center">
          <div className="hero-editorial-mark absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2" style={markStyle}>
            <Image src={brandMark} alt="JK" width={900} height={900} priority className="w-[min(54vw,34rem)] object-contain" />
            <span className="hero-editorial-sheen" aria-hidden="true" />
          </div>
          <div className="hero-editorial-copy relative z-20 w-full max-w-7xl" style={{ opacity: reveal, transform: `translateY(${(1 - reveal) * 36}px)` }}>
            <div className="max-w-[34rem] pt-[34vh] md:pt-[24vh]">
              <p className="eyebrow mb-6 text-champagne">Metais · acabamentos · soluções</p>
              <h1 id="hero-title" className="display max-w-3xl text-6xl leading-[.88] text-paper md:text-9xl">A matéria certa<br /><span className="text-champagne">transforma o espaço.</span></h1>
              <p className="mt-8 max-w-md text-sm leading-7 text-paper/55 md:text-base">Curadoria de superfícies, metais e detalhes para projetos que não precisam explicar sua presença.</p>
              <div className="mt-9 flex flex-wrap items-center gap-5"><a href="#catalogo" className="inline-flex items-center gap-3 border-b border-champagne pb-2 text-[10px] uppercase tracking-[.24em] text-champagne transition-colors hover:text-paper">Explorar produtos <span aria-hidden="true">→</span></a><a href="#contato" className="text-[10px] uppercase tracking-[.24em] text-paper/45 transition-colors hover:text-paper">Falar com a JK</a></div>
            </div>
          </div>
        </div>

        <div className="relative z-20 flex items-end justify-between border-t border-white/10 pt-4 font-mono text-[9px] uppercase tracking-[.2em] text-paper/35"><span>Design que permanece</span><span>{String(Math.round(progress * 100)).padStart(3, '0')}%</span><span className="hidden md:inline">Rio · Brasil</span></div>
        <div className="absolute bottom-0 left-0 h-px bg-champagne transition-[width] duration-100" style={{ width: `${progress * 100}%` }} aria-hidden="true" />
      </div>
    </section>
  )
}
