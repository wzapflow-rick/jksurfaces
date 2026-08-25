/**
 * Sonda ao vivo (manual) da integração real com a Chatuba (Fase 6.1).
 * Chama o adapter contra a API pública VTEX e roda o matching contra alguns
 * produtos JK de exemplo. NÃO faz parte da suíte automatizada (usa rede).
 *
 *   pnpm tsx scripts/probe-chatuba-live.ts torneira
 */
import { chatubaAdapter } from "../lib/sources/chatuba-adapter"
import { matchOfferToProduct, type MatchCandidate } from "../lib/calculations/offer-matching"

const term = process.argv[2] ?? "torneira"

const candidates: MatchCandidate[] = [
  { id: "p1", sku: "1176C", name: "Torneira Deca Link 1176 C", ean: null },
]

async function main() {
  console.log(`Buscando "${term}" na Chatuba (API pública VTEX)...`)
  const offers = await chatubaAdapter.search(term, { limit: 5 })
  console.log(`Recebidas ${offers.length} oferta(s).\n`)
  for (const o of offers) {
    const match = matchOfferToProduct(
      { sku: o.sku, ean: o.ean, brand: o.brand, productTitle: o.productTitle },
      candidates,
    )
    console.log("-", o.productTitle)
    console.log(`  preço R$ ${o.price} · marca ${o.brand ?? "?"} · sku ${o.sku ?? "?"} · ean ${o.ean ?? "?"}`)
    console.log(`  disp ${o.availability ?? "?"} · seller ${o.seller ?? "?"}`)
    console.log(`  url ${o.url}`)
    console.log(`  match: ${match.status} (${match.matchMethod}, ${Math.round(match.confidence * 100)}%)\n`)
  }
}

main().catch((e) => {
  console.error("Falha na sonda:", e)
  process.exit(1)
})
