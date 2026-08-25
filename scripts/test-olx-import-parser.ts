/**
 * Testes do PARSER DE IMPORTAÇÃO INTELIGENTE de anúncios OLX (Fase 6.3).
 *
 * Cobrem a lógica 100% determinística e local: extração de preço ancorado,
 * SKU/EAN, marca, condição com CONFLITO, localização em texto livre, negociável,
 * dica de slug de URL e o parser principal (incluindo lote -> preço unitário).
 * Não acessam rede, banco nem servidor.
 *
 *   pnpm tsx scripts/test-olx-import-parser.ts
 */
import {
  detectCondition,
  detectNegotiable,
  extractBrand,
  extractEan,
  extractLocation,
  extractPrice,
  extractSku,
  isOlxUrl,
  parseOlxListingText,
  textFromUrlSlug,
} from "../lib/sources/olx-import-parser"

let failures = 0

function check(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected
  if (!ok) failures++
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} -> ${actual}${ok ? "" : ` (esperado ${expected})`}`)
}

// -----------------------------------------------------------------------------
// URL da OLX
// -----------------------------------------------------------------------------
console.log("\n== isOlxUrl ==")
check("olx.com.br", isOlxUrl("https://www.olx.com.br/anuncio/x-123"), true)
check("subdomínio regional", isOlxUrl("https://se.olx.com.br/sergipe/anuncio/y"), true)
check("outro site", isOlxUrl("https://mercadolivre.com.br/x"), false)
check("texto não-URL", isOlxUrl("torneira deca"), false)
check("vazio", isOlxUrl(""), false)

// -----------------------------------------------------------------------------
// Dica de slug (sem rede)
// -----------------------------------------------------------------------------
console.log("\n== textFromUrlSlug ==")
check(
  "slug legível",
  textFromUrlSlug("https://www.olx.com.br/anuncio/torneira-deca-1176-c-nova-1298765432"),
  "torneira deca 1176 c nova",
)
check("sem path", textFromUrlSlug("https://www.olx.com.br"), "")
check("entrada inválida", textFromUrlSlug("não é url"), "")

// -----------------------------------------------------------------------------
// PREÇO ancorado (nunca confunde SKU com preço)
// -----------------------------------------------------------------------------
console.log("\n== extractPrice ==")
check("R$ com milhar", extractPrice("Vendo por R$ 1.500,00"), 1500)
check("R$ colado", extractPrice("R$180 hoje"), 180)
check("N reais", extractPrice("sai por 180 reais"), 180)
check("linha só com valor", extractPrice("Torneira Deca\n1500\nNiterói RJ"), 1500)
check("SKU não vira preço", extractPrice("Modelo 1176.C"), null)
check("sem preço", extractPrice("a combinar"), null)

// -----------------------------------------------------------------------------
// SKU / EAN
// -----------------------------------------------------------------------------
console.log("\n== extractSku / extractEan ==")
check("SKU simples", extractSku("Torneira 1176.C nova"), "1176.C")
check("SKU composto", extractSku("Monocomando 2875.C33 Deca"), "2875.C33")
check("SKU com sufixo", extractSku("Ducha 1172.C.LNK cromada"), "1172.C.LNK")
check("milhar não é SKU", extractSku("Vendo por 1.500 reais"), null)
check("EAN-13", extractEan("Cód de barras 7891234567895 na caixa"), "7891234567895")
check("sem EAN", extractEan("Torneira Deca 1176.C"), null)

// -----------------------------------------------------------------------------
// MARCA (lista curada)
// -----------------------------------------------------------------------------
console.log("\n== extractBrand ==")
check("Deca", extractBrand("Torneira DECA cromada"), "Deca")
check("Lorenzetti sem acento", extractBrand("chuveiro lorenzetti"), "Lorenzetti")
check("marca desconhecida", extractBrand("Torneira XYZ genérica"), null)

// -----------------------------------------------------------------------------
// CONDIÇÃO com detecção de CONFLITO
// -----------------------------------------------------------------------------
console.log("\n== detectCondition ==")
check("novo", detectCondition("Torneira nova na caixa").condition, "NEW")
check("usado", detectCondition("Chuveiro usado, funcionando").condition, "USED")
check("nunca usado -> NOVO", detectCondition("Torneira nunca usada").condition, "NEW")
check("já instalado -> USADO", detectCondition("Registro já instalado uma vez").condition, "USED")
check("conflito -> UNKNOWN", detectCondition("Torneira nova, mas já instalada").condition, "UNKNOWN")
check("conflito flag", detectCondition("Torneira nova, mas já instalada").conflict, true)
check("sem sinal", detectCondition("Torneira Deca 1176.C").condition, "UNKNOWN")

// -----------------------------------------------------------------------------
// NEGOCIÁVEL
// -----------------------------------------------------------------------------
console.log("\n== detectNegotiable ==")
check("aceito proposta", detectNegotiable("Valor R$ 200, aceito proposta"), true)
check("a combinar", detectNegotiable("preço a combinar"), true)
check("fixo", detectNegotiable("Preço fixo, não baixo"), false)

// -----------------------------------------------------------------------------
// LOCALIZAÇÃO em texto livre
// -----------------------------------------------------------------------------
console.log("\n== extractLocation ==")
check("Cidade UF (espaço)", extractLocation("Torneira Deca\nR$ 180\nAracaju SE").label, "Aracaju/SE")
check("Cidade - UF", extractLocation("Rio de Janeiro - RJ").state, "RJ")
check("Cidade, UF", extractLocation("São Gonçalo, RJ").state, "RJ")
check("UF inválida ignorada", extractLocation("Produto XX").state, null)
check("linha com preço ignorada", extractLocation("R$ 1.500,00").state, null)

// -----------------------------------------------------------------------------
// PARSER PRINCIPAL (integração determinística)
// -----------------------------------------------------------------------------
console.log("\n== parseOlxListingText ==")
const full = parseOlxListingText(
  "Torneira Deca 1176.C nova na caixa\nR$ 180\nAracaju SE\naceito proposta",
)
check("título", full.productTitle, "Torneira Deca 1176.C nova na caixa")
check("marca", full.brand, "Deca")
check("sku", full.sku, "1176.C")
check("preço total", full.totalPrice, 180)
check("quantidade avulsa", full.quantity, 1)
check("não é lote", full.isLot, false)
check("preço unitário", full.unitPrice, 180)
check("condição novo", full.condition, "NEW")
check("localização", full.location.label, "Aracaju/SE")
check("negociável", full.priceNegotiable, true)
check("origem: preço extraído", full.found.price, true)
check("origem: sku extraído", full.found.sku, true)

const lot = parseOlxListingText("Kit com 10 Torneiras Deca Novas\nR$ 1.500,00\nNiterói RJ")
check("lote: quantidade", lot.quantity, 10)
check("lote: é lote", lot.isLot, true)
check("lote: preço total", lot.totalPrice, 1500)
check("lote: preço unitário (1500/10)", lot.unitPrice, 150)
check("lote: origem quantidade detectada", lot.found.quantity, true)

const empty = parseOlxListingText("")
check("vazio: título nulo", empty.productTitle, null)
check("vazio: preço nulo", empty.totalPrice, null)
check("vazio: quantidade default 1", empty.quantity, 1)
check("vazio: quantitySource DEFAULT", empty.quantitySource, "DEFAULT")
check("vazio: condição desconhecida", empty.condition, "UNKNOWN")

// Slug como fallback quando não há texto colado.
const fromSlug = parseOlxListingText(
  null,
  "https://www.olx.com.br/anuncio/torneira-deca-1176-c-nova-1298765432",
)
check("slug: título", fromSlug.productTitle, "torneira deca 1176 c nova")
check("slug: marca", fromSlug.brand, "Deca")
// O slug perde os pontos do SKU ("1176.C" -> "1176 c"), então não é
// recuperável de forma confiável: o comportamento correto é NÃO inventar.
check("slug: sku não recuperável", fromSlug.sku, null)

console.log("")
if (failures > 0) {
  console.error(`\n${failures} verificação(ões) falharam.`)
  process.exit(1)
}
console.log("Todos os testes do parser de importação OLX passaram.")
