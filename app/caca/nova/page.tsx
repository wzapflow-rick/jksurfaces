import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getHuntSources } from "@/lib/services/hunt-service"
import { PageHeader } from "@/components/layout/page-header"
import { HuntMissionForm } from "@/components/hunt/hunt-mission-form"

export const dynamic = "force-dynamic"

export default async function NovaMissaoPage() {
  const sources = await getHuntSources()

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/caca"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Central de Caça
      </Link>
      <PageHeader
        title="Nova missão de caça"
        subtitle="Defina o produto, o preço de venda esperado e as fontes. Calculamos até quanto pagar."
      />
      <HuntMissionForm sources={sources} />
    </div>
  )
}
