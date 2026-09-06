const items = ['Metais que permanecem', 'Acabamentos com intenção', 'Design para o cotidiano', 'Especificação sem ruído']

function MarqueeGroup({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="editorial-marquee-group" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <span key={item} className="flex shrink-0 items-center gap-8 whitespace-nowrap">
          <span className="font-serif text-2xl italic text-champagne md:text-3xl">{item}</span>
          <span className="h-1 w-1 rounded-full bg-champagne" aria-hidden="true" />
        </span>
      ))}
    </div>
  )
}

export function EditorialMarquee() {
  return (
    <div className="editorial-marquee border-y border-white/10 py-5" aria-label="Princípios da JK SURFACES">
      <div className="editorial-marquee-track">
        <MarqueeGroup />
        <MarqueeGroup hidden />
      </div>
    </div>
  )
}
