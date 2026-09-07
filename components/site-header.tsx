'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useFavorites } from '@/components/favorites-context'
import { SearchOverlay } from '@/components/search-overlay'

const brandMark = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/JK-ffYCn9gcm0msoGpOKk1Rrmf3uB6iMr.png'

const nav = [
  { label: 'Destaques', href: '#destaques' },
  { label: 'Categorias', href: '#catalogo' },
  { label: 'Mais vendidos', href: '#selecao' },
  { label: 'Inspiração', href: '#inspiracao' },
  { label: 'Contato', href: '#contato' },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [overHero, setOverHero] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { count } = useFavorites()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const hero = document.getElementById('top')
    if (!hero) return
    const observer = new IntersectionObserver(
      ([entry]) => setOverHero(entry.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px', threshold: 0 },
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  // Mantém o header visível apenas sobre o Hero; ao sair dele, desliza para cima.
  const visible = overHero || menuOpen

  return (
    <>
      <header
        className={`site-header fixed inset-x-0 top-0 z-[60] px-5 md:px-10 ${scrolled || menuOpen ? 'site-header-scrolled' : ''} ${visible ? '' : 'site-header-hidden'}`}
        aria-hidden={visible ? undefined : true}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between py-4 md:py-5">
          <a href="#top" aria-label="JK Surfaces — início" className="shrink-0">
            <Image src={brandMark} alt="JK Surfaces" width={96} height={96} priority className="h-9 w-9 object-contain md:h-11 md:w-11" />
          </a>

          <nav className="hidden items-center gap-9 text-[10px] uppercase tracking-[.24em] text-paper/65 lg:flex" aria-label="Navegação principal">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="transition-colors hover:text-champagne">{item.label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-3 md:gap-5">
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="Abrir busca" className="p-1 text-paper/70 transition-colors hover:text-champagne">
              <SearchIcon className="h-5 w-5" />
            </button>
            <button type="button" aria-label={`Favoritos (${count})`} className="relative p-1 text-paper/70 transition-colors hover:text-champagne">
              <HeartIcon className="h-5 w-5" />
              {count > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-champagne px-1 text-[9px] font-medium text-ink">{count}</span>}
            </button>
            <a href="#contato" className="hidden border border-champagne/60 px-5 py-2.5 text-[10px] uppercase tracking-[.22em] text-champagne transition-colors hover:bg-champagne hover:text-ink md:inline-block">Fale com a JK</a>
            <button type="button" onClick={() => setMenuOpen((prev) => !prev)} aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label="Abrir menu" className="p-1 text-paper/80 lg:hidden">
              <MenuIcon open={menuOpen} className="h-5 w-5" />
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="mobile-menu" className="mx-auto flex max-w-7xl flex-col gap-1 border-t border-white/10 py-4 lg:hidden" aria-label="Navegação mobile">
            {nav.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="py-3 text-sm uppercase tracking-[.2em] text-paper/75 transition-colors hover:text-champagne">{item.label}</a>
            ))}
            <a href="#contato" onClick={() => setMenuOpen(false)} className="mt-3 border border-champagne/60 px-5 py-3 text-center text-[10px] uppercase tracking-[.22em] text-champagne">Fale com a JK</a>
          </nav>
        )}
      </header>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
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

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5.5 5.5 5.5c2 0 3.2 1.2 3.7 2.2h.6C10.3 6.7 11.5 5.5 13.5 5.5c3 0 4.5 3 3 6C19 15.65 12 20 12 20Z" strokeLinejoin="round" />
    </svg>
  )
}

function MenuIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      {open ? <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /> : <path d="M4 8h16M4 16h16" strokeLinecap="round" />}
    </svg>
  )
}
