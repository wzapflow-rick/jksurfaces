'use client'

import { useFavorites } from '@/components/favorites-context'

export function ProductGrid() {
  const { count } = useFavorites()

  return (
    <div className="border-y border-white/10 py-14 text-center">
      <p className="eyebrow mb-4">Catálogo em atualização</p>
      <h3 className="display text-4xl text-paper md:text-5xl">Novidades em breve.</h3>
      <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-paper/50">
        Estamos preparando a seleção de produtos e acabamentos da JK SURFACES. Em breve, este espaço receberá informações oficiais.
      </p>
      {count > 0 && <p className="mt-5 text-[10px] uppercase tracking-[.2em] text-champagne">{count} item(ns) salvo(s)</p>}
    </div>
  )
}
