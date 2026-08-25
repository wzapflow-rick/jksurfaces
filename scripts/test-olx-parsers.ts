/**
 * Testes dos parsers e do adapter da OLX (Fase 6.2).
 *
 * Cobrem a lógica determinística que estará pronta caso a captura da OLX se
 * torne viável por um canal público apropriado: preço BRL, detecção de lote ->
 * preço unitário, condição, localização, normalização de anúncio e a
 * degradação elegante do adapter (search/getOffer indisponíveis, sem burlar
 * proteção). Não acessam rede, banco nem servidor.
 *
 *   pnpm tsx scripts/test-olx-parsers.ts
 */
import {
  parseBrlPrice,
  parseCondition,
  parseLocation,
  parseLotQuantity,
  unitPrice,
} from "../lib/sources/olx-parsers"
import { normalizeOlxListing, olxAdapter } from "../lib/sources/olx-adapter"
import { SourceError } from "../lib/sources/types"
import { getSourceAdapter, supportsLiveCapture } from "../lib/sources/registry"

let failures = 0

function check(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected
  if (!ok) failures++
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} -> ${actual}${ok ? "" : ` (esperado ${expected})`}`)
}

// -----------------------------------------------------------------------------
// PREÇO em formato brasileiro
// -----------------------------------------------------------------------------
console.log("\n== parseBrlPrice ==")
check("R$ 1.234,56", parseBrlPrice("R$ 1.234,56"), 1234.56)
check("1234,56", parseBrlPrice("1234,56"), 1234.56)
check("R$ 90", parseBrlPrice("R$ 90"), 90)
check("1.200 (milhar)", parseBrlPrice("1.200"), 1200)
check("90.5 (decimal)", parseBrlPrice("90.5"), 90.5)
check("texto com preço", parseBrlPrice("Preço: R$ 2.500,00 negociável"), 2500)
check("sem número", parseBrlPrice("a combinar"), null)
check("zero descartado", parseBrlPrice("R$ 0"), null)
check("vazio", parseBrlPrice(""), null)

// -----------------------------------------------------------------------------
// LOTE / QUANTIDADE
// -----------------------------------------------------------------------------
console.log("\n== parseLotQuantity ==")
check("kit com 10", parseLotQuantity("Kit com 10 torneiras").quantity, 10)
check("kit 10 detectedBy", parseLotQuantity("Kit com 10 torneiras").detectedBy, "KIT")
check("caixa com 12", parseLotQuantity("Caixa com 12 registros").quantity, 12)
check("10 peças", parseLotQuantity("Lote 10 peças novas").quantity, 10)
check("24 unidades", parseLotQuantity("24 unidades disponíveis").quantity, 24)
check("6x", parseLotQuantity("Vendo 6x chuveiros").quantity, 6)
check("avulso -> 1", parseLotQuantity("Torneira Deca cromada").quantity, 1)
check("avulso detectedBy", parseLotQuantity("Torneira Deca cromada").detectedBy, "NENHUM")
check("quantidade absurda -> 1", parseLotQuantity("kit com 99999").quantity, 1)

// -----------------------------------------------------------------------------
// PREÇO UNITÁRIO (lote total -> unitário)
// -----------------------------------------------------------------------------
console.log("\n== unitPrice ==")
check("1000 / 10", unitPrice(1000, { quantity: 10, detectedBy: "KIT" }), 100)
check("289,90 / 1", unitPrice(289.9, { quantity: 1, detectedBy: "NENHUM" }), 289.9)
check("100 / 3 (arredonda)", unitPrice(100, { quantity: 3, detectedBy: "PECAS" }), 33.33)
check("divisão segura por 0", unitPrice(50, { quantity: 0 as never, detectedBy: "NENHUM" }), 50)

// -----------------------------------------------------------------------------
// CONDIÇÃO
// -----------------------------------------------------------------------------
console.log("\n== parseCondition ==")
check("novo", parseCondition("Torneira nova na caixa"), "NOVO")
check("lacrado", parseCondition("Produto lacrado"), "NOVO")
check("usado", parseCondition("Chuveiro usado funcionando"), "USADO")
check("seminovo -> USADO", parseCondition("Registro seminovo"), "USADO")
check("sem sinal", parseCondition("Torneira Deca 1176"), "DESCONHECIDO")

// -----------------------------------------------------------------------------
// LOCALIZAÇÃO
// -----------------------------------------------------------------------------
console.log("\n== parseLocation ==")
check("Cidade - UF (label)", parseLocation("Rio de Janeiro - RJ").label, "Rio de Janeiro - RJ")
check("Cidade - UF (state)", parseLocation("Rio de Janeiro - RJ").state, "RJ")
check("Cidade, UF", parseLocation("São Gonçalo, RJ").state, "RJ")
check("só UF", parseLocation("SP").state, "SP")
check("UF inválida", parseLocation("XX").state, null)
check("vazio", parseLocation("").label, null)

// -----------------------------------------------------------------------------
// NORMALIZAÇÃO DE ANÚNCIO (lote -> preço unitário exposto como price)
// -----------------------------------------------------------------------------
console.log("\n== normalizeOlxListing ==")
const listing = normalizeOlxListing({
  listId: 987654,
  subject: "Kit com 10 Torneiras Deca Link Cromadas Novas",
  body: "Lote novo, na caixa. Entrego na região.",
  priceText: "R$ 1.500,00",
  url: "https://www.olx.com.br/anuncio/kit-torneiras-987654",
  thumbnail: "https://img.olx.com.br/thumb.jpg",
  locationText: "Niterói - RJ",
  brand: "Deca",
})
check("normalizou anúncio", listing ? 1 : 0, 1)
if (listing) {
  check("source", listing.source, "OLX")
  check("externalId", listing.externalId, "987654")
  check("preço UNITÁRIO (1500/10)", listing.price, 150)
  check("availability = lote", listing.availability, 10)
  check("brand", listing.brand, "Deca")
  check("sku nulo (OLX não expõe)", listing.sku, null)
  check("rawData.totalPrice", (listing.rawData as Record<string, unknown>).totalPrice, 1500)
  check("rawData.lotQuantity", (listing.rawData as Record<string, unknown>).lotQuantity, 10)
  check("rawData.condition", (listing.rawData as Record<string, unknown>).condition, "NOVO")
  check("rawData.state", (listing.rawData as Record<string, unknown>).state, "RJ")
}
check("descarta sem título", normalizeOlxListing({ priceText: "R$ 10" }), null)
check("descarta sem preço", normalizeOlxListing({ subject: "Torneira" }), null)

// -----------------------------------------------------------------------------
// DEGRADAÇÃO ELEGANTE DO ADAPTER (sem burlar proteção)
// -----------------------------------------------------------------------------
console.log("\n== Adapter OLX degrada com elegância ==")
check("registrado no Registry", getSourceAdapter("OLX") === olxAdapter, true)
check("não suporta captura ao vivo", supportsLiveCapture("OLX"), false)
check("Chatuba suporta captura ao vivo", supportsLiveCapture("CHATUBA"), true)

async function expectUnavailable(label: string, fn: () => Promise<unknown>) {
  try {
    await fn()
    failures++
    console.log(`[FAIL] ${label} -> não lançou erro`)
  } catch (error) {
    const ok = error instanceof SourceError && error.code === "UNAVAILABLE"
    if (!ok) failures++
    console.log(`[${ok ? "PASS" : "FAIL"}] ${label} -> ${(error as Error).name}/${(error as SourceError).code}`)
  }
}

async function main() {
  await expectUnavailable("search lança UNAVAILABLE", () => olxAdapter.search("torneira deca"))
  await expectUnavailable("getOffer lança UNAVAILABLE", () => olxAdapter.getOffer("123"))

  console.log("")
  if (failures > 0) {
    console.error(`\n${failures} verificação(ões) falharam.`)
    process.exit(1)
  }
  console.log("Todos os testes da OLX passaram.")
}

void main()
