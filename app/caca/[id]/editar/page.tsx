import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { repo } from "@/lib/services/repository"
import { getHuntSources } from "@/lib/services/hunt-service"
import { PageHeader } from "@/components/layout/page-header"
import { HuntMissionForm } from "@/components/hunt/hunt-mission-form"

export const dynamic = "force-dynamic"

export default async function EditarMissaoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [mission, sources] = await Promise.all([repo.getHuntMission(id), getHuntSources()])
  if (!mission) notFound()

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/caca/${mission.id}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {mission.name}
      </Link>
      <PageHeader title="Editar missão" subtitle={mission.name} />
      <HuntMissionForm mission={mission} sources={sources} />
    </div>
  )
}
