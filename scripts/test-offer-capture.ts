/**
 * Testes da captura de ofertas (Fase 6.1).
 *
 * Cobrem o matching determinístico (oferta -> produto JK), a derivação de
 * status por confiança e a normalização do adapter da Chatuba a partir de um
 * payload VTEX fixo. Não acessam rede, banco nem servidor.
 *
 *   pnpm tsx scripts/test-offer-capture.ts
 */
import {
  matchOfferToProduct,
  statusFromConfidence,
  normalizeSku,
  type MatchCandidate,
} from "../lib/calculations/offer-matching"
import { normalizeVtexProduct } from "../lib/sources/chatuba-adapter"

let failures = 0

function check(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected
  if (!ok) failures++
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} -> ${actual}${ok ? "" : ` (esperado ${expected})`}`)
}

const candidates: MatchCandidate[] = [
  { id: "p1", sku: "DECA-1176C", name: "Torneira Deca Link 1176 C Cromada", ean: "7891234500017" },
  { id: "p2", sku: "LOR-7700", name: "Chuveiro Lorenzetti Acqua Duo 7700", ean: "7890000077002" },
  { id: "p3", sku: "TIGRE-2020", name: "Registro de Gaveta Tigre 20mm", ean: null },
]

// -----------------------------------------------------------------------------
// 1) EAN exato -> MATCHED 1,00
// -----------------------------------------------------------------------------
console.log("\n== EAN exato ==")
const byEan = matchOfferToProduct(
  { sku: null, ean: "789-1234-500017", brand: "Deca", productTitle: "Torneira qualquer" },
  candidates,
)
check("productId", byEan.productId, "p1")
check("method", byEan.matchMethod, "EAN_EXACT")
check("status", byEan.status, "MATCHED")
check("confidence", byEan.confidence, 1)

// -----------------------------------------------------------------------------
// 2) SKU exato -> MATCHED
// -----------------------------------------------------------------------------
console.log("\n== SKU exato ==")
const bySku = matchOfferToProduct(
  { sku: "lor-7700", ean: null, brand: null, productTitle: "Chuveiro" },
  candidates,
)
check("productId", bySku.productId, "p2")
check("method", bySku.matchMethod, "SKU_EXACT")

// -----------------------------------------------------------------------------
// 3) SKU normalizado (hífens diferentes) -> MATCHED 0,90
// -----------------------------------------------------------------------------
console.log("\n== SKU normalizado ==")
const bySkuNorm = matchOfferToProduct(
  { sku: "deca 1176 c", ean: null, brand: null, productTitle: "Torneira" },
  candidates,
)
check("productId", bySkuNorm.productId, "p1")
check("method", bySkuNorm.matchMethod, "SKU_NORMALIZED")
check("confidence", bySkuNorm.confidence, 0.9)
check("normalizeSku", normalizeSku("deca 1176 c"), "DECA1176C")

// -----------------------------------------------------------------------------
// 4) marca + modelo -> REVIEW (0,80) - baixa confiança nunca vira certeza
// -----------------------------------------------------------------------------
console.log("\n== Marca + modelo (REVIEW) ==")
const byBrandModel = matchOfferToProduct(
  { sku: null, ean: null, brand: "Lorenzetti", productTitle: "Chuveiro Acqua Duo 7700 branco" },
  candidates,
)
check("productId", byBrandModel.productId, "p2")
check("method", byBrandModel.matchMethod, "BRAND_MODEL")
check("status (revisar)", byBrandModel.status, "REVIEW")

// -----------------------------------------------------------------------------
// 5) nome similar -> REVIEW (0,75)
// -----------------------------------------------------------------------------
console.log("\n== Nome similar (REVIEW) ==")
const byName = matchOfferToProduct(
  { sku: null, ean: null, brand: null, productTitle: "Registro de Gaveta Tigre 20mm PVC" },
  candidates,
)
check("productId", byName.productId, "p3")
check("method", byName.matchMethod, "NAME_MATCH")
check("status", byName.status, "REVIEW")

// -----------------------------------------------------------------------------
// 6) sem correspondência -> UNMATCHED
// -----------------------------------------------------------------------------
console.log("\n== Sem correspondência ==")
const noMatch = matchOfferToProduct(
  { sku: null, ean: null, brand: "Marca X", productTitle: "Cadeira de escritório ergonômica" },
  candidates,
)
check("matched", noMatch.matched, false)
check("status", noMatch.status, "UNMATCHED")
check("productId", noMatch.productId, null)

// -----------------------------------------------------------------------------
// statusFromConfidence: limiares
// -----------------------------------------------------------------------------
console.log("\n== Limiares de status ==")
check("0,90 -> MATCHED", statusFromConfidence(0.9), "MATCHED")
check("0,89 -> REVIEW", statusFromConfidence(0.89), "REVIEW")
check("0,50 -> REVIEW", statusFromConfidence(0.5), "REVIEW")
check("0,49 -> UNMATCHED", statusFromConfidence(0.49), "UNMATCHED")

// -----------------------------------------------------------------------------
// Normalização do payload VTEX da Chatuba
// -----------------------------------------------------------------------------
console.log("\n== Normalização VTEX (Chatuba) ==")
const vtexProduct = {
  productId: "9999",
  productName: "Torneira Deca Link 1176 C Cromada",
  brand: "Deca",
  link: "https://www.chatuba.com.br/torneira-deca-link-1176/p",
  linkText: "torneira-deca-link-1176",
  items: [
    {
      itemId: "12345",
      ean: "7891234500017",
      referenceId: [{ Value: "1176C" }],
      images: [{ imageUrl: "https://chatuba.vteximg.com.br/arquivos/ids/1/torneira.jpg" }],
      sellers: [
        {
          sellerName: "Chatuba",
          commertialOffer: { Price: 289.9, AvailableQuantity: 15 },
        },
      ],
    },
  ],
}
const normalized = normalizeVtexProduct(vtexProduct as never)
check("normalizou 1 oferta", normalized ? 1 : 0, 1)
if (normalized) {
  check("source", normalized.source, "CHATUBA")
  check("externalId", normalized.externalId, "9999")
  check("title", normalized.productTitle, "Torneira Deca Link 1176 C Cromada")
  check("brand", normalized.brand, "Deca")
  check("ean", normalized.ean, "7891234500017")
  check("sku (referenceId)", normalized.sku, "1176C")
  check("price", normalized.price, 289.9)
  check("availability", normalized.availability, 15)
  check("seller", normalized.seller, "Chatuba")
  check("url", normalized.url, "https://www.chatuba.com.br/torneira-deca-link-1176/p")
}

// Produto sem oferta comercial válida (preço 0) deve ser descartado.
const noPrice = normalizeVtexProduct({
  productId: "1",
  productName: "Produto sem preço",
  brand: "X",
  link: "https://www.chatuba.com.br/x/p",
  items: [{ itemId: "1", sellers: [{ commertialOffer: { Price: 0, AvailableQuantity: 0 } }] }],
} as never)
check("descarta preço 0", noPrice, null)

console.log("")
if (failures > 0) {
  console.error(`\n${failures} verificação(ões) falharam.`)
  process.exit(1)
}
console.log("Todos os testes de captura passaram.")
