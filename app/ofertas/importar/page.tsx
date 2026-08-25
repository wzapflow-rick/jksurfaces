import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { OfferImportWizard, type ImportWizardPrefill } from "@/components/offers/offer-import-wizard"

export const dynamic = "force-dynamic"

/**
 * Página de importação inteligente de anúncios (Fase 6.3). Aceita prefill via
 * query params (vindo de uma missão de caça): missionId, brand, sku, salePrice.
 */
export default async function ImportarOfertaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

  const salePriceRaw = first(sp.salePrice)
  const salePrice = salePriceRaw ? Number(salePriceRaw) : undefined

  const prefill: ImportWizardPrefill = {
    missionId: first(sp.missionId),
    brand: first(sp.brand),
    sku: first(sp.sku),
    salePrice: salePrice && Number.isFinite(salePrice) ? salePrice : undefined,
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Importar anúncio"
        subtitle="Transforme um anúncio da OLX em uma oferta analisável. Você revisa cada campo antes de importar — o sistema nunca inventa dados nem envia nada ao Radar automaticamente."
        actions={
          <Link href="/ofertas">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="size-4" />
              Voltar às ofertas
            </Button>
          </Link>
        }
      />
      <OfferImportWizard prefill={prefill} />
    </div>
  )
}
