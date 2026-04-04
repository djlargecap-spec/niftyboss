/**
 * SportMonks Cricket API v2 provider for CricBoss.
 * Implements ICricketDataProvider using IPL 2026 (league_id=1, season_id=1795).
 *
 * Environment variables required:
 *   CRICKET_API_KEY           — SportMonks API token
 *   CRICKET_API_BASE_URL      — defaults to https://cricket.sportmonks.com/api/v2.0
 *   SPORTMONKS_SEASON_ID      — defaults to 1795 (IPL 2026)
 */

import type {
  ICricketDataProvider,
  MatchPointsResult,
  LiveScoreItem,
  FixtureInfo,
  ScorecardInnings,
  SeasonFixture,
} from "./cricket-adapter"

// SportMonks team ID → DB team short_name (IPL 2026)
const SM_TEAM_MAP: Record<number, string> = {
  2: "CSK",
  3: "DC",
  4: "PBKS",
  5: "KKR",
  6: "MI",
  7: "RR",
  8: "RCB",
  9: "SRH",
  1976: "GT",
  1979: "LSG",
}

// TBC placeholder team ID — exclude from fixture imports
const TBC_TEAM_ID = 2732

export class SportMonksProvider implements ICricketDataProvider {
  private readonly base: string
  private readonly token: string
  private readonly seasonId: string

  constructor(token: string, base: string, seasonId: string) {
    this.token = token
    this.base = base.replace(/\/$/, "")
    this.seasonId = seasonId
  }

  private async get(path: string, params: Record<string, string> = {}): Promise<unknown> {
    const url = new URL(`${this.base}${path}`)
    url.searchParams.set("api_token", this.token)
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }
    const res = await fetch(url.toString(), { next: { revalidate: 0 } })
    if (!res.ok) {
      throw new Error(`SportMonks HTTP ${res.status} for ${path}`)
    }
    const json = (await res.json()) as Record<string, unknown>
    if (json.status === "error") {
      const msg = (json.message as Record<string, unknown> | null)?.message ?? "SportMonks API error"
      throw new Error(String(msg))
    }
    return json
  }

  // ─── fetchSeasonFixtures ───────────────────────────────────────────────

  async fetchSeasonFixtures(): Promise<SeasonFixture[] | null> {
    try {
      const json = (await this.get("/fixtures", {
        "filter[season_id]": this.seasonId,
        include: "localteam,visitorteam",
        per_page: "200",
      })) as { data?: SmFixture[] }

      return (json.data ?? [])
        .filter((f) => f.localteam_id !== TBC_TEAM_ID && f.visitorteam_id !== TBC_TEAM_ID)
        .map((f) => ({
          id: f.id,
          round: f.round ?? "",
          status: f.status,
          live: f.live,
          starting_at: f.starting_at,
          localteam_id: f.localteam_id,
          visitorteam_id: f.visitorteam_id,
        }))
    } catch (err) {
      console.error("[SportMonks] fetchSeasonFixtures:", err)
      return null
    }
  }

  // ─── fetchMatchInfo ────────────────────────────────────────────────────

  async fetchMatchInfo(matchExternalId: string): Promise<FixtureInfo | null> {
    try {
      const json = (await this.get(`/fixtures/${matchExternalId}`)) as { data?: SmFixture }
      const f = json.data
      if (!f) return null
      return {
        id: f.id,
        status: f.status,
        live: f.status === "Live",
        winner_team_id: f.winner_team_id ?? null,
        note: f.note ?? null,
        starting_at: f.starting_at,
      }
    } catch (err) {
      console.error("[SportMonks] fetchMatchInfo:", matchExternalId, err)
      return null
    }
  }

  // ─── fetchSquad ────────────────────────────────────────────────────────

  async fetchSquad(matchExternalId: string): Promise<Array<{ name: string; id: string }> | null> {
    try {
      const json = (await this.get(`/fixtures/${matchExternalId}`, {
        include: "lineup",
      })) as { data?: { lineup?: SmLineupPlayer[] } }

      const lineup = json.data?.lineup ?? []
      return lineup
        .filter((p) => !p.lineup?.substitution)
        .map((p) => ({ id: String(p.id), name: p.fullname }))
    } catch (err) {
      console.error("[SportMonks] fetchSquad:", matchExternalId, err)
      return null
    }
  }

  // ─── fetchMatchPoints ──────────────────────────────────────────────────
  //
  // include=batting.result,bowling,lineup
  //   batting.result  → batting rows with result.name embedded (dismissal type)
  //   bowling         → bowling rows
  //   lineup          → all players (22 starters + substitutes)

  async fetchMatchPoints(matchExternalId: string): Promise<MatchPointsResult | null> {
    try {
      const json = (await this.get(`/fixtures/${matchExternalId}`, {
        include: "batting.result,bowling,lineup",
      })) as { data?: SmMatchDetail }

      const d = json.data
      if (!d) return null

      const lineup = d.lineup ?? []
      const batting = d.batting ?? []
      const bowling = d.bowling ?? []

      // Build player ID → name from ALL lineup players (starters + subs for fielding credit)
      const pidToName = new Map<number, string>()
      for (const p of lineup) {
        pidToName.set(p.id, p.fullname)
      }

      // Only starters go into totals (the actual Playing XI)
      const totals = lineup
        .filter((p) => !p.lineup?.substitution)
        .map((p) => ({ id: String(p.id), name: p.fullname }))

      if (totals.length === 0 && batting.length === 0) return null

      // Group batting by scoreboard (S1 = 1st innings, S2 = 2nd innings)
      const inningsBatting = groupByScoreboard(batting)
      const inningsBowling = groupByScoreboard(bowling)

      // Tally fielding events from batting dismissals
      const fieldingMap = new Map<number, { catches: number; stumpings: number; runouts: number }>()

      const getOrInitFielder = (id: number) => {
        if (!fieldingMap.has(id)) {
          fieldingMap.set(id, { catches: 0, stumpings: 0, runouts: 0 })
        }
        return fieldingMap.get(id)!
      }

      for (const b of batting) {
        const resultName = (b.result as SmResult | undefined)?.name ?? ""
        if (resultName === "Catch Out" && b.catch_stump_player_id) {
          getOrInitFielder(b.catch_stump_player_id).catches += 1
        } else if (resultName === "Stumped" && b.catch_stump_player_id) {
          getOrInitFielder(b.catch_stump_player_id).stumpings += 1
        } else if (resultName === "Run Out" && b.runout_by_id) {
          getOrInitFielder(b.runout_by_id).runouts += 1
        }
      }

      // Build innings array in scoreboard order (S1 → S2 → ...)
      const innings: ScorecardInnings[] = []
      for (const sb of ["S1", "S2", "S3", "S4"] as const) {
        const batRows = inningsBatting.get(sb)
        const bowlRows = inningsBowling.get(sb)
        if (!batRows && !bowlRows) continue

        const battingArr = (batRows ?? []).map((b) => ({
          batsman: { name: pidToName.get(b.player_id) ?? `Player#${b.player_id}` },
          r: b.score,
          b: b.ball,
          "4s": b.four_x,
          "6s": b.six_x,
          dismissal: (b.result as SmResult | undefined)?.name,
        }))

        const bowlingArr = (bowlRows ?? []).map((b) => ({
          bowler: { name: pidToName.get(b.player_id) ?? `Player#${b.player_id}` },
          o: b.overs,
          m: b.medians,
          r: b.runs,
          w: b.wickets,
        }))

        innings.push({ batting: battingArr, bowling: bowlingArr })
      }

      // Attach fielding events to first innings (scoring engine aggregates across all innings)
      if (innings.length > 0 && fieldingMap.size > 0) {
        innings[0].fielding = []
        for (const [id, stats] of fieldingMap) {
          const name = pidToName.get(id)
          if (!name) continue
          innings[0].fielding.push({
            fielder: { name },
            catches: stats.catches || undefined,
            stumpings: stats.stumpings || undefined,
            runouts: stats.runouts || undefined,
          })
        }
      }

      return { innings, totals }
    } catch (err) {
      console.error("[SportMonks] fetchMatchPoints:", matchExternalId, err)
      return null
    }
  }

  // ─── fetchScorecard ────────────────────────────────────────────────────

  async fetchScorecard(matchExternalId: string): Promise<ScorecardInnings[] | null> {
    const result = await this.fetchMatchPoints(matchExternalId)
    return result?.innings ?? null
  }

  // ─── fetchLiveScores ───────────────────────────────────────────────────

  async fetchLiveScores(): Promise<LiveScoreItem[] | null> {
    try {
      const json = (await this.get("/fixtures", {
        "filter[season_id]": this.seasonId,
        "filter[status]": "Live",
        include: "localteam,visitorteam,runs",
      })) as { data?: SmFixture[] }

      return (json.data ?? []).map((f) => ({
        id: String(f.id),
        ms: "live",
        t1s: (f as SmFixtureWithTeams).localteam?.name ?? "",
        t2s: (f as SmFixtureWithTeams).visitorteam?.name ?? "",
        series: "IPL 2026",
        note: f.note ?? null,
      }))
    } catch (err) {
      console.error("[SportMonks] fetchLiveScores:", err)
      return null
    }
  }

  // ─── getTeamMap ────────────────────────────────────────────────────────

  getTeamMap(): Record<string | number, string> {
    return SM_TEAM_MAP as unknown as Record<string | number, string>
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────

function groupByScoreboard<T extends { scoreboard: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const r of rows) {
    const key = r.scoreboard
    const list = map.get(key) ?? []
    list.push(r)
    map.set(key, list)
  }
  return map
}

// ─── SportMonks API response types (internal) ───────────────────────────

interface SmFixture {
  id: number
  round: string | null
  status: string
  live: boolean
  starting_at: string
  localteam_id: number
  visitorteam_id: number
  winner_team_id?: number | null
  note?: string | null
  draw_noresult?: boolean | null
}

interface SmFixtureWithTeams extends SmFixture {
  localteam?: { name: string }
  visitorteam?: { name: string }
}

interface SmLineupPlayer {
  id: number
  fullname: string
  lineup?: {
    team_id: number
    captain: boolean
    wicketkeeper: boolean
    substitution: boolean
  }
}

interface SmBattingRow {
  player_id: number
  scoreboard: string
  score: number
  ball: number
  four_x: number
  six_x: number
  catch_stump_player_id: number | null
  runout_by_id: number | null
  result?: unknown
}

interface SmBowlingRow {
  player_id: number
  scoreboard: string
  overs: number
  medians: number
  runs: number
  wickets: number
}

interface SmMatchDetail {
  batting?: SmBattingRow[]
  bowling?: SmBowlingRow[]
  lineup?: SmLineupPlayer[]
}

interface SmResult {
  name: string
}
