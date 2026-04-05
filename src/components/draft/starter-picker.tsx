"use client"

import { useEffect, useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { claimFirstPick } from "@/actions/draft"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getInitials, getAvatarColor } from "@/lib/avatar"

type Props = {
  draftSessionId: string
  matchTeamAName: string
  matchTeamBName: string
  currentUserId: string
  opponentDisplayName: string
}

export function StarterPicker({
  draftSessionId,
  matchTeamAName,
  matchTeamBName,
  currentUserId,
  opponentDisplayName,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [claimed, setClaimed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Poll every 3s — detect if opponent claimed first pick
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 3000)
    return () => clearInterval(interval)
  }, [router])

  function handleClaim() {
    setError(null)
    startTransition(async () => {
      const res = await claimFirstPick(draftSessionId)
      if (res.error) {
        // Already claimed by opponent — refresh to see draft room
        if (res.error === "First pick already claimed") router.refresh()
        else setError(res.error)
      } else {
        setClaimed(true)
        router.refresh()
      }
    })
  }

  return (
    <div className="p-4 space-y-6 max-w-sm mx-auto pt-12">
      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Draft Starting</p>
        <h2 className="text-xl font-bold font-display">Who picks first?</h2>
        <p className="text-sm text-muted-foreground">
          First pick is from <span className="text-foreground font-medium">{matchTeamAName}</span>.
          The other player starts picks from <span className="text-foreground font-medium">{matchTeamBName}</span>.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Me */}
        <Card className="border-border">
          <CardContent className="pt-4 pb-4 flex flex-col items-center gap-3">
            <div className={`h-12 w-12 rounded-full ${getAvatarColor("You")} flex items-center justify-center`}>
              <span className="text-white font-bold text-sm">You</span>
            </div>
            <Button
              className="w-full"
              size="sm"
              onClick={handleClaim}
              disabled={isPending || claimed}
            >
              {claimed ? "Waiting…" : "I go first"}
            </Button>
          </CardContent>
        </Card>

        {/* Opponent */}
        <Card className="border-border">
          <CardContent className="pt-4 pb-4 flex flex-col items-center gap-3">
            <div className={`h-12 w-12 rounded-full ${getAvatarColor(opponentDisplayName)} flex items-center justify-center`}>
              <span className="text-white font-bold text-sm">{getInitials(opponentDisplayName)}</span>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {claimed ? "Waiting for them…" : `${opponentDisplayName} goes first`}
            </p>
          </CardContent>
        </Card>
      </div>

      {claimed && (
        <p className="text-center text-xs text-muted-foreground animate-pulse">
          Waiting for {opponentDisplayName} to see…
        </p>
      )}
    </div>
  )
}
