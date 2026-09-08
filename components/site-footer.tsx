import Image from 'next/image'

const wordmark = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/JK%20Logo%20OK-AeCRffSQ2waJkiJgmYXrq3SDUIQWzD.png'

const nav = [
  { label: 'Destaques', href: '#destaques' },
  { label: 'Categorias', href: '#catalogo' },
  { label: 'Mais vendidos', href: '#selecao' },
  { label: 'Inspiração', href: '#inspiracao' },
  { label: 'Contato', href: '#contato' },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-ink px-5 py-14 md:px-10" aria-label="Rodapé">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <Image src={wordmark} alt="JK Surfaces" width={200} height={80} className="h-12 w-auto object-contain object-left" />
          <p className="mt-6 text-[11px] uppercase tracking-[.24em] text-paper/45">Metais · Acabamentos · Design · Soluções</p>
        </div>

        <div className="grid grid-cols-2 gap-x-14 gap-y-10 sm:grid-cols-3">
          <nav className="flex flex-col gap-3 text-[10px] uppercase tracking-[.2em] text-paper/55" aria-label="Navegação do rodapé">
            <span className="mb-1 text-paper/30">Navegação</span>
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="transition-colors hover:text-champagne">{item.label}</a>
            ))}
          </nav>
          <div className="flex flex-col gap-3 text-[10px] uppercase tracking-[.2em] text-paper/55">
            <span className="mb-1 text-paper/30">Redes</span>
            <span>Instagram</span>
          </div>
          <div className="flex flex-col gap-3 text-[10px] uppercase tracking-[.2em] text-paper/55">
            <span className="mb-1 text-paper/30">Contato</span>
            <span>WhatsApp</span>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-7xl items-center justify-between border-t border-white/10 pt-6 text-[10px] uppercase tracking-[.2em] text-paper/25">
        <span>© 2026 JK Surfaces</span>
        <span className="font-mono">JK / 001</span>
      </div>
    </footer>
  )
}
