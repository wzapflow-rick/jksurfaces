"use server"

import { revalidatePath } from "next/cache"
import {
  attachMetrics,
  captureFromSource,
  computeOfferMetrics,
} from "@/lib/services/source-capture-service"
import { repo } from "@/lib/services/repository"
import { SourceError } from "@/lib/sources/types"
import type { SourceOfferWithMetrics } from "@/types"

export interface CaptureActionResult {
  ok: boolean
  offers?: SourceOfferWithMetrics[]
  created?: number
  updated?: number
  error?: string
}

/**
 * Captura ofertas de uma fonte para um termo de busca. Persiste, faz matching
 * e retorna as ofertas com métricas do motor JK. Nunca derruba a aplicação:
 * erros de fonte viram mensagens amigáveis.
 *
 * `salePriceOverride` permite calcular métricas a partir da venda esperada de
 * uma missão de caça mesmo quando a oferta ainda não está associada a um
 * produto JK — sem nunca duplicar a regra financeira.
 */
export async function captureSourceAction(
  source: string,
  query: string,
  salePriceOverride?: number,
): Promise<CaptureActionResult> {
  const term = query.trim()
  if (term.length < 2) {
    return { ok: false, error: "Digite ao menos 2 caracteres para buscar." }
  }

  try {
    const { offers, created, updated } = await captureFromSource(source, term)
    const products = await repo.listProducts()
    let withMetrics = attachMetrics(offers, products)

    // Fallback de métricas pela venda esperada da missão (quando não há produto JK
    // associado, mas há um preço de venda de referência da caça).
    if (salePriceOverride && salePriceOverride > 0) {
      withMetrics = withMetrics.map((offer) =>
        offer.metrics
          ? offer
          : {
              ...offer,
              metrics: computeOfferMetrics(offer.price, offer.shipping, salePriceOverride),
            },
      )
    }

    revalidatePath("/ofertas")
    return { ok: true, offers: withMetrics, created, updated }
  } catch (error) {
    if (error instanceof SourceError) {
      return { ok: false, error: sourceErrorMessage(error) }
    }
    console.log("[v0] captureSourceAction error:", error)
    return { ok: false, error: "Não foi possível capturar as ofertas agora. Tente novamente." }
  }
}

function sourceErrorMessage(error: SourceError): string {
  switch (error.code) {
    case "RATE_LIMITED":
      return "Muitas buscas em pouco tempo. Aguarde alguns segundos e tente de novo."
    case "TIMEOUT":
      return "A fonte demorou a responder. Tente novamente em instantes."
    case "UNAVAILABLE":
      return "A fonte está indisponível no momento."
    case "BAD_RESPONSE":
      return "A resposta da fonte veio em formato inesperado."
    default:
      return "Não foi possível capturar as ofertas agora."
  }
}

export async function deleteSourceOfferAction(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await repo.deleteSourceOffer(id)
    revalidatePath("/ofertas")
    return { ok: true }
  } catch {
    return { ok: false, error: "Não foi possível remover a oferta." }
  }
}
