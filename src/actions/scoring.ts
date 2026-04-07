"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { loadScoringRules, calculatePlayerPoints, calculateUserMatchScore } from "@/lib/scoring"
import type { PlayerStats } from "@/lib/scoring"
import type { SupabaseClient } from "@supabase/supabase-js"

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) throw new Error("Not admin")
  return user.id
}

// ─── Internal helpers (no auth check — for use by cron routes) ──────────────

export async function savePlayerScoresCore(
  admin: SupabaseClient,
  matchId: string,
  scores: Array<{ playerId: string; stats: PlayerStats }>
) {
  const rules = await loadScoringRules()

  const rows = scores.map(({ playerId, stats }) => {
    const { total, breakdown } = calculatePlayerPoints(stats, rules)
    return {
      match_id: matchId,
      player_id: playerId,
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
    }
  })

  // UPSERT — idempotent, safe to call multiple times, no race condition window
  const { error } = await admin
    .from("match_player_scores")
    .upsert(rows, { onConflict: "match_id,player_id" })
  if (error) return { error: error.message }
  return { success: true }
}

export async function calculateMatchPointsCore(
  admin: SupabaseClient,
  matchId: string
) {
  const { data: playerScores } = await admin
    .from("match_player_scores")
    .select("player_id, fantasy_points")
    .eq("match_id", matchId)

  if (!playerScores || playerScores.length === 0) {
    return { error: "No player scores found. Save scores first." }
  }

  const scoreMap = new Map(playerScores.map((s) => [s.player_id, s.fantasy_points]))

  const { data: selections } = await admin
    .from("selections")
    .select("id, user_id, captain_id, vice_captain_id, is_auto_pick")
    .eq("match_id", matchId)
    .limit(200)

  if (!selections || selections.length === 0) {
    return { error: "No selections found for this match" }
  }

  const selectionIds = selections.map((s) => s.id)
  const { data: selPlayers } = await admin
    .from("selection_players")
    .select("selection_id, player_id")
    .in("selection_id", selectionIds)
    .limit(2200)

  if (!selPlayers) return { error: "Failed to load selection players" }

  const playersBySelection = new Map<string, string[]>()
  for (const sp of selPlayers) {
    const arr = playersBySelection.get(sp.selection_id) ?? []
    arr.push(sp.player_id)
    playersBySelection.set(sp.selection_id, arr)
  }

  const userScores = selections.map((sel) => {
    const result = calculateUserMatchScore(
      {
        userId: sel.user_id,
        selectionId: sel.id,
        captainId: sel.captain_id,
        viceCaptainId: sel.vice_captain_id,
        isAutoPick: sel.is_auto_pick,
        playerIds: playersBySelection.get(sel.id) ?? [],
      },
      scoreMap
    )
    return {
      userId: sel.user_id,
      total: result.total,
      captainPoints: result.captainPoints,
      vcPoints: result.vcPoints,
      rank: 0,
    }
  })

  userScores.sort((a, b) => b.total - a.total)

  let currentRank = 1
  for (let i = 0; i < userScores.length; i++) {
    if (i > 0 && userScores[i].total < userScores[i - 1].total) {
      currentRank = i + 1
    }
    userScores[i].rank = currentRank
  }

  // Delete existing user match scores then insert fresh
  await admin.from("user_match_scores").delete().eq("match_id", matchId)

  const rows = userScores.map((s) => ({
    user_id: s.userId,
    match_id: matchId,
    total_points: s.total,
    rank: s.rank,
    captain_points: s.captainPoints,
    vc_points: s.vcPoints,
    breakdown: null,
  }))

  const { error } = await admin.from("user_match_scores").insert(rows)
  if (error) return { error: error.message }

  // Apply H2H net points from pairings (if any are set for this match)
  const { data: pairings } = await admin
    .from("match_pairings")
    .select("user1_id, user2_id")
    .eq("match_id", matchId)

  if (pairings && pairings.length > 0) {
    const pointsByUser = new Map(userScores.map((s) => [s.userId, s.total]))
    await Promise.all(
      pairings.flatMap((pair) => {
        const pts1 = pointsByUser.get(pair.user1_id) ?? 0
        const pts2 = pointsByUser.get(pair.user2_id) ?? 0
        return [
          admin.from("user_match_scores")
            .update({ net_points: pts1 - pts2 })
            .eq("match_id", matchId).eq("user_id", pair.user1_id),
          admin.from("user_match_scores")
            .update({ net_points: pts2 - pts1 })
            .eq("match_id", matchId).eq("user_id", pair.user2_id),
        ]
      })
    )
  }

  await admin.from("matches").update({ status: "completed" }).eq("id", matchId)
  await admin.rpc("refresh_leaderboard")

  return { success: true, results: userScores }
}

// ─── Public server actions (admin-auth gated) ───────────────────────────────

export async function savePlayerScores(
  matchId: string,
  scores: Array<{ playerId: string; stats: PlayerStats }>
) {
  await requireAdmin()
  const admin = createAdminClient()
  return savePlayerScoresCore(admin, matchId, scores)
}

export async function calculateMatchPoints(matchId: string) {
  await requireAdmin()
  const admin = createAdminClient()
  return calculateMatchPointsCore(admin, matchId)
}

export async function resetMatchScores(matchId: string) {
  await requireAdmin()
  const admin = createAdminClient()

  await Promise.all([
    admin.from("user_match_scores").delete().eq("match_id", matchId),
    admin.from("match_player_scores").delete().eq("match_id", matchId),
  ])

  await admin.from("matches").update({ status: "live" }).eq("id", matchId)

  return { success: true }
}

export async function savePairings(
  matchId: string,
  pairs: Array<{ user1_id: string; user2_id: string }>
) {
  await requireAdmin()
  const admin = createAdminClient()

  // Replace all pairings for this match atomically
  await admin.from("match_pairings").delete().eq("match_id", matchId)

  if (pairs.length === 0) return { success: true }

  const rows = pairs.map((p) => ({
    match_id: matchId,
    user1_id: p.user1_id,
    user2_id: p.user2_id,
  }))

  const { error } = await admin.from("match_pairings").insert(rows)
  if (error) return { error: error.message }

  return { success: true }
}

/**
 * Calculates provisional user points mid-match without finalising.
 * Safe to run multiple times — upserts instead of replacing.
 * Does NOT update match status, leaderboard, or H2H.
 */
export async function calculateLiveMatchPoints(matchId: string) {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: playerScores } = await admin
    .from("match_player_scores")
    .select("player_id, fantasy_points")
    .eq("match_id", matchId)

  if (!playerScores || playerScores.length === 0) {
    return { error: "No player scores found. Fetch scorecard and save scores first." }
  }

  const scoreMap = new Map(playerScores.map((s) => [s.player_id, s.fantasy_points]))

  const { data: selections } = await admin
    .from("selections")
    .select("id, user_id, captain_id, vice_captain_id, is_auto_pick")
    .eq("match_id", matchId)
    .limit(200)

  if (!selections || selections.length === 0) {
    return { error: "No selections found for this match" }
  }

  const selectionIds = selections.map((s) => s.id)
  const { data: selPlayers } = await admin
    .from("selection_players")
    .select("selection_id, player_id")
    .in("selection_id", selectionIds)
    .limit(2200)

  if (!selPlayers) return { error: "Failed to load selection players" }

  const playersBySelection = new Map<string, string[]>()
  for (const sp of selPlayers) {
    const arr = playersBySelection.get(sp.selection_id) ?? []
    arr.push(sp.player_id)
    playersBySelection.set(sp.selection_id, arr)
  }

  const userScores = selections.map((sel) => {
    const result = calculateUserMatchScore(
      {
        userId: sel.user_id,
        selectionId: sel.id,
        captainId: sel.captain_id,
        viceCaptainId: sel.vice_captain_id,
        isAutoPick: sel.is_auto_pick,
        playerIds: playersBySelection.get(sel.id) ?? [],
      },
      scoreMap
    )
    return { userId: sel.user_id, total: result.total, captainPoints: result.captainPoints, vcPoints: result.vcPoints, rank: 0 }
  })

  userScores.sort((a, b) => b.total - a.total)
  let currentRank = 1
  for (let i = 0; i < userScores.length; i++) {
    if (i > 0 && userScores[i].total < userScores[i - 1].total) currentRank = i + 1
    userScores[i].rank = currentRank
  }

  const rows = userScores.map((s) => ({
    user_id: s.userId,
    match_id: matchId,
    total_points: s.total,
    rank: s.rank,
    captain_points: s.captainPoints,
    vc_points: s.vcPoints,
    breakdown: null,
  }))

  const { error } = await admin
    .from("user_match_scores")
    .upsert(rows, { onConflict: "user_id,match_id" })
  if (error) return { error: error.message }

  await admin.from("matches").update({ live_scores_at: new Date().toISOString() }).eq("id", matchId)

  return { success: true, count: userScores.length }
}
