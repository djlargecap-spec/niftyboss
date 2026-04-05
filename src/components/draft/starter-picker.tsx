"use client"

import { useEffect, useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { claimFirstPick, chooseTeam } from "@/actions/draft"
import { Card, CardContent } from "@/components/ui/card"
import { getInitials, getAvatarColor } from "@/lib/avatar"

type Team = { id: string; short_name: string; color: string }

type Props = {
  draftSessionId: string
  teamHome: Team
  teamAway: Team
  currentUserId: string
  teamAStarterId: string | null   // null = no one claimed yet
  opponentDisplayName: string
}

export function StarterPicker({
  draftSessionId,
  teamHome,
  teamAway,
  currentUserId,
  teamAStarterId,
  opponentDisplayName,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Poll every 3s
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 3000)
    return () => clearInterval(interval)
  }, [router])

  const iAmStarter = teamAStarterId === currentUserId
  const opponentIsStarter = teamAStarterId !== null && !iAmStarter
  const noneYet = teamAStarterId === null

  function handleClaim() {
    setError(null)
    startTransition(async () => {
      const res = await claimFirstPick(draftSessionId)
      if (res.error === "First pick already claimed") router.refresh()
      else if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  function handleTeamChoice(teamId: string) {
    setError(null)
    startTransition(async () => {
      const res = await chooseTeam(draftSessionId, teamId)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="p-4 space-y-6 max-w-sm mx-auto pt-12">

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Step 1: claim first pick ── */}
      {noneYet && (
        <>
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Draft Starting</p>
            <h2 className="text-xl font-bold font-display">Who picks first?</h2>
            <p className="text-sm text-muted-foreground">First picker also chooses which team to draft from.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="border-primary/30">
              <CardContent className="pt-4 pb-4 flex flex-col items-center gap-3">
                <div className={`h-12 w-12 rounded-full ${getAvatarColor("You")} flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">You</span>
                </div>
                <button
                  onClick={handleClaim}
                  disabled={isPending}
                  className="w-full rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-50"
                >
                  I go first
                </button>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="pt-4 pb-4 flex flex-col items-center gap-3">
                <div className={`h-12 w-12 rounded-full ${getAvatarColor(opponentDisplayName)} flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">{getInitials(opponentDisplayName)}</span>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Let {opponentDisplayName} go first
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* ── Step 2 (starter): choose your team ── */}
      {iAmStarter && (
        <>
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">You go first</p>
            <h2 className="text-xl font-bold font-display">Choose your team</h2>
            <p className="text-sm text-muted-foreground">
              {opponentDisplayName} will draft from the other team and starts first there.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[teamHome, teamAway].map((team) => (
              <button
                key={team.id}
                onClick={() => handleTeamChoice(team.id)}
                disabled={isPending}
                className="rounded-xl border-2 border-border hover:border-primary/60 bg-card p-5 flex flex-col items-center gap-2 transition-all disabled:opacity-50 active:scale-[0.97]"
              >
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-base"
                  style={{ backgroundColor: team.color }}
                >
                  {team.short_name.slice(0, 2)}
                </div>
                <span className="font-semibold text-sm">{team.short_name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Step 2 (non-starter): waiting ── */}
      {opponentIsStarter && (
        <div className="text-center space-y-4 pt-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Draft Starting</p>
          <h2 className="text-xl font-bold font-display">{opponentDisplayName} goes first</h2>
          <p className="text-sm text-muted-foreground animate-pulse">
            Waiting for them to choose a team…
          </p>
          <p className="text-xs text-muted-foreground">
            You&apos;ll start picks from the other team.
          </p>
        </div>
      )}
    </div>
  )
}
