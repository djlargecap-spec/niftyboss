import { type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCricketProvider } from "@/lib/api"
import { parseScorecardToStats, fuzzyMatchName } from "@/lib/api/utils"
import { loadScoringRules, calculatePlayerPoints, calculateUserMatchScore } from "@/lib/scoring"

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()

  // Find live matches with a cricapi_match_id
  const { data: liveMatches } = await admin
    .from("matches")
    .select("id, cricapi_match_id, team_home_id, team_away_id")
    .eq("status", "live")
    .not("cricapi_match_id", "is", null)

  // Self-heal: find upcoming matches whose start_time was > 4 hours ago.
  // These are matches that slipped through before pg_cron was enabled, or were
  // imported after the match already finished. If SportMonks reports them as
  // "Finished", transition them to "live" so the scoring loop below picks them up.
  const { data: missedMatches } = await admin
    .from("matches")
    .select("id, cricapi_match_id")
    .eq("status", "upcoming")
    .not("cricapi_match_id", "is", null)
    .lt("start_time", new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())

  const transitioned: string[] = []
  for (const missed of missedMatches ?? []) {
    try {
      const info = await getCricketProvider().fetchMatchInfo(missed.cricapi_match_id)
      if (info?.status === "Finished") {
        await admin.from("matches").update({ status: "live" }).eq("id", missed.id)
        transitioned.push(missed.id)
        // Add to liveMatches so scoring runs in this same cron invocation
        ;(liveMatches ?? []).push({ id: missed.id, cricapi_match_id: missed.cricapi_match_id, team_home_id: "", team_away_id: "" })
      }
    } catch {
      // Non-fatal: will retry on next cron run
    }
  }

  if (!liveMatches || liveMatches.length === 0) {
    return Response.json({ updated: [], transitioned, message: "No live matches" })
  }

  // Reload team IDs for any just-transitioned matches (team IDs were blank above)
  if (transitioned.length > 0) {
    const { data: freshRows } = await admin
      .from("matches")
      .select("id, cricapi_match_id, team_home_id, team_away_id")
      .in("id", transitioned)
    for (const row of freshRows ?? []) {
      const idx = liveMatches.findIndex((m) => m.id === row.id)
      if (idx !== -1) liveMatches[idx] = row
    }
  }

  const rules = await loadScoringRules()
  const updated: string[] = []
  const errors: Array<{ matchId: string; error: string }> = []

  for (const match of liveMatches) {
    try {
      // 1. Fetch fixture stats from SportMonks
      const result = await getCricketProvider().fetchMatchPoints(match.cricapi_match_id)
      if (!result || result.innings.length === 0) {
        errors.push({ matchId: match.id, error: "No innings data yet" })
        continue
      }

      // 2. Parse innings into normalised player stats
      const parsed = parseScorecardToStats(result.innings)

      // 3. Load DB players for this match's two teams
      const { data: dbPlayers } = await admin
        .from("players")
        .select("id, name, team_id, cricapi_id")
        .in("team_id", [match.team_home_id, match.team_away_id])

      if (!dbPlayers) {
        errors.push({ matchId: match.id, error: "Failed to load players" })
        continue
      }

      // 3b. Auto-populate playing_xi if not yet done (saves a separate cron + API call)
      const { count: xiCount } = await admin
        .from("playing_xi")
        .select("id", { count: "exact", head: true })
        .eq("match_id", match.id)

      if (!xiCount || xiCount < 22) {
        const cricapiIdMap = new Map<string, { id: string; team_id: string }>()
        for (const p of dbPlayers) {
          if (p.cricapi_id) cricapiIdMap.set(p.cricapi_id, { id: p.id, team_id: p.team_id })
        }
        const xiMatched = new Map<string, string>()
        for (const apiPlayer of result.totals) {
          const byId = cricapiIdMap.get(apiPlayer.id)
          if (byId) { xiMatched.set(byId.id, byId.team_id); continue }
          const nameNorm = apiPlayer.name.toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim()
          const dbMatch = dbPlayers.find((p) => {
            const pNorm = p.name.toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim()
            return pNorm === nameNorm || pNorm.includes(nameNorm) || nameNorm.includes(pNorm)
          })
          if (dbMatch) xiMatched.set(dbMatch.id, dbMatch.team_id)
        }
        const byTeam = new Map<string, string[]>()
        for (const [pid, tid] of xiMatched) {
          const list = byTeam.get(tid) ?? []; list.push(pid); byTeam.set(tid, list)
        }
        const teamCounts = [...byTeam.values()].map((v) => v.length)
        if (teamCounts.length === 2 && teamCounts.every((c) => c === 11)) {
          await admin.from("playing_xi").delete().eq("match_id", match.id)
          await admin.from("playing_xi").insert(
            [...xiMatched.entries()].map(([pid, tid]) => ({ match_id: match.id, player_id: pid, team_id: tid }))
          )
        }
      }

      // 4. Build normalised name → db id lookup
      const nameMap = new Map<string, string>()
      for (const p of dbPlayers) {
        const norm = p.name.toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim()
        nameMap.set(norm, p.id)
      }

      // 5. Match API names → DB ids and compute fantasy points
      const scoreRows: Array<{
        match_id: string
        player_id: string
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
        fantasy_points: number
        breakdown: unknown
      }> = []

      for (const [apiName, stats] of parsed) {
        const dbId = fuzzyMatchName(apiName, nameMap)
        if (!dbId) continue
        const { total, breakdown } = calculatePlayerPoints(stats, rules)
        scoreRows.push({
          match_id: match.id,
          player_id: dbId,
          runs: stats.runs,
          balls_faced: stats.balls_faced,
          fours: stats.fours,
          sixes: stats.sixes,
          wickets: stats.wickets,
          overs_bowled: stats.overs_bowled,
          runs_conceded: stats.runs_conceded,
          maidens: stats.maidens,
          catches: stats.catches,
          stumpings: stats.stumpings,
          run_outs: stats.run_outs,
          fantasy_points: total,
          breakdown,
        })
      }

      if (scoreRows.length === 0) {
        errors.push({ matchId: match.id, error: "No players matched" })
        continue
      }

      // 5b. Deduplicate by player_id — two different API name variants can fuzzy-match
      //     to the same DB player (e.g. "MS Dhoni" and "Mahendra Dhoni"), causing
      //     PostgreSQL to reject the upsert with "affect row a second time".
      //     Merge stats and recalculate points for any collisions.
      const deduped = new Map<string, typeof scoreRows[0]>()
      for (const row of scoreRows) {
        const prev = deduped.get(row.player_id)
        if (!prev) {
          deduped.set(row.player_id, { ...row })
        } else {
          const merged = {
            ...prev,
            runs: prev.runs + row.runs,
            balls_faced: prev.balls_faced + row.balls_faced,
            fours: prev.fours + row.fours,
            sixes: prev.sixes + row.sixes,
            wickets: prev.wickets + row.wickets,
            overs_bowled: prev.overs_bowled + row.overs_bowled,
            runs_conceded: prev.runs_conceded + row.runs_conceded,
            maidens: prev.maidens + row.maidens,
            catches: prev.catches + row.catches,
            stumpings: prev.stumpings + row.stumpings,
            run_outs: prev.run_outs + row.run_outs,
          }
          const { total, breakdown } = calculatePlayerPoints(merged, rules)
          merged.fantasy_points = total
          merged.breakdown = breakdown
          deduped.set(row.player_id, merged)
        }
      }
      const dedupedRows = [...deduped.values()]

      // 6. Upsert player scores (atomic — no gap between delete and insert)
      const { error: upsertPlayerErr } = await admin
        .from("match_player_scores")
        .upsert(dedupedRows, { onConflict: "match_id,player_id" })
      if (upsertPlayerErr) {
        errors.push({ matchId: match.id, error: upsertPlayerErr.message })
        continue
      }

      // 7. Build score map for user calculation
      const scoreMap = new Map(dedupedRows.map((r) => [r.player_id, r.fantasy_points]))

      // 8. Load all selections for this match
      const { data: selections } = await admin
        .from("selections")
        .select("id, user_id, captain_id, vice_captain_id, is_auto_pick")
        .eq("match_id", match.id)
        .limit(200)

      if (!selections || selections.length === 0) {
        errors.push({ matchId: match.id, error: "No selections found" })
        continue
      }

      // 9. Load selection players
      const selectionIds = selections.map((s) => s.id)
      const { data: selPlayers } = await admin
        .from("selection_players")
        .select("selection_id, player_id")
        .in("selection_id", selectionIds)
        .limit(2200)

      if (!selPlayers) {
        errors.push({ matchId: match.id, error: "Failed to load selection players" })
        continue
      }

      // 10. Group players by selection
      const playersBySelection = new Map<string, string[]>()
      for (const sp of selPlayers) {
        const arr = playersBySelection.get(sp.selection_id) ?? []
        arr.push(sp.player_id)
        playersBySelection.set(sp.selection_id, arr)
      }

      // 11. Calculate per-user scores with captain/VC multipliers
      const userScores = selections.map((sel) => {
        const playerIds = playersBySelection.get(sel.id) ?? []
        const res = calculateUserMatchScore(
          {
            userId: sel.user_id,
            selectionId: sel.id,
            captainId: sel.captain_id,
            viceCaptainId: sel.vice_captain_id,
            isAutoPick: sel.is_auto_pick,
            playerIds,
          },
          scoreMap
        )
        // Build per-player breakdown so the UI can show score bars during live matches
        const breakdown: Record<string, number> = {}
        for (const pid of playerIds) {
          const pts = scoreMap.get(pid) ?? 0
          if (pts > 0) breakdown[pid] = pts
        }
        return { userId: sel.user_id, total: res.total, captainPoints: res.captainPoints, vcPoints: res.vcPoints, rank: 0, breakdown }
      })

      // 12. Sort and assign ranks (ties share a rank)
      userScores.sort((a, b) => b.total - a.total)
      let currentRank = 1
      for (let i = 0; i < userScores.length; i++) {
        if (i > 0 && userScores[i].total < userScores[i - 1].total) currentRank = i + 1
        userScores[i].rank = currentRank
      }

      // 13. Upsert user match scores — safe to run repeatedly
      const userRows = userScores.map((s) => ({
        user_id: s.userId,
        match_id: match.id,
        total_points: s.total,
        rank: s.rank,
        captain_points: s.captainPoints,
        vc_points: s.vcPoints,
        breakdown: s.breakdown,
      }))

      const { error: upsertErr } = await admin
        .from("user_match_scores")
        .upsert(userRows, { onConflict: "user_id,match_id" })

      if (upsertErr) {
        errors.push({ matchId: match.id, error: upsertErr.message })
        continue
      }

      // 14. Apply H2H net_points from pairings (if any set for this match)
      const { data: pairings } = await admin
        .from("match_pairings")
        .select("user1_id, user2_id")
        .eq("match_id", match.id)
      if (pairings && pairings.length > 0) {
        const ptsByUser = new Map(userScores.map((s) => [s.userId, s.total]))
        const netByUser = new Map<string, number>()
        for (const pair of pairings) {
          const p1 = ptsByUser.get(pair.user1_id) ?? 0
          const p2 = ptsByUser.get(pair.user2_id) ?? 0
          netByUser.set(pair.user1_id, (netByUser.get(pair.user1_id) ?? 0) + (p1 - p2))
          netByUser.set(pair.user2_id, (netByUser.get(pair.user2_id) ?? 0) + (p2 - p1))
        }
        await Promise.all(
          [...netByUser.entries()].map(([userId, net]) =>
            admin.from("user_match_scores")
              .update({ net_points: net })
              .eq("match_id", match.id).eq("user_id", userId)
          )
        )
      }

      // 15. Stamp when live points were last calculated
      await admin.from("matches").update({ live_scores_at: new Date().toISOString() }).eq("id", match.id)

      // 16. Auto-detect match finished — only check API when both innings have data
      if (result.innings.length >= 2) {
      const fixtureInfo = await getCricketProvider().fetchMatchInfo(match.cricapi_match_id)
      if (fixtureInfo && fixtureInfo.status === "Finished") {
        const note = (fixtureInfo.note ?? "")
          .replace(/\s{2,}/g, " ")
          .trim()
        await admin.from("matches").update({
          status: "completed",
          ...(note ? { result_summary: note } : {}),
        }).eq("id", match.id)
        // Refresh season leaderboard materialized view
        await admin.rpc("refresh_leaderboard")
      }
      }

      updated.push(match.id)
    } catch (err) {
      errors.push({ matchId: match.id, error: String(err) })
    }
  }

  return Response.json({ updated, errors })
}
