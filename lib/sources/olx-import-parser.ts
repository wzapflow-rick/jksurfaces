import { normalizeText } from "@/lib/calculations/offer-matching"
import {
  parseBrlPrice,
  parseCondition,
  parseLocation,
  parseLotQuantity,
  unitPrice as computeUnitPrice,
  type OlxLocation,
  type OlxLotInfo,
} from "./olx-parsers"

/**
 * PARSER DE IMPORTAÇÃO DE ANÚNCIOS OLX — Fase 6.3.
 *
 * Módulo PURO e DETERMINÍSTICO: transforma um texto de anúncio (colado pelo
 * usuário) em dados estruturados. Sem rede, sem IA, sem efeitos colaterais —
 * por isso é 100% testável. Reutiliza os parsers determinísticos da Fase 6.2
 * (preço BRL, lote → preço unitário, condição, localização) e acrescenta a
 * extração de produto/marca/SKU/EAN, negociabilidade e detecção de conflitos.
 *
 * REGRA DE OURO: NUNCA inventar dados. Quando um campo não é reconhecível com
 * segurança, o valor fica `null` e a origem é marcada como MISSING para que o
 * usuário saiba que precisa preencher — o sistema jamais "chuta".
 */

/** Condição normalizada do item (padrão interno do Radar). */
export type OfferCondition = "NEW" | "USED" | "UNKNOWN"

/** Nível de confiança de um campo inferido. */
export type Confidence = "HIGH" | "MEDIUM" | "LOW"

/** Origem de um campo, para a revisão humana (seção 14 da spec). */
export type FieldOrigin = "EXTRACTED" | "EDITED" | "MISSING"

/** Resultado determinístico da análise de um anúncio. */
export interface ParsedAd {
  productTitle: string | null
  brand: string | null
  model: string | null
  sku: string | null
  ean: string | null
  /** Preço TOTAL anunciado (o valor exibido no anúncio). */
  price: number | null
  /** Quantidade detectada; 1 quando não há sinal (ver `quantitySource`). */
  quantity: number
  quantitySource: "DETECTED" | "DEFAULT"
  quantityConfidence: Confidence
  isLot: boolean
  /** Preço por unidade = preço total / quantidade (null se não há preço). */
  unitPrice: number | null
  condition: OfferCondition
  /** true quando o texto tem sinais conflitantes de condição (novo + usado). */
  conditionConflict: boolean
  location: OlxLocation
  priceNegotiable: boolean
  url: string | null
  /** Origem de cada campo, para exibir ✓ / ✎ / ⚠ na revisão. */
  origins: Record<string, FieldOrigin>
  /** Mensagens de conflito/ambiguidade para revisão humana. */
  conflicts: string[]
}

/* ---------------------------------------------------------------------------
   URL
   -------------------------------------------------------------------------- */

/** Reconhece uma URL de anúncio da OLX (qualquer subdomínio olx.com.br). */
export function isOlxUrl(input: string | null | undefined): boolean {
  if (!input) return false
  try {
    const u = new URL(input.trim())
    return /(^|\.)olx\.com\.br$/i.test(u.hostname)
  } catch {
    return false
  }
}

/** Normaliza e valida uma URL http(s); retorna null se inválida. */
export function cleanUrl(input: string | null | undefined): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (!trimmed) return null
  try {
    const u = new URL(trimmed)
    if (u.protocol !== "http:" && u.protocol !== "https:") return null
    return u.toString()
  } catch {
    return null
  }
}

/* ---------------------------------------------------------------------------
   MARCA / MODELO / PRODUTO
   -------------------------------------------------------------------------- */

/**
 * Marcas conhecidas do universo de material de construção/hidráulico em que a
 * JK opera. Lista de reconhecimento (não é matching de produto). Ordena das
 * mais específicas para as mais genéricas para evitar colisões.
 */
const KNOWN_BRANDS = [
  "Deca", "Docol", "Lorenzetti", "Fabrimar", "Celite", "Incepa", "Roca",
  "Censi", "Astra", "Tigre", "Amanco", "Blukit", "Hidra", "Meber", "Perflex",
  "Kohler", "Hansgrohe", "Esteta", "Cardinali", "Krona", "Tramontina",
]

/** Extrai a primeira marca conhecida citada no texto. Não inventa marca. */
export function parseBrand(text: string | null | undefined): string | null {
  if (!text) return null
  const t = normalizeText(text)
  for (const brand of KNOWN_BRANDS) {
    const b = normalizeText(brand)
    if (new RegExp(`\\b${escapeRegExp(b)}\\b`).test(t)) return brand
  }
  return null
}

/**
 * Extrai um "modelo" (token com dígitos, como "1176.C" ou "C50"). Usado como
 * apoio ao matching por marca+modelo. Retorna o primeiro token plausível.
 */
export function parseModel(text: string | null | undefined): string | null {
  if (!text) return null
  const sku = parseSku(text)
  if (sku) return sku
  const m = text.match(/\b[A-Za-z]?\d{2,5}(?:[.\-/][A-Za-z0-9]{1,4})*\b/)
  return m ? m[0].toUpperCase() : null
}

/* ---------------------------------------------------------------------------
   SKU / EAN
   -------------------------------------------------------------------------- */

/**
 * Extrai um SKU quando há um padrão claro. Prioriza rótulos explícitos
 * ("SKU/código/ref/modelo: X") e depois o padrão Deca/hidráulica
 * ("1176.C", "4916.GD.CR"). NUNCA inventa: sem padrão reconhecível, null.
 */
export function parseSku(text: string | null | undefined): string | null {
  if (!text) return null

  // 1) Rótulo explícito.
  const labeled = text.match(
    /\b(?:sku|c[oó]d(?:igo)?|ref(?:er[eê]ncia)?|modelo)\s*[:#]?\s*([A-Za-z0-9][A-Za-z0-9.\-/]{2,})/i,
  )
  if (labeled) {
    const candidate = labeled[1].replace(/[.\-/]+$/, "")
    if (/[0-9]/.test(candidate)) return candidate.toUpperCase()
  }

  // 2) Padrão Deca/hidráulica: dígitos + ponto + letras (ex.: 1176.C, 4916.GD.CR).
  const deca = text.match(/\b\d{3,5}\.[A-Za-z]{1,3}(?:\.[A-Za-z0-9]{1,4})*\b/)
  if (deca) return deca[0].toUpperCase()

  return null
}

/**
 * Extrai um EAN (código de barras) só quando há 13 dígitos isolados (EAN-13)
 * ou 8 dígitos (EAN-8) rotulados. Conservador para não confundir com telefone,
 * CEP ou preço. NUNCA infere EAN.
 */
export function parseEan(text: string | null | undefined): string | null {
  if (!text) return null

  // Rótulo explícito de código de barras/EAN (aceita 8 ou 13 dígitos).
  const labeled = text.match(/\b(?:ean|gtin|c[oó]digo de barras)\s*[:#]?\s*(\d{8}|\d{12,13})\b/i)
  if (labeled) return labeled[1]

  // EAN-13 isolado (não faz parte de um número maior).
  const ean13 = text.match(/(?<!\d)(\d{13})(?!\d)/)
  if (ean13) return ean13[1]

  return null
}

/* ---------------------------------------------------------------------------
   NEGOCIÁVEL
   -------------------------------------------------------------------------- */

const NEGOTIABLE_RE =
  /\b(aceito proposta|aceito propostas|negoci[aá]vel|fa[çc]o desconto|podemos negociar|aceito oferta|fa[çc]o por|a combinar|aberto a proposta)\b/

/** Detecta se o anúncio sinaliza preço negociável. Não altera o preço. */
export function parseNegotiable(text: string | null | undefined): boolean {
  if (!text) return false
  return NEGOTIABLE_RE.test(normalizeText(text))
}

/* ---------------------------------------------------------------------------
   CONDIÇÃO (com detecção de conflito)
   -------------------------------------------------------------------------- */

const USED_SIGNAL_RE = /\b(usad[oa]s?|semi[\s-]?nov[oa]s?|seminov[oa]s?|com marca de uso|ja usad|ja foi usad|ja instalad|com uso)\b/
const NEW_SIGNAL_RE = /\b(nov[oa]s?|lacrad[oa]s?|na caixa|sem uso|nunca usad[oa]s?|zero)\b/

/** Mapeia a condição da OLX (PT) para o padrão interno; detecta conflito. */
export function parseImportCondition(text: string | null | undefined): {
  condition: OfferCondition
  conflict: boolean
} {
  if (!text) return { condition: "UNKNOWN", conflict: false }
  const t = normalizeText(text)
  const hasUsed = USED_SIGNAL_RE.test(t)
  const hasNew = NEW_SIGNAL_RE.test(t)

  // Conflito real: sinais dos dois lados -> não decidir, mandar para revisão.
  if (hasUsed && hasNew) return { condition: "UNKNOWN", conflict: true }

  switch (parseCondition(text)) {
    case "NOVO":
      return { condition: "NEW", conflict: false }
    case "USADO":
      return { condition: "USED", conflict: false }
    default:
      return { condition: "UNKNOWN", conflict: false }
  }
}

/* ---------------------------------------------------------------------------
   QUANTIDADE / CONFIANÇA
   -------------------------------------------------------------------------- */

function lotConfidence(lot: OlxLotInfo): Confidence {
  switch (lot.detectedBy) {
    case "KIT":
    case "CAIXA":
      return "HIGH"
    case "UNIDADES":
    case "PECAS":
      return "MEDIUM"
    case "MULTIPLICADOR":
      return "LOW"
    default:
      return "LOW"
  }
}

/* ---------------------------------------------------------------------------
   PARSER MESTRE
   -------------------------------------------------------------------------- */

export interface ParseAdInput {
  text?: string | null
  url?: string | null
}

/**
 * Analisa um anúncio (texto + URL) e devolve os dados estruturados com origem e
 * confiança por campo. Tudo determinístico — a mesma entrada gera sempre a
 * mesma saída. A URL é sempre preservada mesmo quando o texto é vazio.
 */
export function parseOlxAd(input: ParseAdInput): ParsedAd {
  const text = (input.text ?? "").trim()
  const url = cleanUrl(input.url)
  const conflicts: string[] = []

  const brand = parseBrand(text)
  const sku = parseSku(text)
  const ean = parseEan(text)
  const model = parseModel(text)
  const price = parseBrlPrice(text)
  const lot = parseLotQuantity(text)
  const quantity = lot.quantity
  const quantitySource: ParsedAd["quantitySource"] =
    lot.detectedBy === "NENHUM" ? "DEFAULT" : "DETECTED"
  const isLot = quantity > 1
  const unit = price !== null ? computeUnitPrice(price, lot) : null
  const { condition, conflict } = parseImportCondition(text)
  const location = parseLocation(deriveLocationText(text))
  const priceNegotiable = parseNegotiable(text)
  const productTitle = deriveTitle(text)

  if (conflict) conflicts.push("Condição com sinais conflitantes (novo e usado). Revise.")
  if (isLot && quantitySource === "DETECTED" && lotConfidence(lot) === "LOW") {
    conflicts.push("Quantidade do lote pouco confiável. Confirme antes de analisar.")
  }

  const origins: Record<string, FieldOrigin> = {
    productTitle: mark(productTitle),
    brand: mark(brand),
    sku: mark(sku),
    ean: mark(ean),
    price: mark(price),
    // Quantidade assumida (1) conta como não identificada, para o usuário saber.
    quantity: quantitySource === "DETECTED" ? "EXTRACTED" : "MISSING",
    unitPrice: mark(unit),
    condition: condition === "UNKNOWN" ? "MISSING" : "EXTRACTED",
    location: mark(location.label),
    priceNegotiable: priceNegotiable ? "EXTRACTED" : "MISSING",
    url: mark(url),
  }

  return {
    productTitle,
    brand,
    model,
    sku,
    ean,
    price,
    quantity,
    quantitySource,
    quantityConfidence: quantitySource === "DETECTED" ? lotConfidence(lot) : "LOW",
    isLot,
    unitPrice: unit,
    condition,
    conditionConflict: conflict,
    location,
    priceNegotiable,
    url,
    origins,
    conflicts,
  }
}

/* ---------------------------------------------------------------------------
   Auxiliares de texto
   -------------------------------------------------------------------------- */

/** Marca a origem de um valor: EXTRACTED se presente, senão MISSING. */
function mark(value: unknown): FieldOrigin {
  if (value === null || value === undefined) return "MISSING"
  if (typeof value === "string" && value.trim() === "") return "MISSING"
  return "EXTRACTED"
}

/**
 * Deriva um título curto do anúncio: a primeira linha não vazia que não seja
 * apenas preço/localização. Nunca inventa — se não houver texto, retorna null.
 */
function deriveTitle(text: string): string | null {
  if (!text) return null
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  for (const line of lines) {
    const isPriceOnly = /^r?\$?\s*[\d.,\s]+(reais)?$/i.test(line)
    if (isPriceOnly) continue
    if (line.length >= 3) return line.slice(0, 160)
  }
  return null
}

/**
 * Isola a linha mais provável de localização (contém "Cidade - UF" ou "UF").
 * Reduz falsos positivos ao passar só o trecho relevante para parseLocation.
 */
function deriveLocationText(text: string): string | null {
  if (!text) return null
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const uf = "AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO"
  const withUf = new RegExp(`[A-Za-zÀ-ÿ.\\s]+\\s*[-,/]\\s*(?:${uf})\\b`, "i")
  for (const line of lines) {
    const m = line.match(withUf)
    if (m) return m[0].replace(/\//g, "-").trim()
  }
  // Uma linha isolada com só a UF.
  for (const line of lines) {
    if (new RegExp(`^(?:${uf})$`, "i").test(line)) return line.toUpperCase()
  }
  return null
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
