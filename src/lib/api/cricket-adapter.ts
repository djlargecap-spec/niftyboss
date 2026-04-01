/**
 * Generic Cricket Data Provider Interface
 * Implement this interface for your cricket data API (e.g., CricAPI, SportMonks, custom).
 * See README.md for details on each method.
 */

import type { PlayerStats } from "@/lib/scoring"

// ─── Types ─────────────────────────────────────────────────────────────

export type ScorecardInnings = {
  batting: Array<{
    batsman: { name: string }
    r: number
    b: number
    "4s": number
    "6s": number
    dismissal?: string
  }>
  bowling: Array<{
    bowler: { name: string }
    o: number
    m: number
    r: number
    w: number
  }>
  fielding?: Array<{
    fielder: { name: string }
    catches?: number
    stumpings?: number
    runouts?: number
  }>
}

export type MatchPointsResult = {
  innings: ScorecardInnings[]
  totals: Array<{ id: string; name: string }>
}

export type LiveScoreItem = {
  id: string
  ms: "fixture" | "live" | "result" | string
  t1s: string
  t2s: string
  series: string
  note: string | null
}

export type FixtureInfo = {
  id: number | string
  status: string
  live: boolean
  winner_team_id: number | string | null
  note: string | null
  starting_at: string
}

export type SeasonFixture = {
  id: number | string
  round: string
  status: string
  live: boolean
  starting_at: string
  localteam_id: number | string
  visitorteam_id: number | string
}

// ─── Interface ─────────────────────────────────────────────────────────

export interface ICricketDataProvider {
  /** Fetch full scorecard (batting/bowling/fielding) + player list for a match */
  fetchMatchPoints(matchExternalId: string): Promise<MatchPointsResult | null>

  /** Fetch live scores for currently active matches */
  fetchLiveScores(): Promise<LiveScoreItem[] | null>

  /** Fetch match status/info (to detect completion) */
  fetchMatchInfo(matchExternalId: string): Promise<FixtureInfo | null>

  /** Fetch scorecard only (convenience — can delegate to fetchMatchPoints) */
  fetchScorecard(matchExternalId: string): Promise<ScorecardInnings[] | null>

  /** Fetch lineup/squad for a specific match */
  fetchSquad(matchExternalId: string): Promise<Array<{ name: string; id: string }> | null>

  /** Fetch all season fixtures */
  fetchSeasonFixtures(): Promise<SeasonFixture[] | null>

  /** Team ID mapping: external API team ID → DB team short_name */
  getTeamMap(): Record<string | number, string>
}

// ─── No-op default implementation ──────────────────────────────────────

export class NoOpCricketProvider implements ICricketDataProvider {
  async fetchMatchPoints() {
    console.warn("[CricketAPI] No provider configured — implement ICricketDataProvider")
    return null
  }
  async fetchLiveScores() {
    console.warn("[CricketAPI] No provider configured")
    return null
  }
  async fetchMatchInfo() {
    console.warn("[CricketAPI] No provider configured")
    return null
  }
  async fetchScorecard() {
    console.warn("[CricketAPI] No provider configured")
    return null
  }
  async fetchSquad() {
    console.warn("[CricketAPI] No provider configured")
    return null
  }
  async fetchSeasonFixtures() {
    console.warn("[CricketAPI] No provider configured")
    return null
  }
  getTeamMap() {
    return {}
  }
}
