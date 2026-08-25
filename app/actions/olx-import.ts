"use server"

import { revalidatePath } from "next/cache"
import {
  analyzeImport,
  saveImportedOffer,
  type AnalyzeImportResult,
  type ImportOfferInput,
} from "@/lib/services/olx-import-service"
import { unitPrice } from "@/lib/sources/olx-parsers"

/**
 * SERVER ACTIONS DA IMPORTAÇÃO INTELIGENTE — Fase 6.3.
 *
 * `analyzeImportAction`  -> preview determinístico (não persiste nada).
 * `saveImportAction`     -> cria/atualiza o SOURCE OFFER e devolve o link para
 *                           "Analisar no Radar" (a oportunidade só nasce lá).
 */

export interface AnalyzeActionResult {
  ok: boolean
  data?: AnalyzeImportResult
  error?: string
}

export async function analyzeImportAction(input: {
  url?: string | null
  text?: string | null
}): Promise<AnalyzeActionResult> {
  const url = input.url?.trim() || null
  const text = input.text?.trim() || null
  if (!url && !text) {
    return { ok: false, error: "Informe a URL do anúncio ou cole o texto." }
  }
  try {
    const data = await analyzeImport({ url, text })
    return { ok: true, data }
  } catch (error) {
    console.log("[v0] analyzeImportAction error:", error)
    return { ok: false, error: "Não foi possível analisar o anúncio agora. Tente novamente." }
  }
}

/** Dados revisados + contexto opcional do Radar (venda esperada / missão). */
export interface SaveImportActionInput extends ImportOfferInput {
  salePrice: number | null
  missionId: string | null
}

export interface SaveImportActionResult {
  ok: boolean
  offerId?: string
  created?: boolean
  updated?: boolean
  priceChanged?: boolean
  radarHref?: string
  error?: string
}

export async function saveImportAction(
  input: SaveImportActionInput,
): Promise<SaveImportActionResult> {
  const title = input.productTitle?.trim()
  if (!title) {
    return { ok: false, error: "O nome do produto é obrigatório." }
  }
  if (!(input.totalPrice > 0)) {
    return { ok: false, error: "Informe um preço válido (maior que zero)." }
  }
  const quantity = input.quantity >= 1 ? Math.floor(input.quantity) : 1

  try {
    const result = await saveImportedOffer({ ...input, productTitle: title, quantity })

    // Link para o Radar: preço UNITÁRIO como preço anunciado (o motor JK compara
    // o unitário com o preço de venda). A oportunidade só é criada lá.
    const unit = unitPrice(input.totalPrice, { quantity, detectedBy: "NENHUM" })
    const params = new URLSearchParams({
      name: title,
      source: "OLX",
      announcedPrice: String(unit),
    })
    if (result.offer.url && !result.offer.url.startsWith("manual://")) {
      params.set("url", result.offer.url)
    }
    if (input.sku?.trim()) params.set("sku", input.sku.trim())
    if (input.brand?.trim()) params.set("brand", input.brand.trim())
    if (input.salePrice && input.salePrice > 0) params.set("salePrice", String(input.salePrice))
    if (input.shipping && input.shipping > 0) params.set("shipping", String(input.shipping))
    if (input.missionId) params.set("missionId", input.missionId)

    revalidatePath("/ofertas")

    return {
      ok: true,
      offerId: result.offer.id,
      created: result.created,
      updated: result.updated,
      priceChanged: result.priceChanged,
      radarHref: `/radar/novo?${params.toString()}`,
    }
  } catch (error) {
    console.log("[v0] saveImportAction error:", error)
    return { ok: false, error: "Não foi possível salvar a oferta. Tente novamente." }
  }
}
