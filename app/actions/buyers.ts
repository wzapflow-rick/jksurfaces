"use server"

import { revalidatePath } from "next/cache"
import { repo } from "@/lib/services/repository"
import { buyerProductSchema, buyerSchema } from "@/lib/validation"
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

function parseBuyer(formData: FormData) {
  return buyerSchema.parse({
    name: formData.get("name"),
    company: formData.get("company"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    notes: formData.get("notes"),
    active: formData.get("active") === "on" || formData.get("active") === "true",
  })
}

export async function createBuyerAction(formData: FormData): Promise<ActionResult> {
  try {
    const data = parseBuyer(formData)
    const created = await repo.createBuyer(data)
    revalidatePath("/compradores")
    return { ok: true, id: created.id }
  } catch (error) {
    return toFieldErrors(error)
  }
}

export async function updateBuyerAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const data = parseBuyer(formData)
    await repo.updateBuyer(id, data)
    revalidatePath("/compradores")
    revalidatePath(`/compradores/${id}`)
    return { ok: true, id }
  } catch (error) {
    return toFieldErrors(error)
  }
}

export async function toggleBuyerActiveAction(id: string, active: boolean): Promise<ActionResult> {
  try {
    await repo.setBuyerActive(id, active)
    revalidatePath("/compradores")
    revalidatePath(`/compradores/${id}`)
    return { ok: true }
  } catch {
    return { ok: false, error: "Não foi possível atualizar o comprador." }
  }
}

export async function addBuyerProductAction(formData: FormData): Promise<ActionResult> {
  try {
    const data = buyerProductSchema.parse({
      buyerId: formData.get("buyerId"),
      productId: formData.get("productId"),
      maxPrice: formData.get("maxPrice"),
      minQty: formData.get("minQty"),
      maxQty: formData.get("maxQty"),
      frequency: formData.get("frequency"),
      notes: formData.get("notes"),
    })
    await repo.addBuyerProduct(data)
    revalidatePath(`/compradores/${data.buyerId}`)
    return { ok: true }
  } catch (error) {
    return toFieldErrors(error)
  }
}

export async function removeBuyerProductAction(id: string, buyerId: string): Promise<ActionResult> {
  try {
    await repo.removeBuyerProduct(id)
    revalidatePath(`/compradores/${buyerId}`)
    return { ok: true }
  } catch {
    return { ok: false, error: "Não foi possível remover o vínculo." }
  }
}
