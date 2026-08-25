import type { OfferSource } from "@/types"
import type { SourceAdapter } from "./types"
import { chatubaAdapter } from "./chatuba-adapter"
import { olxAdapter } from "./olx-adapter"

/**
 * REGISTRO DE FONTES — Fases 6.1 / 6.2.
 *
 * Ponto único que conhece os adapters disponíveis. Adicionar uma fonte no
 * futuro (Mercado Livre…) é registrar aqui — nada mais no Radar muda.
 *
 *  - CHATUBA: captura real via API pública VTEX (Fase 6.1).
 *  - OLX: registrado (Fase 6.2), mas a captura ao vivo é INDISPONÍVEL — o site
 *    público está atrás do Cloudflare e não há API pública de busca; o adapter
 *    degrada com elegância em vez de contornar a proteção. Ver olx-adapter.ts.
 */
const ADAPTERS: Record<OfferSource, SourceAdapter> = {
  CHATUBA: chatubaAdapter,
  OLX: olxAdapter,
}

/** Fontes cuja captura ao vivo está disponível de fato (para a UI filtrar). */
export const LIVE_CAPTURE_SOURCES: OfferSource[] = ["CHATUBA"]

/** Indica se uma fonte suporta captura ao vivo neste momento. */
export function supportsLiveCapture(key: string): boolean {
  return (LIVE_CAPTURE_SOURCES as string[]).includes(key)
}

/** Retorna o adapter de uma fonte, ou null se não registrada. */
export function getSourceAdapter(key: string): SourceAdapter | null {
  return (ADAPTERS as Record<string, SourceAdapter>)[key] ?? null
}

/** Lista todos os adapters registrados. */
export function listSourceAdapters(): SourceAdapter[] {
  return Object.values(ADAPTERS)
}
