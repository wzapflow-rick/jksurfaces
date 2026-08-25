import Link from "next/link"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Botão "Importar anúncio" — atalho reutilizável para a importação inteligente
 * (Fase 6.3). Aceita um `prefill` opcional (vindo de uma missão de caça) que é
 * repassado como query params para pré-preencher a tela de importação.
 */
export function ImportAdButton({
  prefill,
  variant = "default",
  size = "sm",
  label = "Importar anúncio",
}: {
  prefill?: Record<string, string | number | null | undefined>
  variant?: "default" | "secondary" | "ghost"
  size?: "sm" | "default"
  label?: string
}) {
  const params = new URLSearchParams()
  if (prefill) {
    for (const [key, value] of Object.entries(prefill)) {
      if (value !== null && value !== undefined && value !== "") params.set(key, String(value))
    }
  }
  const qs = params.toString()
  const href = qs ? `/ofertas/importar?${qs}` : "/ofertas/importar"

  return (
    <Link href={href}>
      <Button variant={variant} size={size}>
        <Download className="h-4 w-4" />
        {label}
      </Button>
    </Link>
  )
}
