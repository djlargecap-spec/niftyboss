"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { setImpactPlayer } from "@/actions/draft"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DraftSession, DraftPick, PlayerWithTeam } from "@/lib/types"

type Props = {
  session: DraftSession
  myPicks: DraftPick[]
  players: PlayerWithTeam[]
  currentUserId: string
  opponentDisplayName: string
  myImpactSet: boolean
  opponentImpactSet: boolean
}

export function ImpactPicker({
  session,
  myPicks,
  players,
  currentUserId,
  opponentDisplayName,
  myImpactSet: initialMySet,
  opponentImpactSet: initialOppSet,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mySet, setMySet] = useState(initialMySet)
  const [oppSet, setOppSet] = useState(initialOppSet)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Poll every 3s — detect when opponent sets their impact player
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 3000)
    return () => clearInterval(interval)
  }, [router])

  function handleConfirm() {
    if (!selectedId) return
    setError(null)
    startTransition(async () => {
      const res = await setImpactPlayer(session.id, selectedId)
      if (res.error) { setError(res.error); return }
      setMySet(true)
      if (res.bothSet) router.refresh()
    })
  }

  const playerMap = new Map(players.map((p) => [p.id, p]))
  const myPlayers = myPicks.map((pick) => playerMap.get(pick.player_id)).filter(Boolean) as PlayerWithTeam[]

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Draft Complete</p>
        <h2 className="text-lg font-bold font-display">Pick Your Impact Player</h2>
        <p className="text-xs text-muted-foreground">Your impact player earns 2× points</p>
      </div>

      {/* Status */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${mySet ? "bg-green-500" : "bg-muted"}`} />
          <span className={mySet ? "text-green-500" : "text-muted-foreground"}>You {mySet ? "✓" : "pending"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${oppSet ? "bg-green-500" : "bg-muted"}`} />
          <span className={oppSet ? "text-green-500" : "text-muted-foreground"}>{opponentDisplayName} {oppSet ? "✓" : "pending"}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {mySet ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {oppSet ? "Both set! Loading…" : `Waiting for ${opponentDisplayName} to pick their impact player…`}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2">
            {myPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedId(player.id)}
                disabled={isPending}
                className={`w-full text-left rounded-lg border transition-all px-4 py-3 ${
                  selectedId === player.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-accent/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{player.name}</p>
                    <p className="text-xs text-muted-foreground">{player.team.short_name} · {player.role}</p>
                  </div>
                  {selectedId === player.id && (
                    <Badge className="bg-primary text-primary-foreground">2×</Badge>
                  )}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleConfirm}
            disabled={!selectedId || isPending}
            className="w-full rounded-lg bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-50 transition-opacity"
          >
            {isPending ? "Confirming…" : "Confirm Impact Player"}
          </button>
        </>
      )}
    </div>
  )
}
