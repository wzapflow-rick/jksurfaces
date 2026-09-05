import Image from 'next/image'
import { CategoryRail } from '@/components/category-rail'
import { FeaturedProducts } from '@/components/featured-products'
import { HeroCinematic } from '@/components/hero-cinematic'

const logo = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/JK%20Logo%20OK-AeCRffSQ2waJkiJgmYXrq3SDUIQWzD.png'
const categories = [
  { name: 'Torneiras', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=85' },
  { name: 'Misturadores', image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=900&q=85' },
  { name: 'Duchas & Chuveiros', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=85' },
  { name: 'Acabamentos', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85' },
  { name: 'Metais', image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=85' },
  { name: 'Acessórios', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85' },
]

export default function Home() {
  return (
    <main id="top" className="overflow-hidden">
      <HeroCinematic />

      <section id="essencia" className="texture border-y border-white/10 px-5 py-28 md:px-10 md:py-40" aria-labelledby="essencia-title">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[.8fr_1.2fr] md:items-end">
          <p className="eyebrow">01 / Nossa essência</p>
          <div className="reveal-up"><h2 id="essencia-title" className="display text-5xl leading-[.94] text-paper md:text-8xl">Qualidade.<br />Funcionalidade.<br /><span className="text-steel">Design.</span></h2><p className="mt-10 max-w-md text-sm leading-7 text-paper/55">O essencial bem resolvido. Selecionamos metais e acabamentos que equilibram performance, longevidade e a beleza silenciosa de uma escolha bem feita.</p></div>
        </div>
      </section>

      <section id="curadoria" className="px-5 py-24 md:px-10 md:py-36" aria-labelledby="curadoria-title">
        <div className="mx-auto max-w-7xl"><div className="mb-12 flex items-end justify-between gap-6"><div><p className="eyebrow mb-4">02 / A curadoria</p><h2 id="curadoria-title" className="display text-5xl text-paper md:text-7xl">Explore superfícies</h2></div><span className="hidden text-[10px] uppercase tracking-[.2em] text-paper/35 md:block">Arraste para descobrir</span></div><CategoryRail categories={categories} /><p className="mt-3 text-[10px] uppercase tracking-[.2em] text-paper/35 md:hidden">Arraste para descobrir</p></div>
      </section>

      <section id="selecao" className="bg-surface px-5 py-24 md:px-10 md:py-36" aria-labelledby="selecao-title">
        <div className="mx-auto max-w-7xl"><div className="mb-14 max-w-2xl"><p className="eyebrow mb-4">03 / Seleção JK</p><h2 id="selecao-title" className="display text-5xl text-paper md:text-7xl">Produtos em destaque</h2><p className="mt-6 max-w-lg text-sm leading-7 text-paper/55">Uma seleção de detalhes escolhidos para projetos que valorizam qualidade, funcionalidade e design.</p></div><FeaturedProducts /></div>
      </section>

      <section id="catalogo" className="texture px-5 py-28 md:px-10 md:py-40" aria-labelledby="catalogo-title"><div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-end md:justify-between"><div><p className="eyebrow mb-6">04 / Catálogo</p><h2 id="catalogo-title" className="display max-w-3xl text-6xl leading-[.88] text-paper md:text-8xl">Tudo começa<br /><span className="text-champagne">pelo detalhe.</span></h2></div><div className="max-w-sm md:pb-2"><p className="text-sm leading-7 text-paper/60">Explore a seleção completa de metais, acabamentos e soluções da JK SURFACES.</p><a href="/produtos" className="magnetic mt-8 inline-block border-b border-champagne pb-2 text-[10px] uppercase tracking-[.24em] text-champagne">Ver catálogo completo →</a></div></div></section>

      <section id="projetos" className="px-5 py-28 md:px-10 md:py-40" aria-labelledby="projetos-title"><div className="mx-auto grid max-w-7xl gap-14 md:grid-cols-2 md:items-center"><div><p className="eyebrow mb-6">05 / Para seus projetos</p><h2 id="projetos-title" className="display text-6xl leading-[.9] text-paper md:text-8xl">O detalhe<br /><span className="text-champagne">é a decisão.</span></h2></div><div className="border-l border-champagne pl-7"><p className="text-lg leading-8 text-paper/70">Da especificação à instalação, criamos soluções para quem não abre mão de fazer bem feito.</p><a href="#contato" className="magnetic mt-8 inline-block border-b border-champagne pb-2 text-[10px] uppercase tracking-[.24em] text-champagne">Fale com a JK SURFACES</a></div></div></section>

      <footer id="contato" className="border-t border-white/10 px-5 py-12 md:px-10"><div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-end md:justify-between"><div><Image src={logo} alt="JK Surfaces" width={180} height={70} className="h-12 w-auto object-contain object-left" /><p className="mt-5 text-xs text-paper/40">Metais · acabamentos · design · soluções</p></div><nav className="grid grid-cols-2 gap-x-12 gap-y-4 text-[10px] uppercase tracking-[.2em] text-paper/55" aria-label="Links do rodapé"><a href="/produtos" className="transition-colors hover:text-champagne">Produtos</a><a href="#selecao" className="transition-colors hover:text-champagne">Marcas</a><a href="/produtos" className="transition-colors hover:text-champagne">Catálogo</a><a href="#contato" className="transition-colors hover:text-champagne">Contato</a><span className="text-paper/30">Instagram</span><span className="text-paper/30">WhatsApp</span></nav><p className="text-[10px] uppercase tracking-[.2em] text-paper/25 md:text-right">© 2026 JK SURFACES</p></div></footer>
    </main>
  )
}
