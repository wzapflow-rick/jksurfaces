"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, Users, Crosshair, Settings, Radar, ScanSearch, Target } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/produtos", label: "Produtos", icon: Package },
  { href: "/compradores", label: "Compradores", icon: Users },
  { href: "/oportunidades", label: "Oportunidades", icon: Crosshair },
  { href: "/radar/cacar", label: "Caçar oportunidade", icon: Target },
  { href: "/radar", label: "Radar JK", icon: ScanSearch },
  { href: "/caca", label: "Central de Caça", icon: Target },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 flex h-screen w-16 flex-col border-r border-border bg-surface md:w-60">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-4 md:px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Radar className="h-[18px] w-[18px]" strokeWidth={2.25} />
        </div>
        <div className="hidden min-w-0 md:block">
          <p className="truncate text-sm font-semibold leading-tight">Radar JK</p>
          <p className="truncate text-[11px] text-muted-foreground">Inteligência de aquisição</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2 md:p-3">
        {(() => {
          // Item ativo = prefixo mais específico que casa com a rota atual.
          // Evita que /radar e /radar/cacar fiquem ativos ao mesmo tempo.
          const activeHref = NAV.reduce<string | null>((best, item) => {
            const matches =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            if (!matches) return best
            if (!best || item.href.length > best.length) return item.href
            return best
          }, null)
          return NAV.map((item) => {
          const active = item.href === activeHref
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors md:px-3",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
              title={item.label}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          )
          })
        })()}
      </nav>

      <div className="hidden border-t border-border p-4 md:block">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Fase 4 — Central de Caça. Motor de aquisição da JK.
        </p>
      </div>
    </aside>
  )
}
