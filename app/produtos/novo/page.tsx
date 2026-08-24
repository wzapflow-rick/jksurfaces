import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { repo } from "@/lib/services/repository"
import { PageHeader } from "@/components/layout/page-header"
import { ProductForm } from "@/components/products/product-form"

export const dynamic = "force-dynamic"

export default async function NovoProdutoPage() {
  const settings = await repo.getSettings()

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/produtos"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Produtos
      </Link>
      <PageHeader title="Novo produto" subtitle="Cadastre um produto para o radar acompanhar." />
      <ProductForm settings={settings} />
    </div>
  )
}
