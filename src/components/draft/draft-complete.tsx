"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { swapPlayer } from "@/actions/draft"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DraftPick, MatchWithTeams, PlayerWithTeam } from "@/lib/types"

type SelectionInfo = {
  impactPlayerId: string | null
}

type Props = {
  match: MatchWithTeams
  currentUserId: string
  opponentDisplayName: string
  myPicks: DraftPick[]
  opponentPicks: DraftPick[]
  players: PlayerWithTeam[]
  playingXIIds: string[]
  mySelection: SelectionInfo
  opponentSelection: SelectionInfo
}

export function DraftComplete({
  match,
  currentUserId,
  opponentDisplayName,
  myPicks,
  opponentPicks,
  players,
  playingXIIds,
  mySelection,
  opponentSelection,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [swapOut, setSwapOut] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const playerMap = new Map(players.map((p) => [p.id, p]))
  const xiSet = new Set(playingXIIds)

  function handleSwap(inPlayerId: string) {
    if (!swapOut) return
    setError(null)
    startTransition(async () => {
      const res = await swapPlayer(match.id, swapOut, inPlayerId)
      if (res.error) setError(res.error)
      else { setSwapOut(null); router.refresh() }
    })
  }

  const myPlayersById = myPicks.map((p) => playerMap.get(p.player_id)).filter(Boolean) as PlayerWithTeam[]
  const oppPlayersById = opponentPicks.map((p) => playerMap.get(p.player_id)).filter(Boolean) as PlayerWithTeam[]

  // Players in XI not drafted by either user — available for swapping in
  const allDraftedIds = new Set([...myPicks, ...opponentPicks].map((p) => p.player_id))
  const swapCandidates = swapOut
    ? players.filter((p) => {
        const outPlayer = playerMap.get(swapOut)
        return (
          xiSet.has(p.id) &&
          !allDraftedIds.has(p.id) &&
          outPlayer &&
          p.team_id === outPlayer.team_id
        )
      })
    : []

  const xiAnnounced = playingXIIds.length >= 22
  const hasAbsent = myPlayersById.some((p) => !xiSet.has(p.id))

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Draft Locked</p>
        <h2 className="text-lg font-bold font-display">
          {match.team_home.short_name} vs {match.team_away.short_name}
        </h2>
        {xiAnnounced && hasAbsent && (
          <p className="text-xs text-amber-400 mt-1">⚠ Some players aren&apos;t in the XI — tap to swap</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Swap candidate drawer */}
      {swapOut && swapCandidates.length > 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Choose replacement for {playerMap.get(swapOut)?.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {swapCandidates.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSwap(p.id)}
                disabled={isPending}
                className="w-full text-left rounded-lg border border-border bg-card hover:bg-accent/50 px-3 py-2 text-sm"
              >
                {p.name} <span className="text-muted-foreground text-xs">· {p.role}</span>
              </button>
            ))}
            <button
              onClick={() => setSwapOut(null)}
              className="text-xs text-muted-foreground underline mt-1"
            >
              Cancel
            </button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <TeamCard
          label="Your Team"
          picks={myPlayersById}
          impactId={mySelection.impactPlayerId}
          xiSet={xiSet}
          xiAnnounced={xiAnnounced}
          isMe
          onSwap={(id) => setSwapOut(id)}
        />
        <TeamCard
          label={opponentDisplayName}
          picks={oppPlayersById}
          impactId={opponentSelection.impactPlayerId}
          xiSet={xiSet}
          xiAnnounced={xiAnnounced}
          isMe={false}
          onSwap={() => {}}
        />
      </div>
    </div>
  )
}

function TeamCard({
  label,
  picks,
  impactId,
  xiSet,
  xiAnnounced,
  isMe,
  onSwap,
}: {
  label: string
  picks: PlayerWithTeam[]
  impactId: string | null
  xiSet: Set<string>
  xiAnnounced: boolean
  isMe: boolean
  onSwap: (id: string) => void
}) {
  const teamA = picks.filter((p) => picks.indexOf(p) < 4)
  const teamB = picks.filter((p) => picks.indexOf(p) >= 4)

  return (
    <Card className={`border ${isMe ? "border-primary/30" : "border-border"}`}>
      <CardContent className="pt-3 pb-3 px-3 space-y-3">
        <p className="text-xs font-semibold truncate">{label}</p>
        {[teamA, teamB].map((group, gi) => (
          <div key={gi}>
            {group.map((player) => {
              const isImpact = player.id === impactId
              const absent = xiAnnounced && !xiSet.has(player.id)
              return (
                <button
                  key={player.id}
                  onClick={() => isMe && absent && onSwap(player.id)}
                  disabled={!isMe || !absent}
                  className={`w-full text-left rounded px-2 py-1.5 mb-1 flex items-center justify-between transition-colors ${
                    absent ? "bg-red-500/10 text-red-400" :
                    isImpact ? "bg-primary/10 text-primary" :
                    "bg-muted/40 text-foreground"
                  }`}
                >
                  <span className="text-xs truncate">{player.name}</span>
                  <span className="flex gap-1 ml-1 shrink-0">
                    {isImpact && <Badge className="text-[10px] h-4 px-1 bg-primary text-primary-foreground">2×</Badge>}
                    {absent && <Badge variant="destructive" className="text-[10px] h-4 px-1">Out</Badge>}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
