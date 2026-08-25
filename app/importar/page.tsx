import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { ImportWizard, type ImportPrefill } from "@/components/import/import-wizard"

export const dynamic = "force-dynamic"

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function ImportarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams

  const missionId = first(sp.missionId)
  const name = first(sp.name)
  const sku = first(sp.sku)
  const brand = first(sp.brand)
  const salePriceRaw = first(sp.salePrice)
  const salePrice = salePriceRaw ? Number(salePriceRaw) : undefined

  const hasPrefill = Boolean(missionId || name || sku || brand || salePrice)
  const prefill: ImportPrefill | undefined = hasPrefill
    ? {
        missionId,
        name,
        sku,
        brand,
        salePrice: Number.isFinite(salePrice) ? salePrice : undefined,
      }
    : undefined

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={missionId ? `/caca/${missionId}` : "/ofertas"}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {missionId ? "Voltar à missão" : "Ofertas capturadas"}
      </Link>
      <PageHeader
        title="Importação inteligente"
        subtitle="Cole o link ou o texto de um anúncio da OLX. O Radar JK identifica produto, preço, lote e condição automaticamente — você revisa e confirma antes de analisar."
      />
      <ImportWizard prefill={prefill} />
    </div>
  )
}
