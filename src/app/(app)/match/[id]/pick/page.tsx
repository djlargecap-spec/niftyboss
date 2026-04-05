import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { DraftLobby } from "@/components/draft/draft-lobby"
import { StarterPicker } from "@/components/draft/starter-picker"
import { DraftRoom } from "@/components/draft/draft-room"
import { ImpactPicker } from "@/components/draft/impact-picker"
import { DraftComplete } from "@/components/draft/draft-complete"
import type { Challenge, DraftSession, DraftPick, PlayerWithTeam, MatchWithTeams } from "@/lib/types"

export default async function PickPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  // Load match with teams
  const { data: matchRaw } = await admin
    .from("matches")
    .select("*, team_home:teams!team_home_id(*), team_away:teams!team_away_id(*)")
    .eq("id", matchId)
    .single()
  if (!matchRaw) redirect("/matches")

  const match = matchRaw as unknown as MatchWithTeams

  // Non-upcoming matches → scores page
  if (match.status !== "upcoming") redirect(`/match/${matchId}/scores`)

  // ─── Check for active draft session ───────────────────────
  const { data: sessionRaw } = await admin
    .from("draft_sessions")
    .select("*")
    .eq("match_id", matchId)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .maybeSingle()

  const session = sessionRaw as DraftSession | null

  if (session) {
    // Parallel fetch: picks, players, playing XI, profiles, selections
    const [{ data: picksRaw }, { data: playersRaw }, { data: xiRaw }, { data: profilesRaw }, { data: selectionsRaw }] =
      await Promise.all([
        admin.from("draft_picks").select("*").eq("draft_session_id", session.id).order("pick_number"),
        admin.from("players").select("*, team:teams(*)").in("team_id", [match.team_home_id, match.team_away_id]),
        admin.from("playing_xi").select("player_id").eq("match_id", matchId),
        admin.from("profiles").select("id, display_name").in("id", [session.user1_id, session.user2_id]),
        admin.from("selections")
          .select("user_id, captain_id, impact_player_id")
          .eq("draft_session_id", session.id)
          .eq("is_draft_pick", true),
      ])

    const picks = (picksRaw ?? []) as DraftPick[]
    const players = (playersRaw ?? []) as unknown as PlayerWithTeam[]
    const playingXIIds = (xiRaw ?? []).map((r) => r.player_id as string)
    const profiles = (profilesRaw ?? []) as { id: string; display_name: string }[]
    const selections = (selectionsRaw ?? []) as { user_id: string; captain_id: string | null; impact_player_id: string | null }[]

    const opponentId = session.user1_id === user.id ? session.user2_id : session.user1_id
    const opponentProfile = profiles.find((p) => p.id === opponentId) ?? { id: opponentId, display_name: "Opponent" }

    const myPicks = picks.filter((p) => p.user_id === user.id)
    const opponentPicks = picks.filter((p) => p.user_id === opponentId)
    const mySelection = selections.find((s) => s.user_id === user.id) ?? { captain_id: null, impact_player_id: null }
    const opponentSelection = selections.find((s) => s.user_id === opponentId) ?? { captain_id: null, impact_player_id: null }

    if (session.phase === "impact_selection") {
      return (
        <ImpactPicker
          session={session}
          myPicks={myPicks}
          players={players}
          currentUserId={user.id}
          opponentDisplayName={opponentProfile.display_name}
          myImpactSet={mySelection.captain_id !== null}
          opponentImpactSet={opponentSelection.captain_id !== null}
        />
      )
    }

    if (session.phase === "complete") {
      return (
        <DraftComplete
          match={match}
          currentUserId={user.id}
          opponentDisplayName={opponentProfile.display_name}
          myPicks={myPicks}
          opponentPicks={opponentPicks}
          players={players}
          playingXIIds={playingXIIds}
          mySelection={{ impactPlayerId: mySelection.impact_player_id }}
          opponentSelection={{ impactPlayerId: opponentSelection.impact_player_id }}
        />
      )
    }

    // team_a: show StarterPicker until both starter AND team are decided
    if (session.phase === "team_a" && (!session.team_a_starter_id || !session.team_a_team_id)) {
      return (
        <StarterPicker
          draftSessionId={session.id}
          teamHome={match.team_home}
          teamAway={match.team_away}
          currentUserId={user.id}
          teamAStarterId={session.team_a_starter_id}
          opponentDisplayName={opponentProfile.display_name}
        />
      )
    }

    // team_a / team_b draft room
    return (
      <DraftRoom
        match={match}
        session={session}
        initialPicks={picks}
        players={players}
        currentUserId={user.id}
        opponentProfile={opponentProfile}
      />
    )
  }

  // ─── No session: show challenge lobby ──────────────────────
  const [{ data: allProfilesRaw }, { data: sentRaw }, { data: receivedRaw }] = await Promise.all([
    admin.from("profiles").select("id, display_name").neq("id", user.id).order("display_name"),
    admin
      .from("challenges")
      .select("*, challenged:profiles!challenges_challenged_id_fkey(id, display_name)")
      .eq("match_id", matchId)
      .eq("challenger_id", user.id)
      .eq("status", "pending")
      .maybeSingle(),
    admin
      .from("challenges")
      .select("*, challenger:profiles!challenges_challenger_id_fkey(id, display_name)")
      .eq("match_id", matchId)
      .eq("challenged_id", user.id)
      .eq("status", "pending")
      .maybeSingle(),
  ])

  return (
    <DraftLobby
      match={match}
      currentUserId={user.id}
      allProfiles={(allProfilesRaw ?? []) as { id: string; display_name: string }[]}
      sentChallenge={sentRaw as (Challenge & { challenged: { id: string; display_name: string } }) | null}
      receivedChallenge={receivedRaw as (Challenge & { challenger: { id: string; display_name: string } }) | null}
    />
  )
}
