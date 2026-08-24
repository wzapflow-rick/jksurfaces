import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { repo } from "@/lib/services/repository"
import { PageHeader } from "@/components/layout/page-header"
import { RadarForm } from "@/components/radar/radar-form"

export const dynamic = "force-dynamic"

export default async function EditarOportunidadePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const opportunity = await repo.getRadarOpportunity(id)
  if (!opportunity) notFound()

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/radar"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Radar JK
      </Link>
      <PageHeader title="Editar oportunidade" subtitle={opportunity.name} />
      <RadarForm opportunity={opportunity} />
    </div>
  )
}
