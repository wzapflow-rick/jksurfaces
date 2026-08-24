import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { RadarForm } from "@/components/radar/radar-form"

export const dynamic = "force-dynamic"

export default function CacarOportunidadePage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/radar"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Radar JK
      </Link>
      <PageHeader
        title="Caçar oportunidade"
        subtitle="Informe o preço encontrado e o preço de venda JK. O radar diz na hora quanto você pode pagar, quanto sobra e se vale a pena caçar."
      />
      <RadarForm variant="hunt" />
    </div>
  )
}
