import { normalizeText } from "@/lib/calculations/offer-matching"
import {
  parseBrlPrice,
  parseLotQuantity,
  unitPrice,
  type OlxLotInfo,
} from "./olx-parsers"

/**
 * PARSER DE IMPORTAÇÃO INTELIGENTE DE ANÚNCIOS OLX — Fase 6.3.
 *
 * Transforma um anúncio encontrado manualmente (URL, texto colado ou campos
 * digitados) em uma oferta estruturada. É 100% DETERMINÍSTICO, LOCAL e SEM
 * REDE: não usa IA, não faz chamadas externas para interpretar texto, não
 * acessa a OLX e nunca contorna proteções (Cloudflare, CAPTCHA, autenticação).
 *
 * Reutiliza os parsers puros da Fase 6.2 (`olx-parsers.ts`) para preço BRL,
 * detecção de lote e preço unitário, adicionando o que a importação exige:
 * marca, SKU, EAN, condição (com detecção de CONFLITO), localização em texto
 * livre e preço negociável. Nunca inventa dados: o que não for identificado
 * fica `null`.
 */

/** Condição normalizada exigida pela Fase 6.3. */
export type ImportCondition = "NEW" | "USED" | "UNKNOWN"

/** Origem de cada campo, para a tela de revisão humana. */
export type FieldOrigin = "EXTRACTED" | "MANUAL" | "NOT_FOUND"

/** Confiança da quantidade detectada. */
export type QuantityConfidence = "HIGH" | "LOW"

/** Localização extraída (cidade/UF), com rótulo "Cidade/UF". */
export interface ImportLocation {
  city: string | null
  state: string | null
  label: string | null
}

/** Resultado determinístico da análise de um anúncio. */
export interface OlxImportParseResult {
  productTitle: string | null
  brand: string | null
  sku: string | null
  ean: string | null
  /** Preço TOTAL anunciado (o do lote, quando for lote). */
  totalPrice: number | null
  quantity: number
  /** DETECTED = veio do texto; DEFAULT = 1 assumido por falta de dado. */
  quantitySource: "DETECTED" | "DEFAULT"
  quantityConfidence: QuantityConfidence
  isLot: boolean
  lotConfidence: "HIGH" | "LOW" | "NONE"
  /** Preço por unidade (total / quantidade). */
  unitPrice: number | null
  condition: ImportCondition
  /** true quando há sinais conflitantes de condição (ex.: "novo" + "instalado"). */
  conditionConflict: boolean
  location: ImportLocation
  priceNegotiable: boolean
  /** Quais campos foram efetivamente EXTRAÍDOS do texto (para marcar a origem). */
  found: {
    productTitle: boolean
    brand: boolean
    sku: boolean
    ean: boolean
    price: boolean
    quantity: boolean
    condition: boolean
    location: boolean
  }
}

/* ---------------------------------------------------------------------------
   URL
   -------------------------------------------------------------------------- */

/** Identifica se uma URL é da OLX (qualquer subdomínio olx.com.br / olx.com). */
export function isOlxUrl(input: string | null | undefined): boolean {
  if (!input) return false
  try {
    const host = new URL(input.trim()).hostname.toLowerCase()
    return host === "olx.com.br" || host.endsWith(".olx.com.br") || host.endsWith(".olx.com")
  } catch {
    return false
  }
}

/**
 * Extrai um texto legível do "slug" de uma URL (ex.:
 * ".../torneira-deca-1176-c-nova-1234" -> "torneira deca 1176 c nova"). Usado
 * apenas como dica quando não há texto colado. Nunca acessa a rede.
 */
export function textFromUrlSlug(input: string | null | undefined): string {
  if (!input) return ""
  try {
    const path = new URL(input.trim()).pathname
    const last = path.split("/").filter(Boolean).pop() ?? ""
    return last
      .replace(/\.[a-z0-9]+$/i, "") // remove extensão eventual
      .replace(/[-_]+/g, " ")
      .replace(/\b\d{6,}\b/g, " ") // remove o id numérico longo do anúncio
      .replace(/\s+/g, " ")
      .trim()
  } catch {
    return ""
  }
}

/* ---------------------------------------------------------------------------
   PREÇO (ancorado em "R$" / "reais" / linha numérica isolada)
   -------------------------------------------------------------------------- */

/**
 * Extrai o preço TOTAL anunciado de um texto livre. Diferente de
 * `parseBrlPrice` (que lê o primeiro número de uma string), aqui ancoramos em
 * "R$" ou "reais" ou em uma linha que seja só um valor, para NUNCA confundir um
 * SKU/modelo ("1176.C") com o preço.
 */
export function extractPrice(text: string | null | undefined): number | null {
  if (!text) return null

  // 1) "R$ 1.500,00" / "R$180" em qualquer posição.
  const brl = text.match(/R\$\s*([\d.\s]*\d(?:,\d{1,2})?)/i)
  if (brl) {
    const value = parseBrlPrice(brl[1])
    if (value !== null) return value
  }

  // 2) "180 reais" / "1.500 reais".
  const reais = text.match(/(\d[\d.\s]*\d|\d)(?:,\d{1,2})?\s*reais\b/i)
  if (reais) {
    const value = parseBrlPrice(reais[0])
    if (value !== null) return value
  }

  // 3) Uma linha que seja SÓ um valor (ex.: "1500" ou "1.500,00").
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (/^R?\$?\s*\d[\d.\s]*(?:,\d{1,2})?\s*$/.test(line)) {
      const value = parseBrlPrice(line)
      if (value !== null) return value
    }
  }

  return null
}

/* ---------------------------------------------------------------------------
   SKU / EAN
   -------------------------------------------------------------------------- */

/**
 * Detecta um SKU no padrão comum de louças/metais ("1176.C", "1877.C33",
 * "1172.C.LNK", "2289.CFD"). Exige dígitos seguidos de um ponto e ao menos uma
 * LETRA, para não capturar preços em formato de milhar ("1.500"). Retorna em
 * maiúsculas, preservando o conteúdo. Nunca inventa SKU.
 */
export function extractSku(text: string | null | undefined): string | null {
  if (!text) return null
  const m = text.match(/\b\d{3,5}\.[A-Za-z]{1,3}[A-Za-z0-9]{0,4}(?:\.[A-Za-z0-9]{1,4})?\b/)
  return m ? m[0].toUpperCase() : null
}

/** Detecta um EAN-13 (13 dígitos isolados). Não infere: só extrai o que existe. */
export function extractEan(text: string | null | undefined): string | null {
  if (!text) return null
  const m = text.match(/(?<!\d)\d{13}(?!\d)/)
  return m ? m[0] : null
}

/* ---------------------------------------------------------------------------
   MARCA
   -------------------------------------------------------------------------- */

/**
 * Lista curada de marcas comuns do segmento (louças, metais, hidráulica). A
 * detecção é por presença no texto (sem acento, minúsculas). A ordem privilegia
 * nomes mais específicos. Nunca inventa marca fora desta lista.
 */
export const KNOWN_BRANDS: string[] = [
  "Deca",
  "Docol",
  "Lorenzetti",
  "Fabrimar",
  "Celite",
  "Incepa",
  "Roca",
  "Hydra",
  "Censi",
  "Meber",
  "Tigre",
  "Amanco",
  "Astra",
  "Blukit",
  "Fani",
  "Perflex",
  "Kohler",
  "Sepal",
  "Crismoe",
  "Esteves",
  "Icasa",
  "Franke",
  "Tramontina",
]

/** Detecta a marca do anúncio a partir da lista curada. */
export function extractBrand(text: string | null | undefined): string | null {
  if (!text) return null
  const t = normalizeText(text)
  for (const brand of KNOWN_BRANDS) {
    const b = normalizeText(brand)
    if (new RegExp(`\\b${b}\\b`).test(t)) return brand
  }
  return null
}

/* ---------------------------------------------------------------------------
   CONDIÇÃO (NEW / USED / UNKNOWN) com detecção de CONFLITO
   -------------------------------------------------------------------------- */

/**
 * Detecta a condição e se há CONFLITO. "nunca usado" conta como NOVO (não como
 * usado). "já instalado" / "com marca de uso" contam como USADO. Se houver
 * sinais dos dois lados, retorna condição UNKNOWN e `conflict = true` para
 * forçar revisão humana — nunca decide sozinho em caso de conflito.
 */
export function detectCondition(text: string | null | undefined): {
  condition: ImportCondition
  conflict: boolean
} {
  if (!text) return { condition: "UNKNOWN", conflict: false }
  // Neutraliza expressões que parecem "usado" mas significam "novo".
  const t = normalizeText(text)
    .replace(/\bnunca\s+usad[oa]s?\b/g, " novo ")
    .replace(/\bsem\s+uso\b/g, " novo ")

  const hasUsed =
    /\b(usad[oa]s?|semi[\s-]?nov[oa]s?|com marca de uso|ja (?:foi )?instalad[oa]s?|instalad[oa]s?|ja usad)/.test(
      t,
    )
  const hasNew = /\b(nov[oa]s?|lacrad[oa]s?|na caixa|zero)\b/.test(t)

  if (hasUsed && hasNew) return { condition: "UNKNOWN", conflict: true }
  if (hasUsed) return { condition: "USED", conflict: false }
  if (hasNew) return { condition: "NEW", conflict: false }
  return { condition: "UNKNOWN", conflict: false }
}

/* ---------------------------------------------------------------------------
   NEGOCIÁVEL
   -------------------------------------------------------------------------- */

/** Detecta indícios de preço negociável. Não altera o preço anunciado. */
export function detectNegotiable(text: string | null | undefined): boolean {
  if (!text) return false
  const t = normalizeText(text)
  return /\b(aceito propostas?|aceito ofertas?|faco desconto|negociav|faco por|podemos negociar|a combinar|aberto a proposta)\b/.test(
    t,
  )
}

/* ---------------------------------------------------------------------------
   LOCALIZAÇÃO em texto livre ("Aracaju SE", "Rio de Janeiro - RJ")
   -------------------------------------------------------------------------- */

const UF_SET = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
])

/**
 * Extrai cidade/UF de um texto livre. Aceita "Cidade - UF", "Cidade, UF" e
 * "Cidade UF" (só espaço) — este último é a forma mais comum em anúncios. Só
 * aceita a UF no FIM de uma linha, precedida de um nome de cidade plausível
 * (letras, sem dígitos), para não capturar palavras de duas letras soltas.
 * Rótulo no formato "Cidade/UF".
 */
export function extractLocation(text: string | null | undefined): ImportLocation {
  const empty: ImportLocation = { city: null, state: null, label: null }
  if (!text) return empty

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const m = line.match(/^(.+?)[\s,\-]+([A-Za-z]{2})$/)
    if (!m) continue
    const state = m[2].toUpperCase()
    if (!UF_SET.has(state)) continue
    const city = m[1].replace(/\s+/g, " ").trim()
    // Cidade plausível: sem dígitos, sem "R$", tamanho razoável.
    if (!city || /\d|r\$/i.test(city) || city.length > 60) continue
    return { city, state, label: `${city}/${state}` }
  }
  return empty
}

/* ---------------------------------------------------------------------------
   TÍTULO
   -------------------------------------------------------------------------- */

/** Usa a primeira linha não vazia como título do produto. */
function extractTitle(text: string | null | undefined): string | null {
  if (!text) return null
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line) return line
  }
  return null
}

/** Confiança/rótulo do lote a partir de como a quantidade foi detectada. */
function lotConfidenceFrom(lot: OlxLotInfo): "HIGH" | "LOW" | "NONE" {
  switch (lot.detectedBy) {
    case "NENHUM":
      return "NONE"
    case "MULTIPLICADOR":
      return "LOW"
    default:
      return "HIGH"
  }
}

/* ---------------------------------------------------------------------------
   PARSER PRINCIPAL
   -------------------------------------------------------------------------- */

/**
 * Analisa um texto de anúncio (e, opcionalmente, uma URL para dica de slug) e
 * devolve todos os campos estruturados de forma determinística. Não inventa
 * nada: campos ausentes ficam `null` (ou 1/DEFAULT para quantidade).
 */
export function parseOlxListingText(
  rawText: string | null | undefined,
  urlHint?: string | null,
): OlxImportParseResult {
  const slug = textFromUrlSlug(urlHint)
  // Título/marca/sku também podem vir do slug quando não há texto colado.
  const text = (rawText ?? "").trim()
  const combined = text || slug

  const title = extractTitle(text) ?? (slug ? slug : null)
  const brand = extractBrand(combined)
  const sku = extractSku(combined)
  const ean = extractEan(combined)
  const totalPrice = extractPrice(text)

  const lot = parseLotQuantity(combined)
  const quantitySource = lot.detectedBy === "NENHUM" ? "DEFAULT" : "DETECTED"
  const lotConfidence = lotConfidenceFrom(lot)
  const quantityConfidence: QuantityConfidence = lotConfidence === "HIGH" ? "HIGH" : "LOW"
  const unit = totalPrice !== null ? unitPrice(totalPrice, lot) : null

  const { condition, conflict } = detectCondition(combined)
  const location = extractLocation(text)
  const priceNegotiable = detectNegotiable(combined)

  return {
    productTitle: title,
    brand,
    sku,
    ean,
    totalPrice,
    quantity: lot.quantity,
    quantitySource,
    quantityConfidence,
    isLot: lot.quantity > 1,
    lotConfidence,
    unitPrice: unit,
    condition,
    conditionConflict: conflict,
    location,
    priceNegotiable,
    found: {
      productTitle: Boolean(title),
      brand: Boolean(brand),
      sku: Boolean(sku),
      ean: Boolean(ean),
      price: totalPrice !== null,
      quantity: quantitySource === "DETECTED",
      condition: condition !== "UNKNOWN",
      location: Boolean(location.label),
    },
  }
}

/** Rótulo amigável para a condição. */
export const CONDITION_LABEL: Record<ImportCondition, string> = {
  NEW: "Novo",
  USED: "Usado",
  UNKNOWN: "Não identificada",
}
