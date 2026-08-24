import { z } from "zod"

const priority = z.enum(["LOW", "NORMAL", "HIGH"])
const status = z.enum(["HUNT_AGGRESSIVE", "HUNT", "MONITOR", "DO_NOT_BUY"])

const optionalNumber = z
  .union([z.number(), z.string()])
  .transform((v) => (v === "" || v === null || v === undefined ? null : Number(v)))
  .nullable()
  .refine((v) => v === null || (!Number.isNaN(v) && v >= 0), { message: "Valor inválido" })

const money = z
  .union([z.number(), z.string()])
  .transform((v) => Number(v))
  .refine((v) => !Number.isNaN(v) && v >= 0, { message: "Valor inválido" })

export const productSchema = z.object({
  sku: z.string().trim().min(1, "SKU obrigatório"),
  name: z.string().trim().min(1, "Nome obrigatório"),
  ean: z.string().trim().nullable().optional().transform((v) => v || null),
  priceB2B: money,
  currentCost: money,
  priority: priority.default("NORMAL"),
  manualStatus: status.nullable().optional().transform((v) => v ?? null),
  monthlyDemand: optionalNumber.optional().transform((v) => v ?? null),
  minQty: optionalNumber.optional().transform((v) => v ?? null),
  maxQty: optionalNumber.optional().transform((v) => v ?? null),
  notes: z.string().trim().nullable().optional().transform((v) => v || null),
  active: z.boolean().default(true),
})

export const buyerSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório"),
  company: z.string().trim().nullable().optional().transform((v) => v || null),
  phone: z.string().trim().nullable().optional().transform((v) => v || null),
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .nullable()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  active: z.boolean().default(true),
  notes: z.string().trim().nullable().optional().transform((v) => v || null),
})

export const buyerProductSchema = z.object({
  buyerId: z.string().min(1),
  productId: z.string().min(1),
  maxPrice: optionalNumber.optional().transform((v) => v ?? null),
  minQty: optionalNumber.optional().transform((v) => v ?? null),
  maxQty: optionalNumber.optional().transform((v) => v ?? null),
  frequency: z.string().trim().nullable().optional().transform((v) => v || null),
  notes: z.string().trim().nullable().optional().transform((v) => v || null),
})

export const offerSchema = z.object({
  productId: z.string().min(1, "Produto obrigatório"),
  source: z.string().trim().min(1, "Fonte obrigatória"),
  url: z.string().trim().url("URL inválida").nullable().optional().or(z.literal("")).transform((v) => v || null),
  price: money,
  availableQty: optionalNumber.optional().transform((v) => v ?? null),
  shipping: money.default(0),
  notes: z.string().trim().nullable().optional().transform((v) => v || null),
})

const radarSource = z.enum(["OLX", "MERCADO_LIVRE", "CHATUBA", "MARKETPLACE", "OUTRO"])
const radarStatus = z.enum([
  "ENCONTRADA",
  "EM_ANALISE",
  "APROVADA",
  "COMPRADA",
  "VENDIDA",
  "DESCARTADA",
])

export const radarOpportunitySchema = z.object({
  sku: z.string().trim().nullable().optional().transform((v) => v || null),
  name: z.string().trim().min(1, "Nome do produto obrigatório"),
  brand: z.string().trim().nullable().optional().transform((v) => v || null),
  source: radarSource.default("OUTRO"),
  url: z
    .string()
    .trim()
    .url("URL inválida")
    .nullable()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  announcedPrice: money,
  availableQty: optionalNumber.optional().transform((v) => v ?? null),
  shipping: money.default(0),
  otherCosts: money.default(0),
  salePrice: money,
  opportunityDate: z
    .string()
    .trim()
    .min(1, "Data obrigatória")
    .transform((v) => new Date(v).toISOString()),
  notes: z.string().trim().nullable().optional().transform((v) => v || null),
  status: radarStatus.default("ENCONTRADA"),
})

/* ---------------------------------------------------------------------------
   CENTRAL DE CAÇA (Fase 4)
   -------------------------------------------------------------------------- */

const huntPriority = z.enum(["ALTA", "MEDIA", "BAIXA"])
const huntStatus = z.enum(["ATIVA", "PAUSADA", "CONCLUIDA", "CANCELADA"])
const huntSourceType = z.enum(["MARKETPLACE", "LOJA_FISICA", "FORNECEDOR", "OUTRO"])

const optionalUrl = z
  .string()
  .trim()
  .url("URL inválida")
  .nullable()
  .optional()
  .or(z.literal(""))
  .transform((v) => v || null)

export const huntSourceSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório"),
  type: huntSourceType.default("OUTRO"),
  urlBase: optionalUrl,
  searchUrlTemplate: z
    .string()
    .trim()
    .nullable()
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null)
    .refine((v) => v === null || v.includes("{q}"), {
      message: "O template deve conter {q} onde entra o termo de busca.",
    }),
  active: z.boolean().default(true),
})

export const huntMissionSchema = z.object({
  name: z.string().trim().min(1, "Nome da missão obrigatório"),
  description: z.string().trim().nullable().optional().transform((v) => v || null),
  sku: z.string().trim().nullable().optional().transform((v) => v || null),
  searchTerm: z.string().trim().min(1, "Produto / termo de busca obrigatório"),
  brand: z.string().trim().nullable().optional().transform((v) => v || null),
  category: z.string().trim().nullable().optional().transform((v) => v || null),
  expectedSalePrice: money,
  sourceIds: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((v) => {
      if (!v) return [] as string[]
      const arr = Array.isArray(v) ? v : [v]
      return arr.map((s) => s.trim()).filter(Boolean)
    }),
  priority: huntPriority.default("MEDIA"),
  status: huntStatus.default("ATIVA"),
  notes: z.string().trim().nullable().optional().transform((v) => v || null),
})

export const settingsSchema = z
  .object({
    costPct: z.coerce.number().min(0).max(100),
    marginPct: z.coerce.number().min(0).max(100),
    taxPct: z.coerce.number().min(0).max(100),
  })
  .refine((s) => Math.abs(s.costPct + s.marginPct + s.taxPct - 100) < 0.001, {
    message: "A soma de custo, margem e impostos deve ser exatamente 100%.",
    path: ["costPct"],
  })
