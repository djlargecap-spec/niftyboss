import { createAdminClient } from "./supabase/admin"
import type { ScoringRule } from "./types"

export type PlayerStats = {
  runs: number
  balls_faced: number
  fours: number
  sixes: number
  wickets: number
  overs_bowled: number
  runs_conceded: number
  maidens: number
  catches: number
  stumpings: number
  run_outs: number
}

export async function loadScoringRules(): Promise<ScoringRule[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("scoring_rules")
    .select("*")
    .eq("is_active", true)
  if (error) throw new Error(`Failed to load scoring rules: ${error.message}`)
  return data as ScoringRule[]
}

export function calculatePlayerPoints(
  stats: PlayerStats,
  rules: ScoringRule[]
): { total: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {}
  const ruleMap = new Map(rules.map((r) => [r.name, r.points]))

  if (stats.runs > 0)    breakdown["run"]        = (ruleMap.get("run") ?? 0) * stats.runs
  if (stats.fours > 0)   breakdown["four_bonus"]  = (ruleMap.get("four_bonus") ?? 0) * stats.fours
  if (stats.sixes > 0)   breakdown["six_bonus"]   = (ruleMap.get("six_bonus") ?? 0) * stats.sixes
  if (stats.wickets > 0) breakdown["wicket"]      = (ruleMap.get("wicket") ?? 0) * stats.wickets
  if (stats.catches > 0) breakdown["catch"]       = (ruleMap.get("catch") ?? 0) * stats.catches

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0)
  return { total, breakdown }
}

export type UserMatchScoreInput = {
  userId: string
  selectionId: string
  captainId: string | null
  viceCaptainId: string | null
  isAutoPick: boolean
  playerIds: string[]
}

export function calculateUserMatchScore(
  selection: UserMatchScoreInput,
  playerScores: Map<string, number>
): { total: number; captainPoints: number; vcPoints: number } {
  let total = 0
  let captainPoints = 0
  let vcPoints = 0

  for (const playerId of selection.playerIds) {
    const base = playerScores.get(playerId) ?? 0
    let multiplier = 1

    if (!selection.isAutoPick) {
      if (playerId === selection.captainId) {
        multiplier = 2
        captainPoints = base
      } else if (playerId === selection.viceCaptainId) {
        multiplier = 1.5
        vcPoints = base * 0.5
      }
    }

    total += base * multiplier
  }

  return { total: Math.round(total), captainPoints, vcPoints: Math.round(vcPoints) }
}
