'use client'

import { useEffect, useRef, useState, startTransition } from 'react'

const items = ['Metais que permanecem', 'Acabamentos com intenção', 'Design para o cotidiano', 'Especificação sem ruído']

// Velocidade base em % da largura de um bloco por segundo. Mais baixo = mais lento e legível.
const BASE_VELOCITY = 9

function Block({ hidden = false, blockRef }: { hidden?: boolean; blockRef?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={blockRef} aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((item) => (
        <span key={item} className="flex items-center gap-8 whitespace-nowrap pr-8">
          <span className="font-serif text-2xl italic text-champagne md:text-3xl">{item}</span>
          <span className="h-1 w-1 rounded-full bg-champagne" aria-hidden="true" />
        </span>
      ))}
    </div>
  )
}

export function EditorialMarquee() {
  const containerRef = useRef<HTMLDivElement>(null)
  const blockRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  const [numCopies, setNumCopies] = useState(3)
  const [unitWidth, setUnitWidth] = useState(0)

  const state = useRef({
    x: 0,
    dir: 1,
    lastScrollY: 0,
    lastFrame: 0,
  })

  useEffect(() => {
    const container = containerRef.current
    const block = blockRef.current
    if (!container || !block) return

    const updateSizes = () => {
      const cw = container.getBoundingClientRect().width || 0
      const bw = block.getBoundingClientRect().width || 0
      if (bw > 0) {
        startTransition(() => {
          setUnitWidth(bw)
          setNumCopies(Math.max(3, Math.ceil(cw / bw) + 2))
        })
      }
    }

    updateSizes()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(updateSizes)
    ro.observe(container)
    ro.observe(block)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (unitWidth <= 0) return

    const wrap = (value: number, max: number) => ((value % max) + max) % max

    state.current.lastScrollY = window.scrollY
    state.current.lastFrame = performance.now()

    const onScroll = () => {
      const y = window.scrollY
      const dy = y - state.current.lastScrollY
      state.current.lastScrollY = y
      // O scroll para baixo mantém o sentido base (esquerda); para cima inverte.
      if (Math.abs(dy) > 0.5) state.current.dir = dy > 0 ? 1 : -1
    }

    let rafId = 0
    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - state.current.lastFrame) / 1000))
      state.current.lastFrame = now

      const pxPerSec = (unitWidth * BASE_VELOCITY) / 100
      state.current.x += state.current.dir * pxPerSec * dt

      const offset = -wrap(state.current.x, unitWidth)
      if (scrollerRef.current) {
        scrollerRef.current.style.transform = `translate3d(${offset}px, 0, 0)`
      }
      rafId = window.requestAnimationFrame(tick)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    rafId = window.requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.cancelAnimationFrame(rafId)
    }
  }, [unitWidth])

  return (
    <div
      ref={containerRef}
      className="editorial-marquee flex w-full items-center overflow-hidden border-y border-white/10 py-5"
      aria-label="Princípios da JK SURFACES"
    >
      <div ref={scrollerRef} className="flex flex-nowrap will-change-transform">
        {Array.from({ length: numCopies }).map((_, i) => (
          <Block key={i} hidden={i !== 0} blockRef={i === 0 ? blockRef : undefined} />
        ))}
      </div>
    </div>
  )
}
