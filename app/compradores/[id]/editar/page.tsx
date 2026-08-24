import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { repo } from "@/lib/services/repository"
import { PageHeader } from "@/components/layout/page-header"
import { BuyerForm } from "@/components/buyers/buyer-form"

export const dynamic = "force-dynamic"

export default async function EditarCompradorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const buyer = await repo.getBuyer(id)
  if (!buyer) notFound()

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/compradores/${buyer.id}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {buyer.name}
      </Link>
      <PageHeader title="Editar comprador" subtitle={buyer.company ?? undefined} />
      <BuyerForm buyer={buyer} />
    </div>
  )
}
