'use client'

import { useState } from 'react'

const logo = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/JK%20Logo%20OK-AeCRffSQ2waJkiJgmYXrq3SDUIQWzD.png'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  return <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#080b0f]/75 px-5 py-4 backdrop-blur-md md:px-10">
    <div className="mx-auto flex max-w-7xl items-center justify-between">
      <a href="#top" aria-label="JK Surfaces — início"><img src={logo} alt="JK Surfaces" className="h-10 w-auto object-contain object-left md:h-12" /></a>
      <nav className="hidden items-center gap-8 text-[10px] uppercase tracking-[.24em] text-white/70 md:flex" aria-label="Navegação principal"><a className="transition-colors hover:text-[#c7b79b]" href="#colecao">Coleção</a><a className="transition-colors hover:text-[#c7b79b]" href="#essencia">Essência</a><a className="transition-colors hover:text-[#c7b79b]" href="#contato">Contato</a></nav>
      <button className="text-[10px] uppercase tracking-[.22em] text-[#c7b79b] md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-menu">Menu</button>
    </div>
    {open && <nav id="mobile-menu" className="mx-auto flex max-w-7xl flex-col gap-5 border-t border-white/10 py-5 text-[11px] uppercase tracking-[.24em] text-white/75 md:hidden"><a href="#colecao" onClick={() => setOpen(false)}>Coleção</a><a href="#essencia" onClick={() => setOpen(false)}>Essência</a><a href="#contato" onClick={() => setOpen(false)}>Contato</a></nav>}
  </header>
}
