import type { HuntMission, SearchQueryType } from "@/types"

/**
 * MOTOR DE INTELIGÊNCIA DE BUSCA — Central de Caça (Fase 5).
 *
 * Transforma uma MISSÃO DE CAÇA numa série organizada de consultas de busca.
 * É 100% determinístico e explicável. NÃO faz scraping, NÃO chama APIs e NÃO
 * inventa dados: cada palavra das consultas vem exclusivamente do que o usuário
 * digitou na missão (nome/termo, marca, SKU, categoria).
 *
 * "Modelo" NÃO é um campo da missão e NÃO é inventado — ele é EXTRAÍDO dos
 * próprios tokens do termo de busca (removendo a marca, o substantivo do produto
 * e conectores). Se a extração não sobrar nada, as consultas por modelo são
 * simplesmente omitidas.
 */

/** Consulta gerada pelo motor, antes de ser associada a uma missão/fonte. */
export interface GeneratedQuery {
  query: string
  type: SearchQueryType
  priority: number
}

/**
 * Prioridades por tipo. Servem APENAS para ordenar as buscas — nunca afetam o
 * cálculo financeiro da oportunidade (esse continua na Fase 3/4, intocado).
 */
export const SEARCH_QUERY_PRIORITY: Record<SearchQueryType, number> = {
  SKU: 100,
  EXACT: 100,
  SKU_BRAND: 98,
  BRAND_MODEL: 95,
  PRODUCT_MODEL: 90,
  PRODUCT_BRAND: 85,
  BROAD: 60,
}

/** Conectores/preposições ignorados só na EXTRAÇÃO do modelo (não no termo). */
const STOPWORDS = new Set(["de", "da", "do", "das", "dos", "com", "para", "e", "em"])

/** Normaliza espaços e remove repetições de espaço. Preserva o conteúdo. */
function normalizeSpaces(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

function tokenize(value: string): string[] {
  return normalizeSpaces(value)
    .split(" ")
    .filter(Boolean)
}

/** Remove os tokens da marca de uma lista de tokens (comparação case-insensitive). */
function removeTokens(tokens: string[], toRemove: string[]): string[] {
  const lowered = new Set(toRemove.map((t) => t.toLowerCase()))
  return tokens.filter((t) => !lowered.has(t.toLowerCase()))
}

/** Junta tokens numa consulta normalizada; retorna null se vazia. */
function join(tokens: string[]): string | null {
  const q = normalizeSpaces(tokens.join(" "))
  return q.length > 0 ? q : null
}

/**
 * Gera as consultas inteligentes de uma missão.
 *
 * Regras aplicadas:
 *  1. Nunca gera consultas vazias.
 *  2. Nunca duplica consultas (dedupe case-insensitive, mantém a maior prioridade).
 *  3. Preserva o SKU exatamente como informado.
 *  4. Consultas mais específicas têm prioridade maior.
 *  5. Buscas amplas só quando fazem sentido.
 *  6/7/8. Não inventa características, modelo, SKU nem altera o nome original.
 *  9. Normaliza apenas espaços/duplicações.
 * 10. A busca exata sempre tem prioridade máxima.
 */
export function generateSearchQueries(
  mission: Pick<HuntMission, "searchTerm" | "name" | "brand" | "sku" | "category">,
): GeneratedQuery[] {
  // Termo canônico: o termo de busca; se vazio, cai no nome do produto.
  const fullText = normalizeSpaces(mission.searchTerm || mission.name || "")
  const brand = mission.brand ? normalizeSpaces(mission.brand) : ""
  const sku = mission.sku ? mission.sku.trim() : ""
  const category = mission.category ? normalizeSpaces(mission.category) : ""

  const brandTokens = brand ? tokenize(brand) : []
  const allTokens = tokenize(fullText)
  // Tokens sem a marca — base para produto e modelo.
  const nonBrand = removeTokens(allTokens, brandTokens)
  const productNoun = nonBrand[0] ?? "" // ex.: "Vaso" em "Vaso Deca Ravena"
  // Modelo = o que sobra depois de tirar produto e conectores. Extraído, não inventado.
  const modelTokens = removeTokens(nonBrand.slice(1), [...STOPWORDS])
  const model = join(modelTokens) ?? ""

  const raw: (GeneratedQuery | null)[] = []
  const push = (query: string | null, type: SearchQueryType) => {
    if (!query) return
    raw.push({ query, type, priority: SEARCH_QUERY_PRIORITY[type] })
  }

  // Busca exata do termo completo — nunca altera o nome original.
  push(join(allTokens), "EXACT")

  // SKU exato e SKU + marca — SKU preservado sem normalização de conteúdo.
  if (sku) {
    push(sku, "SKU")
    if (brand) push(`${brand} ${sku}`, "SKU_BRAND")
  }

  // Marca + modelo (ex.: "Deca Ravena").
  if (brand && model) push(`${brand} ${model}`, "BRAND_MODEL")

  // Produto + modelo (ex.: "Vaso Ravena").
  if (productNoun && model) push(`${productNoun} ${model}`, "PRODUCT_MODEL")

  // Produto + marca (ex.: "Vaso Deca").
  if (productNoun && brand) push(`${productNoun} ${brand}`, "PRODUCT_BRAND")

  // Busca ampla: produto/modelo + categoria, só quando há categoria.
  if (category) {
    const broadBase = model || productNoun || (brand ? `${brand}` : "")
    push(join([broadBase, category]), "BROAD")
  }

  // Dedupe case-insensitive mantendo a maior prioridade; depois ordena.
  const byKey = new Map<string, GeneratedQuery>()
  for (const item of raw) {
    if (!item) continue
    const key = item.query.toLowerCase()
    const existing = byKey.get(key)
    if (!existing || item.priority > existing.priority) byKey.set(key, item)
  }

  return [...byKey.values()].sort(
    (a, b) => b.priority - a.priority || a.query.localeCompare(b.query, "pt-BR"),
  )
}
