import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AcquisitionStatus, CommercialPriority } from "@/types"

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
