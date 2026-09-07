'use client'

import { useFavorites } from '@/components/favorites-context'

export function ProductGrid() {
  const { count } = useFavorites()

  return (
    <div className="border-y border-white/10 py-14 text-center">
      <p className="eyebrow mb-4">Catálogo completo a caminho</p>
      <h3 className="display text-4xl text-paper md:text-5xl">Mais produtos chegando.</h3>
      <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-paper/50">
        Enquanto o catálogo completo não chega, confira os destaques em pré-lançamento e garanta os primeiros produtos.
      </p>
      <a
        href="#destaques"
        className="mt-7 inline-flex items-center gap-3 bg-champagne px-8 py-3 text-[11px] uppercase tracking-[.24em] text-ink transition-colors hover:bg-paper"
      >
        Ver destaques <span aria-hidden="true">→</span>
      </a>
      {count > 0 && <p className="mt-5 text-[10px] uppercase tracking-[.2em] text-champagne">{count} item(ns) salvo(s)</p>}
    </div>
  )
}
