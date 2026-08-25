"use server"

import { revalidatePath } from "next/cache"
import { repo } from "@/lib/services/repository"
import { syncMissionSearchQueries } from "@/lib/services/hunt-service"
import { huntMissionSchema, huntSourceSchema } from "@/lib/validation"
import type { HuntPriority, HuntStatus } from "@/types"
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

/* -----------------------------------------------------------------------------
   MISSÕES
   -------------------------------------------------------------------------- */

function parseMission(formData: FormData) {
  return huntMissionSchema.parse({
    name: formData.get("name"),
    description: formData.get("description"),
    sku: formData.get("sku"),
    searchTerm: formData.get("searchTerm"),
    brand: formData.get("brand"),
    category: formData.get("category"),
    expectedSalePrice: formData.get("expectedSalePrice"),
    sourceIds: formData.getAll("sourceIds"),
    priority: formData.get("priority") || "MEDIA",
    status: formData.get("status") || "ATIVA",
    notes: formData.get("notes"),
  })
}

export async function createHuntMissionAction(formData: FormData): Promise<ActionResult> {
  try {
    const data = parseMission(formData)
    const created = await repo.createHuntMission(data)
    // Fase 5: gera as consultas inteligentes já na criação da missão.
    await syncMissionSearchQueries(created.id)
    revalidatePath("/caca")
    revalidatePath(`/caca/${created.id}`)
    revalidatePath("/")
    return { ok: true, id: created.id }
  } catch (error) {
    return toFieldErrors(error)
  }
}

export async function updateHuntMissionAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const data = parseMission(formData)
    await repo.updateHuntMission(id, data)
    // Fase 5: dados principais mudaram → regenera as consultas (sem duplicar).
    await syncMissionSearchQueries(id)
    revalidatePath("/caca")
    revalidatePath(`/caca/${id}`)
    revalidatePath("/")
    return { ok: true, id }
  } catch (error) {
    return toFieldErrors(error)
  }
}

export async function updateHuntMissionStatusAction(
  id: string,
  status: HuntStatus,
): Promise<ActionResult> {
  try {
    await repo.updateHuntMission(id, { status })
    revalidatePath("/caca")
    revalidatePath(`/caca/${id}`)
    revalidatePath("/")
    return { ok: true, id }
  } catch {
    return { ok: false, error: "Não foi possível atualizar o status da missão." }
  }
}

export async function updateHuntMissionPriorityAction(
  id: string,
  priority: HuntPriority,
): Promise<ActionResult> {
  try {
    await repo.updateHuntMission(id, { priority })
    revalidatePath("/caca")
    revalidatePath(`/caca/${id}`)
    revalidatePath("/")
    return { ok: true, id }
  } catch {
    return { ok: false, error: "Não foi possível atualizar a prioridade." }
  }
}

export async function deleteHuntMissionAction(id: string): Promise<ActionResult> {
  try {
    await repo.deleteHuntMission(id)
    revalidatePath("/caca")
    revalidatePath("/")
    return { ok: true }
  } catch {
    return { ok: false, error: "Não foi possível remover a missão." }
  }
}

/* -----------------------------------------------------------------------------
   FONTES
   -------------------------------------------------------------------------- */

function parseSource(formData: FormData) {
  return huntSourceSchema.parse({
    name: formData.get("name"),
    type: formData.get("type") || "OUTRO",
    urlBase: formData.get("urlBase"),
    searchUrlTemplate: formData.get("searchUrlTemplate"),
    active: formData.get("active") === "on" || formData.get("active") === "true",
  })
}

export async function createHuntSourceAction(formData: FormData): Promise<ActionResult> {
  try {
    const data = parseSource(formData)
    const created = await repo.createHuntSource(data)
    revalidatePath("/caca/fontes")
    revalidatePath("/caca")
    return { ok: true, id: created.id }
  } catch (error) {
    return toFieldErrors(error)
  }
}

export async function updateHuntSourceAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const data = parseSource(formData)
    await repo.updateHuntSource(id, data)
    revalidatePath("/caca/fontes")
    revalidatePath("/caca")
    return { ok: true, id }
  } catch (error) {
    return toFieldErrors(error)
  }
}

export async function toggleHuntSourceAction(id: string, active: boolean): Promise<ActionResult> {
  try {
    await repo.updateHuntSource(id, { active })
    revalidatePath("/caca/fontes")
    revalidatePath("/caca")
    return { ok: true, id }
  } catch {
    return { ok: false, error: "Não foi possível atualizar a fonte." }
  }
}

export async function deleteHuntSourceAction(id: string): Promise<ActionResult> {
  try {
    await repo.deleteHuntSource(id)
    revalidatePath("/caca/fontes")
    revalidatePath("/caca")
    return { ok: true }
  } catch {
    return { ok: false, error: "Não foi possível remover a fonte." }
  }
}
