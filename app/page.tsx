import { CatalogCategories } from '@/components/catalog-categories'
import { ContactCta } from '@/components/contact-cta'
import { CuratedSection } from '@/components/curated-section'
import { EditorialMarquee } from '@/components/editorial-marquee'
import { FavoritesProvider } from '@/components/favorites-context'
import { FeaturedTiers } from '@/components/featured-tiers'
import { BrandLogos } from '@/components/brand-logos'
import { HeroCinematic } from '@/components/hero-cinematic'
import { InspirationSection } from '@/components/inspiration-section'
import { LogoIntro } from '@/components/logo-intro'
import { ProductAssembly } from '@/components/product-assembly'
import { ProductGrid } from '@/components/product-grid'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

export default function Home() {
  return (
    <FavoritesProvider>
      <LogoIntro />
      <SiteHeader />

      <main>
        <HeroCinematic />
        <EditorialMarquee />
        <FeaturedTiers />
        <BrandLogos />
        <CatalogCategories />
        <ProductAssembly />

        <section id="selecao" className="bg-surface px-5 py-24 md:px-10 md:py-36" aria-labelledby="selecao-title">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 max-w-2xl">
              <p className="eyebrow mb-4">Mais vendidos</p>
              <h2 id="selecao-title" className="display text-5xl text-paper md:text-7xl">Os produtos que mais saem.</h2>
              <p className="mt-6 max-w-lg text-sm leading-7 text-paper/55">
                Os favoritos dos nossos clientes, com pronta entrega para todo o Brasil.
              </p>
            </div>
            <ProductGrid />
          </div>
        </section>

        <CuratedSection />
        <InspirationSection />
        <ContactCta />
      </main>

      <SiteFooter />
    </FavoritesProvider>
  )
}
