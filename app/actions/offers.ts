"use server"

import { revalidatePath } from "next/cache"
import { repo } from "@/lib/services/repository"
import { offerSchema } from "@/lib/validation"
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

export async function createOfferAction(formData: FormData): Promise<ActionResult> {
  try {
    const data = offerSchema.parse({
      productId: formData.get("productId"),
      source: formData.get("source"),
      url: formData.get("url"),
      price: formData.get("price"),
      availableQty: formData.get("availableQty"),
      shipping: formData.get("shipping") || 0,
      notes: formData.get("notes"),
    })
    const created = await repo.createOffer(data)
    revalidatePath("/oportunidades")
    revalidatePath("/")
    return { ok: true, id: created.id }
  } catch (error) {
    return toFieldErrors(error)
  }
}

export async function deleteOfferAction(id: string): Promise<ActionResult> {
  try {
    await repo.deleteOffer(id)
    revalidatePath("/oportunidades")
    revalidatePath("/")
    return { ok: true }
  } catch {
    return { ok: false, error: "Não foi possível remover a oportunidade." }
  }
}
