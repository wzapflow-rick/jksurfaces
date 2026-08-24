"use server"

import { revalidatePath } from "next/cache"
import { repo } from "@/lib/services/repository"
import { settingsSchema } from "@/lib/validation"
import type { ActionResult } from "./products"

export async function updateSettingsAction(formData: FormData): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse({
    costPct: formData.get("costPct"),
    marginPct: formData.get("marginPct"),
    taxPct: formData.get("taxPct"),
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form")
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return { ok: false, fieldErrors, error: parsed.error.issues[0]?.message }
  }

  try {
    await repo.updateSettings(parsed.data)
    revalidatePath("/")
    revalidatePath("/produtos")
    revalidatePath("/oportunidades")
    revalidatePath("/configuracoes")
    return { ok: true }
  } catch {
    return { ok: false, error: "Não foi possível salvar as configurações." }
  }
}
