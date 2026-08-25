import Link from "next/link"
import { Import } from "lucide-react"
import { getSourceOffersWithMetrics } from "@/lib/services/source-capture-service"
import { PageHeader } from "@/components/layout/page-header"
import { OffersExplorer } from "@/components/offers/offers-explorer"

export const dynamic = "force-dynamic"

export default async function OfertasPage() {
  const offers = await getSourceOffersWithMetrics()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ofertas capturadas"
        subtitle="Ofertas reais capturadas de fontes externas, associadas aos produtos JK e avaliadas pela regra financeira. A análise final é sempre feita no Radar."
        actions={
          <Link
            href="/importar"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Import className="h-4 w-4" />
            Importar anúncio
          </Link>
        }
      />
      <OffersExplorer offers={offers} />
    </div>
  )
}
