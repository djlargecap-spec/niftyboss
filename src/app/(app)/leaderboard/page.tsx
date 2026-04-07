import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy as TrophyIcon, Zap, Crown, Target } from "lucide-react"
import { Trophy } from "@/components/icons/trophy"
import { getInitials, getAvatarColor } from "@/lib/avatar"
import { RankBadge } from "@/components/rank-badge"
import { EmptyState } from "@/components/empty-state"
import { PageTransition } from "@/components/page-transition"

const MEDALS = ["\u{1F947}", "\u{1F948}", "\u{1F949}"] as const

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch season leaderboard and matchday history in parallel
  const [leaderboardRes, matchScoresRes] = await Promise.all([
    supabase
      .from("season_leaderboard")
      .select("*")
      .order("season_rank", { ascending: true }),
    supabase
      .from("user_match_scores")
      .select("match_id, user_id, total_points, net_points, rank, match:matches(match_number)")
      .order("match_id", { ascending: false })
      .limit(500),
  ])

  const leaderboard = leaderboardRes.data ?? []
  const matchScoresRaw = matchScoresRes.data ?? []

  // No profiles at all → nothing to show
  if (leaderboard.length === 0) {
    return (
      <PageTransition>
        <div className="p-4 md:p-6 max-w-3xl space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
          <EmptyState icon={TrophyIcon} title="No players yet" description="Standings will appear once players join the league" />
        </div>
      </PageTransition>
    )
  }

  // True when at least one user has scored in a completed match
  const seasonHasScores = leaderboard.some((e) => Number(e.matches_played) > 0)

  // Build a display name map from leaderboard
  const nameMap = new Map(leaderboard.map((e) => [e.user_id, e.display_name]))

  // Build matchday history (winners per match)
  type MatchWinner = { matchNumber: number; matchId: string; winners: { name: string; points: number; netPoints: number | null }[] }
  const matchesMap = new Map<string, MatchWinner>()
  for (const row of matchScoresRaw) {
    const matchNumber = (row.match as unknown as { match_number: number })?.match_number
    if (!matchNumber || row.rank !== 1) continue
    if (!matchesMap.has(row.match_id)) {
      matchesMap.set(row.match_id, {
        matchNumber,
        matchId: row.match_id,
        winners: [],
      })
    }
    matchesMap.get(row.match_id)!.winners.push({
      name: nameMap.get(row.user_id) ?? "Unknown",
      points: row.total_points,
      netPoints: (row as unknown as { net_points: number | null }).net_points ?? null,
    })
  }
  const matchHistory = [...matchesMap.values()].sort((a, b) => b.matchNumber - a.matchNumber)

  // Key stats from leaderboard
  const sortedByHighest = [...leaderboard].sort((a, b) => {
    const aHighest = (a as unknown as { highest_score?: number }).highest_score ?? 0
    const bHighest = (b as unknown as { highest_score?: number }).highest_score ?? 0
    return bHighest - aHighest
  })
  const sortedByWins = [...leaderboard].sort((a, b) => {
    const aWins = (a as unknown as { first_place_count?: number }).first_place_count ?? 0
    const bWins = (b as unknown as { first_place_count?: number }).first_place_count ?? 0
    return bWins - aWins
  })

  return (
    <PageTransition>
    <div className="p-4 md:p-6 max-w-3xl space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>

      {/* Season in progress banner */}
      {!seasonHasScores && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400/90">
          Season in progress — standings update automatically after each match completes.
        </div>
      )}

      {/* Season Standings */}
      <div className="rounded-lg border border-border/30 bg-[hsl(var(--background))] overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/30 bg-secondary/20">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Season Standings</span>
        </div>
        <div>
          {leaderboard.map((entry, i) => {
            const rank = entry.season_rank ?? i + 1
            const isMe = entry.user_id === user.id
            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 px-4 py-2.5 border-b border-border/10 last:border-b-0 ${isMe ? "bg-primary/5" : ""}`}
              >
                <span className="w-6 text-center text-sm shrink-0">
                  {rank <= 3 ? MEDALS[rank - 1] : <span className="text-muted-foreground">{rank}</span>}
                </span>
                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${getAvatarColor(entry.display_name)}`}>
                  <span className="text-white text-[10px] font-semibold">{getInitials(entry.display_name)}</span>
                </div>
                <span className={`text-sm flex-1 ${isMe ? "font-bold" : "font-medium"}`}>
                  {entry.display_name}
                  {isMe && <span className="text-primary text-[10px] ml-1">(you)</span>}
                </span>
                <span className="text-sm font-bold font-display tabular-nums">{Number(entry.total_points)}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{entry.matches_played}M</span>
                <span className="text-[10px] text-muted-foreground tabular-nums w-12 text-right">{Number(entry.avg_points).toFixed(0)} avg</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Key Stats */}
      {leaderboard.length >= 3 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Key Stats</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              {
                icon: Zap,
                label: "Highest Score",
                name: sortedByHighest[0]?.display_name,
                stat: `${(sortedByHighest[0] as unknown as { highest_score?: number })?.highest_score ?? 0} pts`,
              },
              {
                icon: TrophyIcon,
                label: "Most Wins",
                name: sortedByWins[0]?.display_name,
                stat: `${(sortedByWins[0] as unknown as { first_place_count?: number })?.first_place_count ?? 0} wins`,
              },
              {
                icon: Target,
                label: "Best Average",
                name: leaderboard[0]?.display_name,
                stat: `${Number(leaderboard[0]?.avg_points ?? 0).toFixed(1)} avg`,
              },
            ].map((award) => (
              <Card key={award.label} className="border border-border/40">
                <CardContent className="pt-3 pb-3 px-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <award.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-medium">{award.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {award.name && (
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${getAvatarColor(award.name)}`}>
                        <span className="text-white text-[8px] font-bold">{getInitials(award.name)}</span>
                      </div>
                    )}
                    <span className="text-xs font-medium truncate">{award.name ?? "\u2014"}</span>
                  </div>
                  <p className="text-lg font-bold font-display mt-1">{award.stat}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Matchday History */}
      {matchHistory.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Matchday History</p>
          <div className="rounded-lg border border-border/30 bg-[hsl(var(--background))] overflow-hidden divide-y divide-border/10">
            {matchHistory.map((match) => (
              <div key={match.matchNumber} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="text-xs text-muted-foreground">Match #{match.matchNumber}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-medium">
                      {match.winners.map((w) => w.name).join(" & ")}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-bold font-display tabular-nums">
                  {match.winners[0]?.netPoints != null
                    ? `+${match.winners[0].netPoints}`
                    : `${match.winners[0]?.points}`} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  )
}
