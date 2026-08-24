import "server-only"
import type {
  AcquisitionStatus,
  OfferWithMetrics,
  ProductWithMetrics,
  RadarOpportunityWithMetrics,
} from "@/types"
import {
  calcMaxCost,
  calcResult,
  calcRoi,
  calcScore,
  calcSlack,
  calcStatus,
  computeProductMetrics,
} from "@/lib/calculations/pricing"
import { computeRadarMetrics } from "@/lib/calculations/radar-opportunity"
import { repo } from "./repository"

/** Produtos com metricas derivadas, ordenados por score (desc). */
export async function getProductsWithMetrics(): Promise<ProductWithMetrics[]> {
  const [products, settings] = await Promise.all([repo.listProducts(), repo.getSettings()])
  return products
    .map((product) => ({ ...product, metrics: computeProductMetrics(product, settings) }))
    .sort((a, b) => b.metrics.score - a.metrics.score)
}

export async function getProductWithMetrics(id: string): Promise<ProductWithMetrics | null> {
  const [product, settings] = await Promise.all([repo.getProduct(id), repo.getSettings()])
  if (!product) return null
  return { ...product, metrics: computeProductMetrics(product, settings) }
}

/** Ofertas manuais com metricas calculadas a partir do produto vinculado. */
export async function getOffersWithMetrics(): Promise<OfferWithMetrics[]> {
  const [offers, products, settings] = await Promise.all([
    repo.listOffers(),
    repo.listProducts(),
    repo.getSettings(),
  ])
  const byId = new Map(products.map((p) => [p.id, p]))

  const result: OfferWithMetrics[] = []
  for (const offer of offers) {
    const product = byId.get(offer.productId)
    if (!product) continue
    const totalCost = offer.price + offer.shipping
    result.push({
      ...offer,
      product,
      metrics: {
        totalCost,
        maxCost: calcMaxCost(product.priceB2B, settings),
        result: calcResult(product.priceB2B, totalCost, settings),
        roi: calcRoi(product.priceB2B, totalCost, settings),
        score: calcScore({
          priceB2B: product.priceB2B,
          acquisitionCost: totalCost,
          priority: product.priority,
          settings,
        }),
        status: calcStatus({
          priceB2B: product.priceB2B,
          acquisitionCost: totalCost,
          priority: product.priority,
          settings,
        }),
        slack: calcSlack(product.priceB2B, totalCost, settings),
      },
    })
  }
  return result.sort((a, b) => b.metrics.score - a.metrics.score)
}

/* =============================================================================
   RADAR JK (Fase 2) — oportunidades de compra com métricas calculadas.
   ============================================================================= */

export async function getRadarOpportunitiesWithMetrics(): Promise<RadarOpportunityWithMetrics[]> {
  const opportunities = await repo.listRadarOpportunities()
  return opportunities.map((opportunity) => ({
    ...opportunity,
    metrics: computeRadarMetrics(opportunity),
  }))
}

export async function getRadarOpportunityWithMetrics(
  id: string,
): Promise<RadarOpportunityWithMetrics | null> {
  const opportunity = await repo.getRadarOpportunity(id)
  if (!opportunity) return null
  return { ...opportunity, metrics: computeRadarMetrics(opportunity) }
}

export interface DashboardData {
  monitoredCount: number
  highPriorityCount: number
  openOpportunities: number
  bestOpportunity: ProductWithMetrics | null
  potentialCapital: number
  products: ProductWithMetrics[]
  hunt: ProductWithMetrics[]
  attention: ProductWithMetrics[]
}

const HUNT_STATUSES: AcquisitionStatus[] = ["HUNT_AGGRESSIVE", "HUNT"]

export async function getDashboardData(): Promise<DashboardData> {
  const products = await getProductsWithMetrics()
  const active = products.filter((p) => p.active)

  const hunt = active.filter((p) => HUNT_STATUSES.includes(p.metrics.status))
  const attention = active.filter((p) => p.metrics.status === "DO_NOT_BUY")
  const highPriority = active.filter(
    (p) => p.priority === "HIGH" || p.metrics.status === "HUNT_AGGRESSIVE",
  )

  // Capital potencial: soma do custo atual dos produtos que valem a pena caçar.
  const potentialCapital = hunt.reduce((sum, p) => sum + p.currentCost, 0)

  const bestOpportunity = hunt.length > 0 ? hunt[0] : null

  return {
    monitoredCount: active.length,
    highPriorityCount: highPriority.length,
    openOpportunities: hunt.length,
    bestOpportunity,
    potentialCapital,
    products: active,
    hunt,
    attention,
  }
}
