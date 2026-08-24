import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Pencil, Mail, Phone, Building2 } from "lucide-react"
import { repo } from "@/lib/services/repository"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { BuyerProducts } from "@/components/buyers/buyer-products"

export const dynamic = "force-dynamic"

export default async function CompradorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [buyer, links, products] = await Promise.all([
    repo.getBuyer(id),
    repo.listBuyerProducts(id),
    repo.listProducts(),
  ])
  if (!buyer) notFound()

  const productById = new Map(products.map((p) => [p.id, p]))
  const linked = links.map((link) => ({ link, product: productById.get(link.productId) }))
  const linkedIds = new Set(links.map((l) => l.productId))
  const availableProducts = products.filter((p) => !linkedIds.has(p.id))

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/compradores"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Compradores
      </Link>

      <PageHeader
        title={buyer.name}
        actions={
          <Link href={`/compradores/${buyer.id}/editar`}>
            <Button variant="secondary" size="sm">
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {buyer.company ? (
          <span className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            {buyer.company}
          </span>
        ) : null}
        {buyer.email ? (
          <a href={`mailto:${buyer.email}`} className="flex items-center gap-1.5 hover:text-foreground">
            <Mail className="h-4 w-4" />
            {buyer.email}
          </a>
        ) : null}
        {buyer.phone ? (
          <span className="flex items-center gap-1.5">
            <Phone className="h-4 w-4" />
            {buyer.phone}
          </span>
        ) : null}
        <span
          className={`rounded-md px-2 py-0.5 text-xs ${
            buyer.active ? "bg-status-go/10 text-status-go" : "bg-muted text-foreground"
          }`}
        >
          {buyer.active ? "Ativo" : "Inativo"}
        </span>
      </div>

      {buyer.notes ? (
        <p className="whitespace-pre-wrap rounded-xl border border-border bg-card p-4 text-sm">{buyer.notes}</p>
      ) : null}

      <BuyerProducts buyerId={buyer.id} linked={linked} availableProducts={availableProducts} />
    </div>
  )
}
