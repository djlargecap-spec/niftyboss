"use client"

import { useEffect, useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { makePick } from "@/actions/draft"
import { getDraftedPlayerIds, getActiveTeamId } from "@/lib/draft"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DraftSession, DraftPick, MatchWithTeams, PlayerWithTeam } from "@/lib/types"

type Profile = { id: string; display_name: string }

type Props = {
  match: MatchWithTeams
  session: DraftSession
  initialPicks: DraftPick[]
  players: PlayerWithTeam[]
  currentUserId: string
  opponentProfile: Profile
}

export function DraftRoom({ match, session, initialPicks, players, currentUserId, opponentProfile }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Poll every 3s — keeps both users in sync during the draft
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 3000)
    return () => clearInterval(interval)
  }, [router])

  function handlePick(playerId: string) {
    if (session.current_turn !== currentUserId) return
    setError(null)
    startTransition(async () => {
      const res = await makePick(session.id, playerId)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  const draftedIds = getDraftedPlayerIds(initialPicks)
  const activeTeamId = getActiveTeamId(session.phase, match.team_home_id, match.team_away_id)

  const isMyTurn = session.current_turn === currentUserId
  const myPicks = initialPicks.filter((p) => p.user_id === currentUserId)
  const opponentPicks = initialPicks.filter((p) => p.user_id !== currentUserId)

  const availablePlayers = activeTeamId
    ? players.filter((p) => p.team_id === activeTeamId && !draftedIds.has(p.id))
    : []

  const phaseLabel = session.phase === "team_a"
    ? `Picking from ${match.team_home.short_name}`
    : `Picking from ${match.team_away.short_name}`

  const turnLabel = isMyTurn ? "Your turn to pick" : `${opponentProfile.display_name}'s turn…`

  const myTeamAPicks = myPicks.filter((p) => p.phase === "team_a")
  const myTeamBPicks = myPicks.filter((p) => p.phase === "team_b")
  const oppTeamAPicks = opponentPicks.filter((p) => p.phase === "team_a")
  const oppTeamBPicks = opponentPicks.filter((p) => p.phase === "team_b")

  const playerMap = new Map(players.map((p) => [p.id, p]))

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{phaseLabel}</p>
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${
          isMyTurn ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        }`}>
          {isMyTurn ? "⚡ " : "⏳ "}{turnLabel}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Picks comparison */}
      <div className="grid grid-cols-2 gap-3">
        <PickColumn
          label="Your Team"
          teamALabel={match.team_home.short_name}
          teamBLabel={match.team_away.short_name}
          teamAPicks={myTeamAPicks}
          teamBPicks={myTeamBPicks}
          playerMap={playerMap}
          isMe
        />
        <PickColumn
          label={opponentProfile.display_name}
          teamALabel={match.team_home.short_name}
          teamBLabel={match.team_away.short_name}
          teamAPicks={oppTeamAPicks}
          teamBPicks={oppTeamBPicks}
          playerMap={playerMap}
          isMe={false}
        />
      </div>

      {/* Available players */}
      {isMyTurn && availablePlayers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Pick from {activeTeamId === match.team_home_id ? match.team_home.short_name : match.team_away.short_name}
          </p>
          <div className="grid grid-cols-1 gap-2">
            {availablePlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => handlePick(player.id)}
                disabled={isPending}
                className="w-full text-left rounded-lg border border-border bg-card hover:bg-accent/50 active:scale-[0.98] transition-all px-4 py-3 disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{player.name}</p>
                    <p className="text-xs text-muted-foreground">{player.role}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{player.role}</Badge>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Waiting for opponent */}
      {!isMyTurn && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <div className="animate-pulse text-muted-foreground text-sm">
              Waiting for {opponentProfile.display_name} to pick…
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PickColumn({
  label,
  teamALabel,
  teamBLabel,
  teamAPicks,
  teamBPicks,
  playerMap,
  isMe,
}: {
  label: string
  teamALabel: string
  teamBLabel: string
  teamAPicks: DraftPick[]
  teamBPicks: DraftPick[]
  playerMap: Map<string, PlayerWithTeam>
  isMe: boolean
}) {
  return (
    <div className={`rounded-lg border p-3 space-y-2 ${isMe ? "border-primary/30" : "border-border"}`}>
      <p className="text-xs font-semibold truncate">{label}</p>
      <TeamPickGroup label={teamALabel} picks={teamAPicks} playerMap={playerMap} />
      <TeamPickGroup label={teamBLabel} picks={teamBPicks} playerMap={playerMap} />
    </div>
  )
}

function TeamPickGroup({
  label,
  picks,
  playerMap,
}: {
  label: string
  picks: DraftPick[]
  playerMap: Map<string, PlayerWithTeam>
}) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      {Array.from({ length: 4 }).map((_, i) => {
        const pick = picks[i]
        const player = pick ? playerMap.get(pick.player_id) : null
        return (
          <div
            key={i}
            className={`rounded px-2 py-1 mb-1 text-xs ${
              player ? "bg-primary/10 text-foreground" : "bg-muted/40 text-muted-foreground"
            }`}
          >
            {player ? player.name : <span className="opacity-40">— slot {i + 1}</span>}
          </div>
        )
      })}
    </div>
  )
}
