import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { PageTransition } from "@/components/page-transition"
import { ScoresClient } from "./scores-client"
import type { TeamInfo, PlayerScoreRow, UserScoreRow, SelectionRow, H2HDuel } from "./scores-client"

export default async function ScoresPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()

  // All queries in parallel
  const [matchRes, playerScoresRes, userScoresRes, mySelectionRes, allSelectionsRes, captainPicksRes, draftSessionsRes] = await Promise.all([
    admin
      .from("matches")
      .select("*, team_home:teams!matches_team_home_id_fkey(short_name, color, logo_url), team_away:teams!matches_team_away_id_fkey(short_name, color, logo_url)")
      .eq("id", id)
      .single(),
    admin
      .from("match_player_scores")
      .select("*, player:players(name, role, team_id, team:teams(short_name, color))")
      .eq("match_id", id)
      .order("fantasy_points", { ascending: false })
      .limit(50),
    admin
      .from("user_match_scores")
      .select("*, profile:profiles(display_name)")
      .eq("match_id", id)
      .order("rank", { ascending: true })
      .limit(200),
    supabase
      .from("selections")
      .select("captain_id, vice_captain_id, is_draft_pick, selection_players(player_id)")
      .eq("user_id", user.id)
      .eq("match_id", id)
      .maybeSingle(),
    admin
      .from("selections")
      .select("user_id, captain_id, vice_captain_id, is_draft_pick, draft_session_id, selection_players(player_id)")
      .eq("match_id", id)
      .limit(200),
    admin
      .from("selections")
      .select("user_id, captain_id, captain:players!selections_captain_id_fkey(name)")
      .eq("match_id", id)
      .not("captain_id", "is", null),
    admin
      .from("draft_sessions")
      .select("id, user1_id, user2_id")
      .eq("match_id", id)
      .eq("status", "complete"),
  ])

  const match = matchRes.data
  if (!match) redirect("/matches")

  const home = match.team_home as unknown as TeamInfo
  const away = match.team_away as unknown as TeamInfo
  const playerScores = (playerScoresRes.data ?? []) as unknown as PlayerScoreRow[]
  const userScores = (userScoresRes.data ?? []) as unknown as UserScoreRow[]
  const myScore = userScores.find((s) => s.user_id === user.id) ?? null

  const mySelection = mySelectionRes.data
  const myPlayerIds = (mySelection?.selection_players as { player_id: string }[] | undefined)?.map((sp) => sp.player_id) ?? []

  // Only expose other users' selections when match is live or completed (not upcoming)
  const isMatchLocked = match.status === "live" || match.status === "completed" || match.status === "no_result"
  const allSelections: SelectionRow[] = isMatchLocked
    ? (allSelectionsRes.data ?? []).map((s) => ({
        user_id: s.user_id,
        captain_id: s.captain_id as string | null,
        vice_captain_id: s.vice_captain_id as string | null,
        is_draft_pick: s.is_draft_pick as boolean,
        draft_session_id: s.draft_session_id as string | null,
        player_ids: (s.selection_players as { player_id: string }[]).map((sp) => sp.player_id),
      }))
    : []

  const captainPicks: Record<string, { name: string }> = {}
  for (const s of captainPicksRes.data ?? []) {
    captainPicks[s.user_id] = { name: (s.captain as unknown as { name: string })?.name ?? "—" }
  }

  // When the match is locked but scoring hasn't run yet, synthesize 0-pt rows so
  // the leaderboard tab shows who picked teams (and their team is expandable).
  let displayUserScores: UserScoreRow[] = userScores
  if (userScores.length === 0 && isMatchLocked && allSelections.length > 0) {
    const selUserIds = allSelections.map((s) => s.user_id)
    const { data: profilesData } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", selUserIds)
    const nameMap = new Map((profilesData ?? []).map((p: { id: string; display_name: string }) => [p.id, p.display_name]))
    displayUserScores = allSelections.map((s) => ({
      user_id: s.user_id,
      total_points: 0,
      rank: null,
      captain_points: 0,
      vc_points: 0,
      profile: { display_name: nameMap.get(s.user_id) ?? "—" },
    })) as UserScoreRow[]
  }

  return (
    <PageTransition>
      <ScoresClient
        match={{
          id: match.id,
          match_number: match.match_number,
          status: match.status,
          result_summary: match.result_summary,
          cricapi_match_id: match.cricapi_match_id,
          start_time: match.start_time,
        }}
        home={home}
        away={away}
        playerScores={playerScores}
        userScores={displayUserScores}
        myScore={myScore}
        myPlayerIds={myPlayerIds}
        myCaptainId={mySelection?.captain_id as string | null ?? null}
        myVcId={mySelection?.vice_captain_id as string | null ?? null}
        isDraftPick={mySelection?.is_draft_pick ?? false}
        allSelections={allSelections}
        captainPicks={captainPicks}
        currentUserId={user.id}
        h2hDuels={(draftSessionsRes.data ?? []) as H2HDuel[]}
      />
    </PageTransition>
  )
}
