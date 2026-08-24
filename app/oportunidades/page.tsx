import { getOffersWithMetrics, getProductsWithMetrics } from "@/lib/services/radar-service"
import { PageHeader } from "@/components/layout/page-header"
import { OpportunitiesBoard } from "@/components/offers/opportunities-board"

export const dynamic = "force-dynamic"

export default async function OportunidadesPage() {
  const [offers, products] = await Promise.all([
    getOffersWithMetrics(),
    getProductsWithMetrics(),
  ])
  const activeProducts = products.filter((p) => p.active)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Oportunidades"
        subtitle="Ofertas de fornecedores avaliadas contra o custo máximo de cada produto. O que está dentro da regra vira alvo de compra."
      />
      <OpportunitiesBoard offers={offers} products={activeProducts} />
    </div>
  )
}
