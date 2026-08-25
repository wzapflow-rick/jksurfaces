import type {
  NormalizedOffer,
  OfferIdentity,
  SourceAdapter,
  SourceSearchOptions,
} from "./types"
import { SourceError } from "./types"
import {
  parseBrlPrice,
  parseCondition,
  parseLocation,
  parseLotQuantity,
  unitPrice,
} from "./olx-parsers"

/**
 * OLX ADAPTER — Fase 6.2.
 *
 * =============================================================================
 * DIAGNÓSTICO TÉCNICO (auditoria feita nesta fase, resultados reais):
 *
 *   | Alvo                                   | Resultado                        |
 *   |----------------------------------------|----------------------------------|
 *   | https://www.olx.com.br/ (home)         | HTTP 403 — server: cloudflare    |
 *   | https://www.olx.com.br/brasil?q=...    | HTTP 403 — Cloudflare            |
 *   | https://www.olx.com.br/robots.txt      | HTTP 403 — "you have been blocked"|
 *   | https://apigw.olx.com.br/              | HTTP 403 — Cloudflare            |
 *   | API oficial (developers.olx.com.br)    | só gerencia os PRÓPRIOS anúncios |
 *
 * Ou seja: todo o conteúdo público da OLX está protegido por Cloudflare Bot
 * Management, que responde 403 a qualquer cliente automatizado, e não existe
 * API pública de BUSCA de anúncios de terceiros (a API oficial, com OAuth e
 * plano empresarial, serve apenas para publicar/gerenciar os anúncios da
 * própria conta).
 *
 * DECISÃO (regra principal da Fase 6.2):
 *   Não há forma técnica e legalmente apropriada de capturar automaticamente.
 *   A ÚNICA maneira de acessar seria CONTORNAR o Cloudflare (headless com
 *   evasão, resolução de challenge, rotação de IP…), o que é EXPRESSAMENTE
 *   PROIBIDO pela especificação. Portanto NÃO implementamos captura ao vivo e
 *   NÃO criamos nenhum mecanismo de contorno.
 *
 * O adapter existe (a arquitetura o exige e o Registry o expõe) e implementa o
 * contrato completo, mas DEGRADA COM ELEGÂNCIA: `search`/`getOffer` lançam um
 * SourceError("UNAVAILABLE") com mensagem clara, que o serviço de captura já
 * trata sem derrubar a aplicação. Toda a lógica determinística (preço unitário,
 * lote, condição, localização, identidade) está pronta em olx-parsers.ts e é
 * usada por `normalize`/`identifyProduct`, de modo que, no dia em que houver um
 * canal público apropriado, basta implementar o fetch em UM ponto.
 * =============================================================================
 */

const SOURCE = "OLX" as const

/** Mensagem única de indisponibilidade — honesta sobre o motivo. */
const UNAVAILABLE_MESSAGE =
  "Captura da OLX indisponível: o site público está protegido por Cloudflare " +
  "(bloqueio a acesso automatizado) e não há API pública de busca. Não é " +
  "possível capturar sem contornar essa proteção, o que não fazemos."

/**
 * Formato mínimo de um anúncio da OLX que `normalize` sabe interpretar, CASO um
 * dia chegue por um canal legítimo. Não representa nenhum endpoint real ativo.
 */
export interface OlxRawListing {
  listId?: string | number
  subject?: string
  body?: string
  priceText?: string
  url?: string
  thumbnail?: string
  locationText?: string
  brand?: string
}

/**
 * Converte um anúncio bruto da OLX em `NormalizedOffer`, aplicando os parsers
 * determinísticos: preço BRL, detecção de lote -> PREÇO UNITÁRIO (o preço usado
 * pelo motor financeiro), condição e localização. Exportada para teste.
 *
 * O `price` da oferta normalizada é sempre UNITÁRIO — é o que o motor JK compara
 * com o preço de venda. A quantidade do lote e o preço total ficam em rawData
 * para auditoria.
 */
export function normalizeOlxListing(raw: unknown): NormalizedOffer | null {
  if (!raw || typeof raw !== "object") return null
  const l = raw as OlxRawListing

  const title = (l.subject ?? "").trim()
  if (!title) return null

  const totalPrice = parseBrlPrice(l.priceText)
  // Sem preço público reconhecível não há oferta analisável.
  if (totalPrice === null) return null

  // Lote é detectado do título + corpo; o preço unitário é o que interessa.
  const lotText = `${title} ${l.body ?? ""}`
  const lot = parseLotQuantity(lotText)
  const unit = unitPrice(totalPrice, lot)

  const condition = parseCondition(lotText)
  const location = parseLocation(l.locationText)
  const url = (l.url ?? "").trim() || `https://www.olx.com.br/`

  return {
    source: SOURCE,
    externalId: l.listId != null ? String(l.listId) : null,
    productTitle: title,
    // OLX não expõe SKU/EAN estruturado em anúncios de terceiros.
    sku: null,
    ean: null,
    brand: l.brand?.trim() || null,
    url,
    imageUrl: l.thumbnail?.trim() || null,
    // PREÇO UNITÁRIO — nunca o total do lote.
    price: unit,
    shipping: null,
    availability: lot.quantity,
    seller: null,
    capturedAt: new Date().toISOString(),
    rawData: {
      totalPrice,
      unitPrice: unit,
      lotQuantity: lot.quantity,
      lotDetectedBy: lot.detectedBy,
      condition,
      city: location.city,
      state: location.state,
    },
  }
}

export const olxAdapter: SourceAdapter = {
  key: SOURCE,
  label: "OLX",

  /**
   * Captura ao vivo INDISPONÍVEL por decisão técnica/ética (ver cabeçalho).
   * Degrada com elegância: erro tipado e claro, sem tentar contornar nada.
   */
  async search(_query: string, _options?: SourceSearchOptions): Promise<NormalizedOffer[]> {
    throw new SourceError("UNAVAILABLE", UNAVAILABLE_MESSAGE)
  },

  /** Interpreta um anúncio bruto (determinístico, sem rede). */
  normalize(raw) {
    return normalizeOlxListing(raw)
  },

  identifyProduct(offer): OfferIdentity {
    return {
      sku: offer.sku,
      ean: offer.ean,
      brand: offer.brand,
      productTitle: offer.productTitle,
    }
  },

  /** Também indisponível ao vivo, pelo mesmo motivo. */
  async getOffer(_externalId: string, _options?: SourceSearchOptions): Promise<NormalizedOffer | null> {
    throw new SourceError("UNAVAILABLE", UNAVAILABLE_MESSAGE)
  },
}
