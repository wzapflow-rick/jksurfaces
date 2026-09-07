'use client'

import { useEffect, useRef } from 'react'

export interface CarouselItem {
  src: string
  alt: string
}

interface HeroProductCarouselProps {
  items: CarouselItem[]
  imageWidth?: number
  imageHeight?: number
  spacing?: number
  speed?: number
  direction?: 'left' | 'right'
  tilt?: number
  perspective?: number
}

export function HeroProductCarousel({
  items,
  imageWidth = 260,
  imageHeight = 320,
  spacing = 2.4,
  speed = 4.5,
  direction = 'left',
  tilt = -6,
  perspective = 2600,
}: HeroProductCarouselProps) {
  const ringRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)
  const rotYRef = useRef(0)
  const velRef = useRef(0)
  const lastRef = useRef(0)
  const dragRef = useRef({ active: false, x: 0 })

  const count = items.length
  const angle = 360 / count
  const factor = 1 + spacing * 0.15
  const radius = (imageWidth * factor) / (2 * Math.tan(Math.PI / count))
  const degPerSec = speed * 6 * (direction === 'left' ? -1 : 1)

  useEffect(() => {
    const ring = ringRef.current
    if (!ring) return

    const apply = () => {
      ring.style.transform = `translateZ(${-radius}px) rotateY(${rotYRef.current}deg)`
    }
    apply()

    const draw = (now: number) => {
      const dt = lastRef.current ? (now - lastRef.current) / 1000 : 0
      lastRef.current = now
      const f = Math.min(dt, 0.1)
      const d = dragRef.current
      if (!d.active) {
        // Giro base contínuo, sempre ativo. O arrasto soma um impulso que decai suavemente até voltar ao giro base.
        rotYRef.current += degPerSec * f
        if (Math.abs(velRef.current) > 0.01) {
          rotYRef.current += velRef.current * f
          velRef.current *= 0.94
        }
      }
      apply()
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [radius, degPerSec])

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    dragRef.current = { active: true, x: e.clientX }
    velRef.current = 0
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d.active) return
    const dx = e.clientX - d.x
    d.x = e.clientX
    const k = 0.7
    rotYRef.current += dx * k
    velRef.current = dx * k * 60
  }
  const onPointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    dragRef.current.active = false
  }

  return (
    <div
      className="hero-carousel-viewport"
      style={{ perspective: `${perspective}px` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="group"
      aria-roledescription="carrossel"
      aria-label="Produtos JK SURFACES em rotação"
    >
      <div className="hero-carousel-tilt" style={{ transform: `rotateX(${tilt}deg)` }}>
        <div
          ref={ringRef}
          className="hero-carousel-ring"
          style={{ width: imageWidth, height: imageHeight }}
        >
          {items.map((item, i) => (
            <div
              key={item.src}
              className="hero-carousel-face"
              style={{ transform: `rotateY(${i * angle}deg) translateZ(${radius}px)` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.src || '/placeholder.svg'} alt={item.alt} draggable={false} />
              <span className="hero-carousel-back" aria-hidden="true" style={{ backgroundImage: `url(${item.src})` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
