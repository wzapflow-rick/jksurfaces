import { Globe, Store, Truck, Package } from "lucide-react"
import type { HuntSourceType } from "@/types"

const ICONS = {
  MARKETPLACE: Globe,
  LOJA_FISICA: Store,
  FORNECEDOR: Truck,
  OUTRO: Package,
} as const

export function HuntSourceTypeIcon({
  type,
  className,
}: {
  type: HuntSourceType
  className?: string
}) {
  const Icon = ICONS[type] ?? Package
  return <Icon className={className} aria-hidden="true" />
}
