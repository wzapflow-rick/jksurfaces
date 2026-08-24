import Link from "next/link"
import { Plus } from "lucide-react"
import { getProductsWithMetrics } from "@/lib/services/radar-service"
import { PageHeader } from "@/components/layout/page-header"
import { ProductsTable } from "@/components/products/products-table"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function ProdutosPage() {
  const products = await getProductsWithMetrics()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Produtos"
        subtitle="Catálogo monitorado pelo radar. Cada linha mostra o custo máximo permitido pela regra financeira e onde vale a pena comprar."
        actions={
          <Link href="/produtos/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo produto
            </Button>
          </Link>
        }
      />
      <ProductsTable products={products} />
    </div>
  )
}
