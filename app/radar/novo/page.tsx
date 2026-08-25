import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { RadarForm, type RadarPrefill } from "@/components/radar/radar-form"
import type { RadarSource } from "@/types"

export const dynamic = "force-dynamic"

const VALID_SOURCES: RadarSource[] = ["OLX", "MERCADO_LIVRE", "CHATUBA", "MARKETPLACE", "OUTRO"]

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function NovaOportunidadePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams

  const name = first(sp.name)
  const sku = first(sp.sku)
  const brand = first(sp.brand)
  const sourceRaw = first(sp.source)
  const salePriceRaw = first(sp.salePrice)
  const missionId = first(sp.missionId)
  const url = first(sp.url)
  const announcedPriceRaw = first(sp.announcedPrice)

  const source = sourceRaw && VALID_SOURCES.includes(sourceRaw as RadarSource)
    ? (sourceRaw as RadarSource)
    : undefined
  const salePrice = salePriceRaw ? Number(salePriceRaw) : undefined
  const announcedPrice = announcedPriceRaw ? Number(announcedPriceRaw) : undefined

  const hasPrefill = Boolean(
    name || sku || brand || source || salePrice || missionId || url || announcedPrice,
  )
  const prefill: RadarPrefill | undefined = hasPrefill
    ? {
        name,
        sku,
        brand,
        source,
        salePrice: Number.isFinite(salePrice) ? salePrice : undefined,
        missionId,
        url,
        announcedPrice: Number.isFinite(announcedPrice) ? announcedPrice : undefined,
      }
    : undefined

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={missionId ? `/caca/${missionId}` : "/radar"}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {missionId ? "Voltar à missão" : "Radar JK"}
      </Link>
      <PageHeader
        title="Nova oportunidade"
        subtitle="Cole os dados do anúncio. O radar calcula o resultado estimado, a margem e a classificação automaticamente."
      />
      <RadarForm prefill={prefill} />
    </div>
  )
}
