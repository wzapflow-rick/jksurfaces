export function EditorialMarquee() {
  const items = ['Metais que permanecem', 'Acabamentos com intenção', 'Design para o cotidiano', 'Especificação sem ruído']

  return (
    <div className="editorial-marquee border-y border-white/10 py-5" aria-label="Princípios da JK SURFACES">
      <div className="editorial-marquee-track">
        {[...items, ...items].map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-8 whitespace-nowrap">
            <span className="font-serif text-2xl italic text-champagne md:text-3xl">{item}</span>
            <span className="h-1 w-1 rounded-full bg-champagne" aria-hidden="true" />
          </span>
        ))}
      </div>
    </div>
  )
}
