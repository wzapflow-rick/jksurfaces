'use client'

import { useEffect, useRef, useState } from 'react'

const filters = ['Nome', 'SKU', 'Marca', 'Acabamento', 'Categoria']
const suggestions = ['Torneiras de bancada', 'Chuveiros de teto', 'Acabamento champagne', 'Misturadores monocomando', 'Cubas em pedra natural']

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="search-overlay fixed inset-0 z-[70] flex flex-col" role="dialog" aria-modal="true" aria-label="Buscar produtos">
      <button type="button" className="absolute inset-0 h-full w-full cursor-default bg-transparent" aria-label="Fechar busca" onClick={onClose} />
      <div className="search-overlay-panel relative mx-auto w-full max-w-4xl px-5 pt-[18vh] md:px-10">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Busca</p>
          <button type="button" onClick={onClose} className="text-[10px] uppercase tracking-[.24em] text-paper/55 transition-colors hover:text-champagne">Fechar (esc)</button>
        </div>
        <div className="mt-6 flex items-center gap-4 border-b border-champagne/50 pb-5">
          <SearchIcon className="h-5 w-5 shrink-0 text-champagne" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            placeholder="Busque por nome, SKU, marca ou acabamento"
            className="display w-full bg-transparent text-2xl text-paper outline-none placeholder:text-paper/30 md:text-4xl"
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-2" aria-label="Filtros de busca">
          {filters.map((filter) => (
            <span key={filter} className="rounded-full border border-white/15 px-4 py-2 text-[10px] uppercase tracking-[.2em] text-paper/60">{filter}</span>
          ))}
        </div>
        <div className="mt-10">
          <p className="text-[10px] uppercase tracking-[.24em] text-paper/35">Sugestões</p>
          <ul className="mt-4 flex flex-col divide-y divide-white/10 border-y border-white/10">
            {suggestions.map((item) => (
              <li key={item}>
                <button type="button" className="flex w-full items-center justify-between py-4 text-left text-sm text-paper/70 transition-colors hover:text-champagne">
                  {item}
                  <span aria-hidden="true" className="text-champagne">→</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}
