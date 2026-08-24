"use server"

import { revalidatePath } from "next/cache"
import { repo } from "@/lib/services/repository"
import { productSchema } from "@/lib/validation"

export interface ActionResult {
  ok: boolean
  error?: string
  fieldErrors?: Record<string, string>
  id?: string
}

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
  return productSchema.parse({
    sku: formData.get("sku"),
    name: formData.get("name"),
    ean: formData.get("ean"),
    priceB2B: formData.get("priceB2B"),
    currentCost: formData.get("currentCost"),
    priority: formData.get("priority") || "NORMAL",
    manualStatus: formData.get("manualStatus") || null,
    monthlyDemand: formData.get("monthlyDemand"),
    minQty: formData.get("minQty"),
    maxQty: formData.get("maxQty"),
    notes: formData.get("notes"),
    active: formData.get("active") === "on" || formData.get("active") === "true",
  })
}

export async function createProductAction(formData: FormData): Promise<ActionResult> {
  try {
    const data = parseForm(formData)
    const created = await repo.createProduct(data)
    revalidatePath("/")
    revalidatePath("/produtos")
    return { ok: true, id: created.id }
  } catch (error) {
    return toFieldErrors(error)
  }
}

export async function updateProductAction(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const data = parseForm(formData)
    await repo.updateProduct(id, data)
    revalidatePath("/")
    revalidatePath("/produtos")
    revalidatePath(`/produtos/${id}`)
    return { ok: true, id }
  } catch (error) {
    return toFieldErrors(error)
  }
}

export async function toggleProductActiveAction(id: string, active: boolean): Promise<ActionResult> {
  try {
    await repo.setProductActive(id, active)
    revalidatePath("/")
    revalidatePath("/produtos")
    revalidatePath(`/produtos/${id}`)
    return { ok: true }
  } catch {
    return { ok: false, error: "Não foi possível atualizar o produto." }
  }
}
