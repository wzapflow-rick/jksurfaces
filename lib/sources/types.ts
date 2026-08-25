import type { OfferSource } from "@/types"

/**
 * ARQUITETURA DE FONTES — Fase 6.1.
 *
 * Cada fonte de captura implementa a interface `SourceAdapter`. O Radar e o
 * serviço de captura falam apenas com esta interface, então adicionar uma nova
 * fonte no futuro (Mercado Livre, OLX…) é registrar um novo adapter — sem
 * reescrever o Radar, o matching ou a persistência.
 *
 * IMPORTANTE: um adapter só pode usar métodos de acesso a conteúdo PÚBLICO,
 * técnica e legalmente apropriados. Nunca contornar CAPTCHA, autenticação,
 * bloqueios ou áreas privadas. Se uma fonte não oferecer um acesso público
 * apropriado, o adapter deve deixar isso explícito e não criar workarounds.
 */

/** Oferta já normalizada por um adapter, antes de matching/persistência. */
export interface NormalizedOffer {
  source: OfferSource
  externalId: string | null
  productTitle: string
  sku: string | null
  ean: string | null
  brand: string | null
  url: string
  imageUrl: string | null
  price: number
  shipping: number | null
  availability: number | null
  seller: string | null
  capturedAt: string
  /** Resumo mínimo dos campos brutos úteis — nunca a resposta HTML completa. */
  rawData: Record<string, unknown> | null
}

/** Identificadores extraídos de uma oferta, usados pelo matching. */
export interface OfferIdentity {
  sku: string | null
  ean: string | null
  brand: string | null
  productTitle: string
}

export interface SourceSearchOptions {
  /** Máximo de ofertas a retornar (o adapter aplica um teto de segurança). */
  limit?: number
  /** Sinal de cancelamento externo (compõe com o timeout interno). */
  signal?: AbortSignal
}

/** Códigos de erro padronizados que qualquer adapter pode lançar. */
export type SourceErrorCode = "TIMEOUT" | "UNAVAILABLE" | "BAD_RESPONSE" | "RATE_LIMITED"

/** Erro tipado de fonte: nunca derruba a aplicação, é tratado pelo serviço. */
export class SourceError extends Error {
  readonly code: SourceErrorCode
  constructor(code: SourceErrorCode, message: string) {
    super(message)
    this.name = "SourceError"
    this.code = code
  }
}

/**
 * Contrato comum de uma fonte de captura. Os quatro métodos conceituais da
 * especificação estão presentes:
 *  - search() ............ busca ofertas públicas a partir de uma consulta;
 *  - normalize() ......... converte um item bruto no formato interno comum;
 *  - identifyProduct() ... extrai SKU/EAN/marca de uma oferta (para o match);
 *  - getOffer() .......... recupera uma oferta específica pelo id externo.
 */
export interface SourceAdapter {
  readonly key: OfferSource
  readonly label: string
  search(query: string, options?: SourceSearchOptions): Promise<NormalizedOffer[]>
  normalize(raw: unknown): NormalizedOffer | null
  identifyProduct(offer: NormalizedOffer): OfferIdentity
  getOffer(externalId: string, options?: SourceSearchOptions): Promise<NormalizedOffer | null>
}
