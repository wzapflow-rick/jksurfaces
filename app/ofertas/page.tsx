import { getSourceOffersWithMetrics } from "@/lib/services/source-capture-service"
import { PageHeader } from "@/components/layout/page-header"
import { OffersExplorer } from "@/components/offers/offers-explorer"
import { ImportAdButton } from "@/components/offers/import-ad-button"

export const dynamic = "force-dynamic"

export default async function OfertasPage() {
  const offers = await getSourceOffersWithMetrics()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ofertas capturadas"
        subtitle="Ofertas reais capturadas de fontes externas, associadas aos produtos JK e avaliadas pela regra financeira. A análise final é sempre feita no Radar."
        actions={<ImportAdButton />}
      />
      <OffersExplorer offers={offers} />
    </div>
  )
}
