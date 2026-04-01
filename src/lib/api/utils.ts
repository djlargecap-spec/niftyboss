/**
 * Shared utilities for cricket data parsing.
 * These are pure functions — not tied to any specific API provider.
 */

import type { ScorecardInnings } from "./cricket-adapter"

// ─── Name normalization & matching ─────────────────────────────────────

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Fuzzy match an API player name against a map of normalized DB names.
 * Tries: exact match → substring match → last-name match.
 */
export function fuzzyMatchName(
  apiName: string,
  dbNames: Map<string, string>
): string | null {
  const normalized = normalizeName(apiName)

  if (dbNames.has(normalized)) return dbNames.get(normalized)!

  for (const [dbNorm, dbId] of dbNames) {
    if (dbNorm.includes(normalized) || normalized.includes(dbNorm)) {
      return dbId
    }
  }

  const apiLast = normalized.split(" ").pop() ?? ""
  for (const [dbNorm, dbId] of dbNames) {
    const dbLast = dbNorm.split(" ").pop() ?? ""
    if (apiLast === dbLast && apiLast.length > 3) {
      return dbId
    }
  }

  return null
}

// ─── Scorecard → PlayerStats parsing ───────────────────────────────────

export type ParsedPlayerStats = {
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

export type ParsedStats = Map<string, ParsedPlayerStats>

/**
 * Parse scorecard innings into a map of normalized player name → stats.
 * Works with any data source that produces the ScorecardInnings shape.
 */
export function parseScorecardToStats(innings: ScorecardInnings[]): ParsedStats {
  const stats: ParsedStats = new Map()

  function getOrInit(name: string) {
    const key = normalizeName(name)
    if (!stats.has(key)) {
      stats.set(key, {
        runs: 0,
        balls_faced: 0,
        fours: 0,
        sixes: 0,
        wickets: 0,
        overs_bowled: 0,
        runs_conceded: 0,
        maidens: 0,
        catches: 0,
        stumpings: 0,
        run_outs: 0,
      })
    }
    return stats.get(key)!
  }

  for (const inning of innings) {
    for (const b of inning.batting ?? []) {
      const s = getOrInit(b.batsman.name)
      s.runs += b.r
      s.balls_faced += b.b
      s.fours += b["4s"]
      s.sixes += b["6s"]
    }

    for (const b of inning.bowling ?? []) {
      const s = getOrInit(b.bowler.name)
      s.wickets += b.w
      s.overs_bowled += b.o
      s.runs_conceded += b.r
      s.maidens += b.m
    }

    for (const f of inning.fielding ?? []) {
      const s = getOrInit(f.fielder.name)
      s.catches += f.catches ?? 0
      s.stumpings += f.stumpings ?? 0
      s.run_outs += f.runouts ?? 0
    }
  }

  return stats
}
