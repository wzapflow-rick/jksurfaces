import Image from 'next/image'
import type { CSSProperties } from 'react'

const projects = [
  { name: 'Casa Leme', type: 'Residencial · Rio de Janeiro', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=88' },
  { name: 'Apartamento 32', type: 'Interiores · São Paulo', image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1800&q=88' },
  { name: 'Hotel Atlântico', type: 'Hospitalidade · Bahia', image: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1800&q=88' },
]

export function ProjectShowcase() {
  return (
    <section id="projetos" className="bg-surface px-5 py-28 md:px-10 md:py-40" aria-labelledby="projetos-title">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div><p className="eyebrow mb-5">05 / Projetos que ficam</p><h2 id="projetos-title" className="display max-w-2xl text-6xl leading-[.88] text-paper md:text-8xl">A matéria em contexto.</h2></div>
          <p className="max-w-xs text-sm leading-7 text-paper/50 md:pb-2">Soluções escolhidas para espaços com identidade, uso e tempo.</p>
        </div>
        <div className="project-stack">
          {projects.map((project, index) => (
            <article key={project.name} className="project-card group" style={{ '--project-index': index } as CSSProperties}>
              <div className="relative aspect-[16/10] overflow-hidden bg-ink">
                <Image src={project.image} alt={`Projeto ${project.name}`} fill priority={index === 0} className="object-cover transition duration-1000 group-hover:scale-105" sizes="(min-width: 768px) 90vw, 100vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                <div className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-4 md:inset-x-10 md:bottom-10"><div><p className="eyebrow mb-3 text-paper/70">{project.type}</p><h3 className="display text-4xl text-paper md:text-6xl">{project.name}</h3></div><span className="font-mono text-xs text-paper/60">0{index + 1}</span></div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
