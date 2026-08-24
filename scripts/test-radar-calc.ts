/**
 * Teste do motor de cálculo do Radar JK (Fase 3).
 *
 * Roda de forma isolada, sem banco e sem servidor, validando que a regra
 * financeira central e a calculadora reversa produzem os valores esperados.
 *
 *   pnpm tsx scripts/test-radar-calc.ts
 */
import {
  computeRadarMetrics,
  calcMaxPurchasePrice,
  calcRecommendedPurchasePrice,
} from "../lib/calculations/radar-opportunity"

let failures = 0

function check(label: string, actual: number | string, expected: number | string) {
  const ok = actual === expected
  if (!ok) failures++
  const status = ok ? "PASS" : "FAIL"
  console.log(`[${status}] ${label} -> ${actual}${ok ? "" : ` (esperado ${expected})`}`)
}

// -----------------------------------------------------------------------------
// TESTE OBRIGATÓRIO da Fase 3
// venda 700 / aquisição 400 / frete 0 / outros 0  =>  resultado 34
// -----------------------------------------------------------------------------
console.log("\n== Teste obrigatório (venda 700, compra 400) ==")
const base = computeRadarMetrics({
  announcedPrice: 400,
  shipping: 0,
  otherCosts: 0,
  salePrice: 700,
})
check("30% de 700", base.operationalCost, 210)
check("8% de 700", base.taxCost, 56)
check("Resultado estimado", base.estimatedResult, 34)
check("Custo total de aquisição", base.acquisitionCost, 400)
// Calculadora reversa: máx = 700*0,62 = 434 ; recomendado = 434 − 70 = 364
check("Preço máximo de aquisição", base.maxPurchasePrice, 434)
check("Preço recomendado de compra", base.recommendedPurchasePrice, 364)
// 400 está entre 364 (recomendado) e 434 (máximo) => AVALIAR
check("Recomendação", base.recommendation, "AVALIAR")

// -----------------------------------------------------------------------------
// CAÇAR AGORA: preço encontrado abaixo do recomendado
// -----------------------------------------------------------------------------
console.log("\n== Caçar agora (compra 300) ==")
const hunt = computeRadarMetrics({ announcedPrice: 300, shipping: 0, otherCosts: 0, salePrice: 700 })
check("Resultado estimado", hunt.estimatedResult, 134)
check("Recomendação", hunt.recommendation, "CACAR")

// -----------------------------------------------------------------------------
// NÃO VALE: preço encontrado acima do máximo
// -----------------------------------------------------------------------------
console.log("\n== Não vale (compra 500) ==")
const bad = computeRadarMetrics({ announcedPrice: 500, shipping: 0, otherCosts: 0, salePrice: 700 })
check("Resultado estimado", bad.estimatedResult, -66)
check("Recomendação", bad.recommendation, "NAO_VALE")

// -----------------------------------------------------------------------------
// Com frete e outros custos (decimais)
// venda 1250,50 / frete 80 / outros 19,90
// -----------------------------------------------------------------------------
console.log("\n== Frete + outros + decimais ==")
const withCosts = calcMaxPurchasePrice({ salePrice: 1250.5, shipping: 80, otherCosts: 19.9 })
// 1250,50*0,62 = 775,31 ; − 80 − 19,90 = 675,41
check("Preço máximo com custos", withCosts, 675.41)
const recWithCosts = calcRecommendedPurchasePrice({ salePrice: 1250.5, shipping: 80, otherCosts: 19.9 })
// 675,41 − (1250,50*0,10=125,05) = 550,36
check("Preço recomendado com custos", recWithCosts, 550.36)

// -----------------------------------------------------------------------------
// Valores altos
// -----------------------------------------------------------------------------
console.log("\n== Valores altos ==")
const big = computeRadarMetrics({ announcedPrice: 40000, shipping: 0, otherCosts: 0, salePrice: 100000 })
check("30% de 100000", big.operationalCost, 30000)
check("8% de 100000", big.taxCost, 8000)
check("Resultado estimado", big.estimatedResult, 22000)
check("Preço máximo de aquisição", big.maxPurchasePrice, 62000)

// -----------------------------------------------------------------------------
// Venda baixa demais (máximo negativo) => NÃO VALE a nenhum preço
// -----------------------------------------------------------------------------
console.log("\n== Venda baixa (máximo negativo) ==")
const low = computeRadarMetrics({ announcedPrice: 10, shipping: 50, otherCosts: 0, salePrice: 60 })
// máx = 60*0,62 − 50 = 37,2 − 50 = −12,8 => NAO_VALE
check("Recomendação", low.recommendation, "NAO_VALE")

console.log("")
if (failures > 0) {
  console.error(`\n${failures} verificação(ões) falharam.`)
  process.exit(1)
}
console.log("Todos os testes passaram.")
