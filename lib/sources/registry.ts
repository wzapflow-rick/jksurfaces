import type { OfferSource } from "@/types"
import type { SourceAdapter } from "./types"
import { chatubaAdapter } from "./chatuba-adapter"

/**
 * REGISTRO DE FONTES — Fase 6.1.
 *
 * Ponto único que conhece os adapters disponíveis. Adicionar uma fonte no
 * futuro (Mercado Livre, OLX…) é registrar aqui — nada mais no Radar muda.
 * Nesta fase apenas a Chatuba está registrada.
 */
const ADAPTERS: Record<OfferSource, SourceAdapter> = {
  CHATUBA: chatubaAdapter,
}

/** Retorna o adapter de uma fonte, ou null se não registrada. */
export function getSourceAdapter(key: string): SourceAdapter | null {
  return (ADAPTERS as Record<string, SourceAdapter>)[key] ?? null
}

/** Lista todos os adapters registrados. */
export function listSourceAdapters(): SourceAdapter[] {
  return Object.values(ADAPTERS)
}
