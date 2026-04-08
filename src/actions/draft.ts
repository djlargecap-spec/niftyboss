"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getWhoseTurn, getPhaseFromPickCount } from "@/lib/draft"

// ─── Auth helper ────────────────────────────────────────────

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return user
}

// ─── sendChallenge ───────────────────────────────────────────

export async function sendChallenge(
  matchId: string,
  challengedUserId: string
): Promise<{ success?: boolean; challengeId?: string; error?: string }> {
  const user = await getAuthUser()
  const admin = createAdminClient()

  if (user.id === challengedUserId) return { error: "Cannot challenge yourself" }

  // Match must be upcoming
  const { data: match } = await admin
    .from("matches")
    .select("id, match_number, status")
    .eq("id", matchId)
    .single()
  if (!match || match.status !== "upcoming") return { error: "Match is not open for challenges" }

  // No active challenge already exists between these two for this match
  const { data: existing } = await admin
    .from("challenges")
    .select("id, status")
    .eq("match_id", matchId)
    .or(
      `and(challenger_id.eq.${user.id},challenged_id.eq.${challengedUserId}),` +
      `and(challenger_id.eq.${challengedUserId},challenged_id.eq.${user.id})`
    )
    .in("status", ["pending", "accepted"])
    .maybeSingle()
  if (existing) return { error: "A challenge already exists between you two for this match" }

  // Insert challenge (RLS allows authenticated user to insert when challenger_id = auth.uid())
  const supabase = await createClient()
  const { data: challenge, error: insertError } = await supabase
    .from("challenges")
    .insert({ match_id: matchId, challenger_id: user.id, challenged_id: challengedUserId })
    .select("id")
    .single()
  if (insertError) return { error: insertError.message }

  // Fetch challenger display name for notification
  const { data: challengerProfile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single()

  // Notify the challenged user
  await admin.from("notifications").insert({
    user_id: challengedUserId,
    type: "system",
    title: "Draft Challenge",
    body: `${challengerProfile?.display_name ?? "Someone"} challenged you for Match #${match.match_number}`,
    metadata: { challenge_id: challenge.id, match_id: matchId },
  })

  return { success: true, challengeId: challenge.id }
}

// ─── acceptChallenge ─────────────────────────────────────────

export async function acceptChallenge(
  challengeId: string
): Promise<{ success?: boolean; draftSessionId?: string; error?: string }> {
  const user = await getAuthUser()
  const admin = createAdminClient()

  // Load challenge — must be pending and addressed to this user
  const { data: challenge } = await admin
    .from("challenges")
    .select("*, match:matches(id, match_number, status, team_home_id, team_away_id)")
    .eq("id", challengeId)
    .eq("challenged_id", user.id)
    .eq("status", "pending")
    .single()
  if (!challenge) return { error: "Challenge not found or already actioned" }

  const match = challenge.match as { id: string; match_number: number; status: string; team_home_id: string; team_away_id: string }
  if (match.status !== "upcoming") return { error: "Match has already started" }

  // 1. Mark challenge accepted
  await admin.from("challenges").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", challengeId)

  // 2. Create draft session — user1 = challenger (starts Team A)
  const { data: session, error: sessionError } = await admin
    .from("draft_sessions")
    .insert({
      match_id: match.id,
      challenge_id: challengeId,
      user1_id: challenge.challenger_id,
      user2_id: user.id,
      status: "active",
      phase: "team_a",
      pick_count: 0,
      current_turn: challenge.challenger_id,
    })
    .select("id")
    .single()
  if (sessionError) return { error: sessionError.message }

  // 3. Pre-create empty selections for both users so selection_players can FK to them
  const selectionRows = [challenge.challenger_id, user.id].map((uid) => ({
    user_id: uid,
    match_id: match.id,
    captain_id: null,
    vice_captain_id: null,
    is_auto_pick: false,
    is_draft_pick: true,
    draft_session_id: session.id,
  }))
  const { error: selError } = await admin.from("selections").insert(selectionRows)
  if (selError) return { error: `Failed to create selections: ${selError.message}` }

  // 4. Notify challenger
  const { data: challengedProfile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single()

  await admin.from("notifications").insert({
    user_id: challenge.challenger_id,
    type: "system",
    title: "Challenge Accepted",
    body: `${challengedProfile?.display_name ?? "Your opponent"} accepted your challenge for Match #${match.match_number}. Draft starting now!`,
    metadata: { draft_session_id: session.id, match_id: match.id },
  })

  return { success: true, draftSessionId: session.id }
}

// ─── declineChallenge ────────────────────────────────────────

export async function declineChallenge(
  challengeId: string
): Promise<{ success?: boolean; error?: string }> {
  const user = await getAuthUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from("challenges")
    .update({ status: "declined", updated_at: new Date().toISOString() })
    .eq("id", challengeId)
    .eq("challenged_id", user.id)
    .eq("status", "pending")
  if (error) return { error: error.message }
  return { success: true }
}

// ─── cancelChallenge ─────────────────────────────────────────

export async function cancelChallenge(
  challengeId: string
): Promise<{ success?: boolean; error?: string }> {
  const user = await getAuthUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from("challenges")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", challengeId)
    .eq("challenger_id", user.id)
    .eq("status", "pending")
  if (error) return { error: error.message }
  return { success: true }
}

// ─── makePick ────────────────────────────────────────────────

export async function makePick(
  draftSessionId: string,
  playerId: string
): Promise<{ success?: boolean; phase?: string; isComplete?: boolean; error?: string }> {
  const user = await getAuthUser()
  const admin = createAdminClient()

  // Load session — must be active and it's this user's turn
  const { data: session } = await admin
    .from("draft_sessions")
    .select("*, match:matches(id, status, team_home_id, team_away_id)")
    .eq("id", draftSessionId)
    .single()
  if (!session) return { error: "Draft session not found" }
  if (session.status !== "active") return { error: "Draft session is not active" }
  if (session.current_turn !== user.id) return { error: "Not your turn" }

  const match = session.match as { id: string; status: string; team_home_id: string; team_away_id: string }
  if (match.status !== "upcoming") return { error: "Match has already started" }

  // Verify player belongs to the correct team for current phase
  const { data: player } = await admin
    .from("players")
    .select("id, team_id, is_active")
    .eq("id", playerId)
    .single()
  if (!player) return { error: "Player not found" }
  if (!player.is_active) return { error: "Player is not active" }

  const teamATeamId = session.team_a_team_id ?? match.team_home_id
  const teamBTeamId = teamATeamId === match.team_home_id ? match.team_away_id : match.team_home_id
  const expectedTeamId = session.phase === "team_a" ? teamATeamId : teamBTeamId
  if (player.team_id !== expectedTeamId) {
    return { error: `Player is not from the correct team for this phase` }
  }

  // Player must not already be picked in this session
  const { data: existingPick } = await admin
    .from("draft_picks")
    .select("id")
    .eq("draft_session_id", draftSessionId)
    .eq("player_id", playerId)
    .maybeSingle()
  if (existingPick) return { error: "Player already drafted" }

  // Insert draft pick (UNIQUE constraint guards against race condition)
  const currentPickNumber = session.pick_count
  const { error: pickError } = await admin.from("draft_picks").insert({
    draft_session_id: draftSessionId,
    pick_number: currentPickNumber,
    user_id: user.id,
    player_id: playerId,
    phase: session.phase,
  })
  if (pickError) {
    // Unique violation = race condition — someone else already made this pick
    if (pickError.code === "23505") return { error: "Pick already made" }
    return { error: pickError.message }
  }

  // Add player to the user's selection_players (scoped to this specific session)
  const { data: selection } = await admin
    .from("selections")
    .select("id")
    .eq("draft_session_id", draftSessionId)
    .eq("user_id", user.id)
    .eq("is_draft_pick", true)
    .maybeSingle()
  if (selection) {
    await admin.from("selection_players").insert({ selection_id: selection.id, player_id: playerId })
  }

  // Compute next state
  const newPickCount = currentPickNumber + 1
  const newPhase = getPhaseFromPickCount(newPickCount)
  const teamAStarter = session.team_a_starter_id ?? session.user1_id
  const newTurn = newPickCount < 16
    ? getWhoseTurn(newPickCount, teamAStarter, session.user1_id, session.user2_id)
    : session.user1_id // placeholder during impact_selection phase

  // Update session
  await admin.from("draft_sessions").update({
    pick_count: newPickCount,
    phase: newPhase,
    current_turn: newTurn,
    updated_at: new Date().toISOString(),
  }).eq("id", draftSessionId)

  return { success: true, phase: newPhase, isComplete: newPhase === "complete" }
}

// ─── setImpactPlayer ─────────────────────────────────────────

export async function setImpactPlayer(
  draftSessionId: string,
  playerId: string
): Promise<{ success?: boolean; bothSet?: boolean; error?: string }> {
  const user = await getAuthUser()
  const admin = createAdminClient()

  const { data: session } = await admin
    .from("draft_sessions")
    .select("id, phase, user1_id, user2_id, match_id")
    .eq("id", draftSessionId)
    .single()
  if (!session) return { error: "Draft session not found" }
  if (session.phase !== "impact_selection") return { error: "Not in impact selection phase" }
  if (session.user1_id !== user.id && session.user2_id !== user.id) return { error: "Not a participant" }

  // Verify player is in this user's picks
  const { data: pick } = await admin
    .from("draft_picks")
    .select("id")
    .eq("draft_session_id", draftSessionId)
    .eq("user_id", user.id)
    .eq("player_id", playerId)
    .maybeSingle()
  if (!pick) return { error: "Player not in your drafted team" }

  // Update captain_id + impact_player_id on this user's selection (scoped to this session)
  await admin
    .from("selections")
    .update({ captain_id: playerId, impact_player_id: playerId, updated_at: new Date().toISOString() })
    .eq("draft_session_id", draftSessionId)
    .eq("user_id", user.id)
    .eq("is_draft_pick", true)

  // Check if both users have set their impact player
  const { data: selections } = await admin
    .from("selections")
    .select("captain_id")
    .eq("match_id", session.match_id)
    .eq("is_draft_pick", true)
    .eq("draft_session_id", draftSessionId)

  const bothSet = (selections ?? []).filter((s) => s.captain_id !== null).length === 2

  if (bothSet) {
    // Lock both selections and mark session complete
    const now = new Date().toISOString()
    await admin
      .from("selections")
      .update({ locked_at: now, updated_at: now })
      .eq("draft_session_id", draftSessionId)
      .eq("is_draft_pick", true)

    await admin
      .from("draft_sessions")
      .update({ status: "complete", phase: "complete", updated_at: now })
      .eq("id", draftSessionId)
  }

  return { success: true, bothSet }
}

// ─── swapPlayer ───────────────────────────────────────────────

export async function swapPlayer(
  matchId: string,
  outPlayerId: string,
  inPlayerId: string
): Promise<{ success?: boolean; error?: string }> {
  const user = await getAuthUser()
  const admin = createAdminClient()

  // Match must be upcoming
  const { data: match } = await admin
    .from("matches")
    .select("id, status, team_home_id, team_away_id")
    .eq("id", matchId)
    .single()
  if (!match || match.status !== "upcoming") return { error: "Match is not upcoming" }

  // Playing XI must be announced
  const { count: xiCount } = await admin
    .from("playing_xi")
    .select("id", { count: "exact", head: true })
    .eq("match_id", matchId)
  if (!xiCount || xiCount < 22) return { error: "Playing XI not yet announced" }

  // Load user's draft selection
  const { data: selection } = await admin
    .from("selections")
    .select("id, captain_id")
    .eq("match_id", matchId)
    .eq("user_id", user.id)
    .eq("is_draft_pick", true)
    .maybeSingle()
  if (!selection) return { error: "No draft selection found" }

  // Verify outPlayer is in user's team
  const { data: outRow } = await admin
    .from("selection_players")
    .select("id")
    .eq("selection_id", selection.id)
    .eq("player_id", outPlayerId)
    .maybeSingle()
  if (!outRow) return { error: "Player not in your team" }

  // outPlayer must be ABSENT from Playing XI
  const { data: outInXI } = await admin
    .from("playing_xi")
    .select("id")
    .eq("match_id", matchId)
    .eq("player_id", outPlayerId)
    .maybeSingle()
  if (outInXI) return { error: "Player is in the Playing XI — swap not needed" }

  // inPlayer must be in Playing XI
  const { data: inXI } = await admin
    .from("playing_xi")
    .select("player_id, team_id")
    .eq("match_id", matchId)
    .eq("player_id", inPlayerId)
    .maybeSingle()
  if (!inXI) return { error: "Replacement player is not in the Playing XI" }

  // Both players must be from the same team
  const { data: outPlayer } = await admin.from("players").select("team_id").eq("id", outPlayerId).single()
  if (outPlayer?.team_id !== inXI.team_id) return { error: "Replacement must be from the same team" }

  // inPlayer must not already be in the user's team
  const { data: alreadyIn } = await admin
    .from("selection_players")
    .select("id")
    .eq("selection_id", selection.id)
    .eq("player_id", inPlayerId)
    .maybeSingle()
  if (alreadyIn) return { error: "Replacement player is already in your team" }

  // Perform the swap
  await admin.from("selection_players").delete().eq("id", outRow.id)
  await admin.from("selection_players").insert({ selection_id: selection.id, player_id: inPlayerId })

  // If the swapped-out player was the impact player, clear it
  if (selection.captain_id === outPlayerId) {
    await admin
      .from("selections")
      .update({ captain_id: null, impact_player_id: null, updated_at: new Date().toISOString() })
      .eq("id", selection.id)
  }

  return { success: true }
}

// ─── chooseTeam ───────────────────────────────────────────────

export async function chooseTeam(
  draftSessionId: string,
  teamId: string
): Promise<{ success?: boolean; error?: string }> {
  const user = await getAuthUser()
  const admin = createAdminClient()

  const { data: session } = await admin
    .from("draft_sessions")
    .select("id, user1_id, user2_id, team_a_starter_id, team_a_team_id, phase")
    .eq("id", draftSessionId)
    .single()
  if (!session) return { error: "Session not found" }
  if (session.team_a_starter_id !== user.id) return { error: "Only the first picker can choose the team" }
  if (session.team_a_team_id !== null) return { error: "Team already chosen" }
  if (session.phase !== "team_a") return { error: "Draft already started" }

  const { error } = await admin
    .from("draft_sessions")
    .update({
      team_a_team_id: teamId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftSessionId)
    .is("team_a_team_id", null) // race-condition guard

  if (error) return { error: error.message }
  return { success: true }
}

// ─── claimFirstPick ───────────────────────────────────────────

export async function claimFirstPick(
  draftSessionId: string
): Promise<{ success?: boolean; error?: string }> {
  const user = await getAuthUser()
  const admin = createAdminClient()

  const { data: session } = await admin
    .from("draft_sessions")
    .select("id, user1_id, user2_id, team_a_starter_id, phase")
    .eq("id", draftSessionId)
    .single()
  if (!session) return { error: "Session not found" }
  if (session.user1_id !== user.id && session.user2_id !== user.id) return { error: "Not a participant" }
  if (session.phase !== "team_a") return { error: "Draft already started" }
  if (session.team_a_starter_id !== null) return { error: "First pick already claimed" }

  const { error } = await admin
    .from("draft_sessions")
    .update({
      team_a_starter_id: user.id,
      current_turn: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftSessionId)
    .is("team_a_starter_id", null) // guard against race condition

  if (error) return { error: error.message }
  return { success: true }
}
