import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { BuyerForm } from "@/components/buyers/buyer-form"

export const dynamic = "force-dynamic"

export default function NovoCompradorPage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/compradores"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Compradores
      </Link>
      <PageHeader title="Novo comprador" subtitle="Cadastre um comprador da JK." />
      <BuyerForm />
    </div>
  )
}
