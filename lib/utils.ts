import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type {
  AcquisitionStatus,
  CommercialPriority,
  HuntPriority,
  HuntSourceType,
  HuntStatus,
  RadarClassification,
  RadarRecommendation,
  RadarSource,
  RadarStatus,
} from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatPercent(value: number | null | undefined, fractionDigits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

export const STATUS_META: Record<
  AcquisitionStatus,
  { label: string; short: string; tone: string; dot: string }
> = {
  HUNT_AGGRESSIVE: {
    label: "Caçar agressivamente",
    short: "Caçar +",
    tone: "border-status-hot/30 bg-status-hot/10 text-status-hot",
    dot: "bg-status-hot",
  },
  HUNT: {
    label: "Caçar",
    short: "Caçar",
    tone: "border-status-go/30 bg-status-go/10 text-status-go",
    dot: "bg-status-go",
  },
  MONITOR: {
    label: "Monitorar",
    short: "Monitorar",
    tone: "border-status-watch/30 bg-status-watch/10 text-status-watch",
    dot: "bg-status-watch",
  },
  DO_NOT_BUY: {
    label: "Não comprar",
    short: "Não comprar",
    tone: "border-status-stop/30 bg-status-stop/10 text-status-stop",
    dot: "bg-status-stop",
  },
}

export const PRIORITY_META: Record<CommercialPriority, { label: string }> = {
  HIGH: { label: "Alta" },
  NORMAL: { label: "Normal" },
  LOW: { label: "Baixa" },
}

/* ---------------------------------------------------------------------------
   RADAR JK (Fase 2) — metadados de exibição
   -------------------------------------------------------------------------- */

export const RADAR_CLASSIFICATION_META: Record<
  RadarClassification,
  { label: string; tone: string; dot: string }
> = {
  EXCELENTE: {
    label: "Oportunidade excelente",
    tone: "border-status-go/30 bg-status-go/10 text-status-go",
    dot: "bg-status-go",
  },
  BOA: {
    label: "Oportunidade boa",
    tone: "border-status-watch/30 bg-status-watch/10 text-status-watch",
    dot: "bg-status-watch",
  },
  AVALIAR: {
    label: "Avaliar",
    tone: "border-status-hot/30 bg-status-hot/10 text-status-hot",
    dot: "bg-status-hot",
  },
  NAO_VALE: {
    label: "Não vale a pena",
    tone: "border-status-stop/30 bg-status-stop/10 text-status-stop",
    dot: "bg-status-stop",
  },
}

export const RADAR_STATUS_META: Record<RadarStatus, { label: string; tone: string }> = {
  ENCONTRADA: { label: "Encontrada", tone: "border-border-strong bg-muted text-muted-foreground" },
  EM_ANALISE: { label: "Em análise", tone: "border-status-watch/30 bg-status-watch/10 text-status-watch" },
  APROVADA: { label: "Aprovada para compra", tone: "border-primary/30 bg-primary/10 text-primary" },
  COMPRADA: { label: "Comprada", tone: "border-status-hot/30 bg-status-hot/10 text-status-hot" },
  VENDIDA: { label: "Vendida", tone: "border-status-go/30 bg-status-go/10 text-status-go" },
  DESCARTADA: { label: "Descartada", tone: "border-status-stop/30 bg-status-stop/10 text-status-stop" },
}

export const RADAR_SOURCE_META: Record<RadarSource, { label: string }> = {
  OLX: { label: "OLX" },
  MERCADO_LIVRE: { label: "Mercado Livre" },
  CHATUBA: { label: "Chatuba" },
  MARKETPLACE: { label: "Marketplace" },
  OUTRO: { label: "Outro" },
}

/* ---------------------------------------------------------------------------
   CENTRAL DE CAÇA (Fase 4) — metadados de exibição
   -------------------------------------------------------------------------- */

export const HUNT_PRIORITY_META: Record<
  HuntPriority,
  { label: string; tone: string; dot: string }
> = {
  ALTA: {
    label: "Alta",
    tone: "border-status-hot/30 bg-status-hot/10 text-status-hot",
    dot: "bg-status-hot",
  },
  MEDIA: {
    label: "Média",
    tone: "border-status-watch/30 bg-status-watch/10 text-status-watch",
    dot: "bg-status-watch",
  },
  BAIXA: {
    label: "Baixa",
    tone: "border-border-strong bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
}

export const HUNT_STATUS_META: Record<HuntStatus, { label: string; tone: string }> = {
  ATIVA: { label: "Ativa", tone: "border-status-go/30 bg-status-go/10 text-status-go" },
  PAUSADA: { label: "Pausada", tone: "border-status-watch/30 bg-status-watch/10 text-status-watch" },
  CONCLUIDA: { label: "Concluída", tone: "border-primary/30 bg-primary/10 text-primary" },
  CANCELADA: { label: "Cancelada", tone: "border-status-stop/30 bg-status-stop/10 text-status-stop" },
}

export const HUNT_SOURCE_TYPE_META: Record<HuntSourceType, { label: string }> = {
  MARKETPLACE: { label: "Marketplace" },
  LOJA_FISICA: { label: "Loja física" },
  FORNECEDOR: { label: "Fornecedor" },
  OUTRO: { label: "Outro" },
}

/**
 * Monta a URL de abertura de uma fonte para um termo de busca. Prioriza o
 * template de busca conhecido; se não houver, cai na urlBase. Nunca inventa
 * URLs de pesquisa.
 */
export function buildSourceOpenUrl(
  source: { urlBase: string | null; searchUrlTemplate: string | null },
  searchTerm: string,
): { openUrl: string | null; isSearch: boolean } {
  const term = searchTerm.trim()
  if (source.searchUrlTemplate && term) {
    return {
      openUrl: source.searchUrlTemplate.replace("{q}", encodeURIComponent(term)),
      isSearch: true,
    }
  }
  if (source.urlBase) return { openUrl: source.urlBase, isSearch: false }
  return { openUrl: null, isSearch: false }
}

/**
 * Mapeia uma fonte de caça (Fase 4) para o enum de fonte do Radar (Fase 3),
 * usado ao converter uma missão em oportunidade via "Encontrei".
 */
export function huntSourceToRadarSource(name: string): RadarSource {
  const normalized = name.trim().toLowerCase()
  if (normalized.includes("olx")) return "OLX"
  if (normalized.includes("mercado")) return "MERCADO_LIVRE"
  if (normalized.includes("chatuba")) return "CHATUBA"
  if (
    normalized.includes("marketplace") ||
    normalized.includes("facebook") ||
    normalized.includes("shopee")
  ) {
    return "MARKETPLACE"
  }
  return "OUTRO"
}

/* ---------------------------------------------------------------------------
   RADAR JK (Fase 3) — recomendação de caça
   -------------------------------------------------------------------------- */

export const RADAR_RECOMMENDATION_META: Record<
  RadarRecommendation,
  { label: string; short: string; tone: string; dot: string; hint: string }
> = {
  CACAR: {
    label: "Caçar agora",
    short: "CAÇAR",
    tone: "border-status-go/40 bg-status-go/10 text-status-go",
    dot: "bg-status-go",
    hint: "Preço encontrado dentro da faixa recomendada.",
  },
  AVALIAR: {
    label: "Avaliar",
    short: "AVALIAR",
    tone: "border-status-hot/40 bg-status-hot/10 text-status-hot",
    dot: "bg-status-hot",
    hint: "Acima do recomendado, mas ainda dentro do limite máximo.",
  },
  NAO_VALE: {
    label: "Não vale a pena",
    short: "NÃO VALE",
    tone: "border-status-stop/40 bg-status-stop/10 text-status-stop",
    dot: "bg-status-stop",
    hint: "Preço encontrado acima do máximo que a JK pode pagar.",
  },
}
