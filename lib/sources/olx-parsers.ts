import { normalizeText } from "@/lib/calculations/offer-matching"

/**
 * PARSERS DETERMINÍSTICOS DA OLX — Fase 6.2.
 *
 * Este módulo é PURO: só transforma texto em dados estruturados, sem rede e sem
 * efeitos colaterais. Ele existe separado do adapter para poder ser testado de
 * forma determinística e para ficar pronto no dia em que a captura da OLX for
 * viável por um meio público e apropriado.
 *
 * IMPORTANTE (ver olx-adapter.ts): a captura ao vivo da OLX NÃO está disponível
 * porque o site público está atrás do Cloudflare Bot Management. Estes parsers
 * NÃO acessam a OLX; apenas interpretam textos de anúncios (título, preço,
 * descrição, localização) caso um dia cheguem por um canal legítimo.
 *
 * Particularidades de anúncios da OLX que estes parsers tratam:
 *  - preço em formato brasileiro ("R$ 1.234,56");
 *  - anúncios de LOTE ("kit com 10", "caixa com 12 un", "10 peças") — deriva o
 *    preço UNITÁRIO, essencial para o motor financeiro comparar com o preço JK;
 *  - condição (novo / usado);
 *  - localização (cidade - UF).
 */

/** Condição do item anunciado. */
export type OlxCondition = "NOVO" | "USADO" | "DESCONHECIDO"

/** Resultado da análise de lote de um anúncio. */
export interface OlxLotInfo {
  /** Quantidade de unidades no anúncio (>= 1). 1 = unidade avulsa. */
  quantity: number
  /** Como a quantidade foi detectada (para auditoria/explicação). */
  detectedBy: "KIT" | "CAIXA" | "PECAS" | "UNIDADES" | "MULTIPLICADOR" | "NENHUM"
}

/** Localização extraída de um anúncio. */
export interface OlxLocation {
  city: string | null
  state: string | null
  /** Texto normalizado "Cidade - UF" quando ambos existem. */
  label: string | null
}

/* ---------------------------------------------------------------------------
   PREÇO
   -------------------------------------------------------------------------- */

/**
 * Converte um preço em texto no formato brasileiro para número.
 * Aceita "R$ 1.234,56", "1234,56", "R$ 90", "1.200". Retorna null se não houver
 * um valor monetário reconhecível ou se for não positivo.
 */
export function parseBrlPrice(input: string | null | undefined): number | null {
  if (!input) return null
  // Isola o primeiro trecho que pareça um número (com pontos/vírgulas).
  const match = input.match(/\d[\d.\s]*(?:,\d{1,2})?/)
  if (!match) return null
  let raw = match[0].replace(/\s/g, "")

  const hasComma = raw.includes(",")
  const hasDot = raw.includes(".")

  if (hasComma) {
    // Vírgula é o separador decimal brasileiro; pontos são milhar.
    raw = raw.replace(/\./g, "").replace(",", ".")
  } else if (hasDot) {
    // Sem vírgula: um ponto pode ser milhar ("1.200") ou decimal ("90.5").
    const parts = raw.split(".")
    const last = parts[parts.length - 1]
    // "1.200" / "1.234.567" -> milhar (último grupo com 3 dígitos e há grupos antes).
    if (parts.length > 1 && last.length === 3) {
      raw = parts.join("")
    }
    // senão mantém como decimal ("90.5").
  }

  const value = Number.parseFloat(raw)
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.round(value * 100) / 100
}

/* ---------------------------------------------------------------------------
   LOTE / QUANTIDADE  ->  PREÇO UNITÁRIO
   -------------------------------------------------------------------------- */

/**
 * Detecta a quantidade de unidades de um anúncio a partir do título/descrição.
 * Conservador: na dúvida assume 1 (unidade avulsa) para nunca inflar a
 * atratividade de uma oferta. Só reconhece padrões claros de lote.
 */
export function parseLotQuantity(text: string | null | undefined): OlxLotInfo {
  if (!text) return { quantity: 1, detectedBy: "NENHUM" }
  const t = normalizeText(text)

  // "kit com 10", "kit 10", "kit c/ 10"
  const kit = t.match(/\bkit\s*(?:com|c\/|de)?\s*(\d{1,4})\b/)
  if (kit) return clampLot(Number.parseInt(kit[1], 10), "KIT")

  // "caixa com 12", "cx com 12", "caixa 12 un"
  const caixa = t.match(/\b(?:caixa|cx)\s*(?:com|c\/|de)?\s*(\d{1,4})\b/)
  if (caixa) return clampLot(Number.parseInt(caixa[1], 10), "CAIXA")

  // "10 pecas", "10 peca", "12 pcs"
  const pecas = t.match(/\b(\d{1,4})\s*(?:pecas?|pcs?)\b/)
  if (pecas) return clampLot(Number.parseInt(pecas[1], 10), "PECAS")

  // "10 unidades", "10 un", "10 und", "10 uni"
  const unidades = t.match(/\b(\d{1,4})\s*(?:unidades?|un|und|uni)\b/)
  if (unidades) return clampLot(Number.parseInt(unidades[1], 10), "UNIDADES")

  // "10x", "12 x" (multiplicador explícito)
  const mult = t.match(/\b(\d{1,4})\s*x\b/)
  if (mult) return clampLot(Number.parseInt(mult[1], 10), "MULTIPLICADOR")

  return { quantity: 1, detectedBy: "NENHUM" }
}

/** Limita a quantidade a uma faixa sã (1–1000). Quantidades absurdas viram 1. */
function clampLot(n: number, by: OlxLotInfo["detectedBy"]): OlxLotInfo {
  if (!Number.isFinite(n) || n < 1 || n > 1000) return { quantity: 1, detectedBy: "NENHUM" }
  return { quantity: n, detectedBy: by }
}

/**
 * Calcula o preço unitário a partir do preço total do anúncio e da quantidade
 * do lote. Nunca divide por zero; arredonda em centavos.
 */
export function unitPrice(totalPrice: number, lot: OlxLotInfo): number {
  const qty = lot.quantity >= 1 ? lot.quantity : 1
  return Math.round((totalPrice / qty) * 100) / 100
}

/* ---------------------------------------------------------------------------
   CONDIÇÃO
   -------------------------------------------------------------------------- */

/**
 * Detecta a condição (novo/usado) a partir de texto do anúncio. Conservador:
 * "seminovo", "usado", "com marca de uso" contam como USADO; "novo",
 * "lacrado", "na caixa" contam como NOVO. Sem sinal claro -> DESCONHECIDO.
 */
export function parseCondition(text: string | null | undefined): OlxCondition {
  if (!text) return "DESCONHECIDO"
  const t = normalizeText(text)

  // Sinais de usado têm prioridade (evita "novo" dentro de "seminovo").
  if (/\b(usad[oa]s?|semi[\s-]?nov[oa]s?|seminov[oa]s?|com marca de uso|ja usad)/.test(t)) {
    return "USADO"
  }
  if (/\b(nov[oa]s?|lacrad[oa]s?|na caixa|sem uso|zero)\b/.test(t)) {
    return "NOVO"
  }
  return "DESCONHECIDO"
}

/* ---------------------------------------------------------------------------
   LOCALIZAÇÃO
   -------------------------------------------------------------------------- */

const UF_SET = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
])

/**
 * Extrai cidade/UF de um texto de localização da OLX. Aceita formatos comuns:
 * "Rio de Janeiro - RJ", "São Gonçalo, RJ", "RJ". Retorna campos null quando
 * não reconhece — nunca inventa localização.
 */
export function parseLocation(input: string | null | undefined): OlxLocation {
  const empty: OlxLocation = { city: null, state: null, label: null }
  if (!input) return empty
  const text = input.trim()
  if (!text) return empty

  // "Cidade - UF" ou "Cidade, UF"
  const withUf = text.match(/^(.+?)\s*[-,]\s*([A-Za-z]{2})\s*$/)
  if (withUf) {
    const city = cleanCity(withUf[1])
    const state = withUf[2].toUpperCase()
    if (UF_SET.has(state)) {
      return { city: city || null, state, label: city ? `${city} - ${state}` : state }
    }
  }

  // Só a UF ("RJ").
  const ufOnly = text.toUpperCase().match(/^[A-Z]{2}$/)
  if (ufOnly && UF_SET.has(ufOnly[0])) {
    return { city: null, state: ufOnly[0], label: ufOnly[0] }
  }

  // Só cidade (sem UF reconhecível).
  const city = cleanCity(text)
  return city ? { city, state: null, label: city } : empty
}

/** Limpa e capitaliza um nome de cidade preservando acentos. */
function cleanCity(raw: string): string {
  const c = raw.replace(/\s+/g, " ").trim()
  if (!c || c.length > 60) return ""
  return c
}
