import Link from "next/link"
import { Plus, Users, Mail, Phone, ArrowUpRight } from "lucide-react"
import { repo } from "@/lib/services/repository"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function CompradoresPage() {
  const buyers = await repo.listBuyers()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Compradores"
        subtitle="Quem compra da JK e o que cada um procura. Base para conectar oportunidades a demanda real."
        actions={
          <Link href="/compradores/novo">
            <Button>
              <Plus className="h-4 w-4" />
              Novo comprador
            </Button>
          </Link>
        }
      />

      {buyers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Nenhum comprador cadastrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre seus compradores para vincular produtos e alvos de preço.
            </p>
          </div>
          <Link href="/compradores/novo">
            <Button variant="secondary" size="sm">
              <Plus className="h-4 w-4" />
              Cadastrar comprador
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {buyers.map((b) => (
            <Link
              key={b.id}
              href={`/compradores/${b.id}`}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-border-strong"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{b.name}</p>
                  {b.company ? <p className="truncate text-xs text-muted-foreground">{b.company}</p> : null}
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              </div>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {b.email ? (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{b.email}</span>
                  </span>
                ) : null}
                {b.phone ? (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {b.phone}
                  </span>
                ) : null}
              </div>
              <span
                className={`w-fit rounded-md px-2 py-0.5 text-[11px] ${
                  b.active ? "bg-status-go/10 text-status-go" : "bg-muted text-muted-foreground"
                }`}
              >
                {b.active ? "Ativo" : "Inativo"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
