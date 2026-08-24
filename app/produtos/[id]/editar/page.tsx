import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { repo } from "@/lib/services/repository"
import { PageHeader } from "@/components/layout/page-header"
import { ProductForm } from "@/components/products/product-form"

export const dynamic = "force-dynamic"

export default async function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product, settings] = await Promise.all([repo.getProduct(id), repo.getSettings()])
  if (!product) notFound()

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/produtos/${product.id}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {product.name}
      </Link>
      <PageHeader title="Editar produto" subtitle={`SKU ${product.sku}`} />
      <ProductForm product={product} settings={settings} />
    </div>
  )
}
