import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getHuntSources } from "@/lib/services/hunt-service"
import { PageHeader } from "@/components/layout/page-header"
import { HuntSourcesManager } from "@/components/hunt/hunt-sources-manager"

export const dynamic = "force-dynamic"

export default async function FontesCacaPage() {
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
        title="Fontes de caça"
        subtitle="Onde a JK procura produtos. Fontes com template de busca geram links automáticos por missão."
      />
      <HuntSourcesManager sources={sources} />
    </div>
  )
}
