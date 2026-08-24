import "server-only"
import type {
  HuntMissionWithMetrics,
  HuntSource,
  HuntSourceLink,
} from "@/types"
import { computeMissionMetrics, sortByHuntPriority } from "@/lib/calculations/hunt"
import { buildSourceOpenUrl } from "@/lib/utils"
import { repo } from "./repository"

/** Resolve os IDs de fontes de uma missão para os objetos de fonte existentes. */
function resolveSources(sourceIds: string[], byId: Map<string, HuntSource>): HuntSource[] {
  return sourceIds.map((id) => byId.get(id)).filter((s): s is HuntSource => Boolean(s))
}

/** Missões com métricas (motor reverso) e fontes resolvidas, já ordenadas. */
export async function getHuntMissionsWithMetrics(): Promise<HuntMissionWithMetrics[]> {
  const [missions, sources] = await Promise.all([repo.listHuntMissions(), repo.listHuntSources()])
  const byId = new Map(sources.map((s) => [s.id, s]))

  const withMetrics = missions.map((mission) => ({
    ...mission,
    metrics: computeMissionMetrics(mission),
    sources: resolveSources(mission.sourceIds, byId),
  }))

  return sortByHuntPriority(withMetrics)
}

export async function getHuntMissionWithMetrics(
  id: string,
): Promise<HuntMissionWithMetrics | null> {
  const mission = await repo.getHuntMission(id)
  if (!mission) return null
  const sources = await repo.listHuntSources()
  const byId = new Map(sources.map((s) => [s.id, s]))
  return {
    ...mission,
    metrics: computeMissionMetrics(mission),
    sources: resolveSources(mission.sourceIds, byId),
  }
}

export async function getHuntSources(): Promise<HuntSource[]> {
  return repo.listHuntSources()
}

export async function getActiveHuntSources(): Promise<HuntSource[]> {
  const sources = await repo.listHuntSources()
  return sources.filter((s) => s.active)
}

/** Monta os links de abertura das fontes de uma missão para o termo de busca. */
export function buildSourceLinks(sources: HuntSource[], searchTerm: string): HuntSourceLink[] {
  return sources.map((source) => {
    const { openUrl, isSearch } = buildSourceOpenUrl(source, searchTerm)
    return { ...source, openUrl, isSearch }
  })
}

export interface HuntDashboardData {
  activeCount: number
  highPriorityCount: number
  concludedCount: number
  foundTodayCount: number
  huntNow: HuntMissionWithMetrics[]
}

/** Resumo das missões para o Dashboard. */
export async function getHuntDashboardData(): Promise<HuntDashboardData> {
  const [missions, radar] = await Promise.all([
    getHuntMissionsWithMetrics(),
    repo.listRadarOpportunities(),
  ])

  const active = missions.filter((m) => m.status === "ATIVA")
  const highPriority = active.filter((m) => m.priority === "ALTA")
  const concluded = missions.filter((m) => m.status === "CONCLUIDA")

  // Oportunidades encontradas hoje = oportunidades do Radar criadas hoje.
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const foundTodayCount = radar.filter((o) => new Date(o.createdAt) >= startOfToday).length

  return {
    activeCount: active.length,
    highPriorityCount: highPriority.length,
    concludedCount: concluded.length,
    foundTodayCount,
    // "Caçar agora": só missões ativas, já ordenadas por prioridade + potencial.
    huntNow: active,
  }
}
