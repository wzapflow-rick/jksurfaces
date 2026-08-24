"use server"

import { revalidatePath } from "next/cache"
import { repo } from "@/lib/services/repository"
import { radarOpportunitySchema } from "@/lib/validation"
import type { RadarStatus } from "@/types"
import type { ActionResult } from "./products"

function toFieldErrors(error: unknown): ActionResult {
  if (typeof error === "object" && error && "issues" in error) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of (error as { issues: { path: (string | number)[]; message: string }[] }).issues) {
      const key = String(issue.path[0] ?? "form")
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { ok: false, fieldErrors, error: "Verifique os campos destacados." }
  }
  return { ok: false, error: "Ocorreu um erro inesperado." }
}

function parseForm(formData: FormData) {
  return radarOpportunitySchema.parse({
    sku: formData.get("sku"),
    name: formData.get("name"),
    brand: formData.get("brand"),
    source: formData.get("source") || "OUTRO",
    url: formData.get("url"),
    announcedPrice: formData.get("announcedPrice"),
    availableQty: formData.get("availableQty"),
    shipping: formData.get("shipping") || 0,
    otherCosts: formData.get("otherCosts") || 0,
    salePrice: formData.get("salePrice"),
    opportunityDate: formData.get("opportunityDate"),
    notes: formData.get("notes"),
    status: formData.get("status") || "ENCONTRADA",
  })
}

export async function createRadarOpportunityAction(formData: FormData): Promise<ActionResult> {
  try {
    const data = parseForm(formData)
    const created = await repo.createRadarOpportunity(data)
    revalidatePath("/radar")
    return { ok: true, id: created.id }
  } catch (error) {
    return toFieldErrors(error)
  }
}

export async function updateRadarOpportunityAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const data = parseForm(formData)
    await repo.updateRadarOpportunity(id, data)
    revalidatePath("/radar")
    revalidatePath(`/radar/${id}`)
    return { ok: true, id }
  } catch (error) {
    return toFieldErrors(error)
  }
}

/** Atualização rápida apenas do status (a partir da tela de detalhes). */
export async function updateRadarStatusAction(
  id: string,
  status: RadarStatus,
): Promise<ActionResult> {
  try {
    await repo.updateRadarOpportunity(id, { status })
    revalidatePath("/radar")
    revalidatePath(`/radar/${id}`)
    return { ok: true, id }
  } catch {
    return { ok: false, error: "Não foi possível atualizar o status." }
  }
}

export async function deleteRadarOpportunityAction(id: string): Promise<ActionResult> {
  try {
    await repo.deleteRadarOpportunity(id)
    revalidatePath("/radar")
    return { ok: true }
  } catch {
    return { ok: false, error: "Não foi possível remover a oportunidade." }
  }
}
