import Link from "next/link"
import { Plus, Target } from "lucide-react"
import { getRadarOpportunitiesWithMetrics } from "@/lib/services/radar-service"
import { PageHeader } from "@/components/layout/page-header"
import { RadarTable } from "@/components/radar/radar-table"

export const dynamic = "force-dynamic"

export default async function RadarPage() {
  const opportunities = await getRadarOpportunitiesWithMetrics()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Radar JK"
        subtitle="Oportunidades de compra encontradas em OLX, Mercado Livre, Chatuba e outros marketplaces. Cadastre o anúncio e o radar calcula na hora se vale a pena."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/radar/novo"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface-2 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
            >
              <Plus className="h-4 w-4" />
              Nova oportunidade
            </Link>
            <Link
              href="/radar/cacar"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Target className="h-4 w-4" />
              Caçar oportunidade
            </Link>
          </div>
        }
      />
      <RadarTable opportunities={opportunities} />
    </div>
  )
}
