'use client'

import Image from 'next/image'
import { useRef } from 'react'

type Category = { name: string; image: string }

export function CategoryRail({ categories }: { categories: Category[] }) {
  const railRef = useRef<HTMLDivElement>(null)
  const pointer = useRef({ active: false, start: 0, scroll: 0 })

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!railRef.current) return
    pointer.current = { active: true, start: event.clientX, scroll: railRef.current.scrollLeft }
    railRef.current.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointer.current.active || !railRef.current) return
    railRef.current.scrollLeft = pointer.current.scroll - (event.clientX - pointer.current.start)
  }

  function stopDragging() {
    pointer.current.active = false
  }

  return (
    <div
      ref={railRef}
      className="category-rail flex snap-x gap-4 overflow-x-auto pb-5 md:cursor-grab md:active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onPointerLeave={stopDragging}
      aria-label="Categorias de produtos"
    >
      {categories.map((category) => (
        <article key={category.name} className="group relative min-w-[76vw] snap-start md:min-w-[calc(25%-12px)]">
          <div className="relative aspect-[.78] overflow-hidden bg-surface">
            <Image src={category.image} alt={`Inspiração de ${category.name}`} fill className="object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0" sizes="(min-width: 768px) 25vw, 76vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
            <h3 className="display absolute bottom-5 left-5 max-w-[80%] text-4xl leading-none text-paper md:text-3xl lg:text-4xl">{category.name}</h3>
          </div>
        </article>
      ))}
    </div>
  )
}
