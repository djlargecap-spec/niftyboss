"use client"

import { useEffect, useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { sendChallenge, acceptChallenge, declineChallenge, cancelChallenge } from "@/actions/draft"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getInitials, getAvatarColor } from "@/lib/avatar"
import type { Challenge, MatchWithTeams } from "@/lib/types"

type Profile = { id: string; display_name: string }

type Props = {
  match: MatchWithTeams
  currentUserId: string
  allProfiles: Profile[]
  sentChallenge: (Challenge & { challenged: Profile }) | null
  receivedChallenge: (Challenge & { challenger: Profile }) | null
}

export function DraftLobby({ match, currentUserId, allProfiles, sentChallenge, receivedChallenge }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Poll every 5s — waiting for opponent to accept/decline
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(interval)
  }, [router])

  function handleSend(challengedId: string) {
    setError(null)
    startTransition(async () => {
      const res = await sendChallenge(match.id, challengedId)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  function handleAccept(challengeId: string) {
    setError(null)
    startTransition(async () => {
      const res = await acceptChallenge(challengeId)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  function handleDecline(challengeId: string) {
    setError(null)
    startTransition(async () => {
      const res = await declineChallenge(challengeId)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  function handleCancel(challengeId: string) {
    setError(null)
    startTransition(async () => {
      const res = await cancelChallenge(challengeId)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  const challengeable = allProfiles.filter((p) => p.id !== currentUserId)

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      {/* Match header */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Match #{match.match_number}</p>
        <h2 className="text-lg font-bold font-display">
          {match.team_home.short_name} vs {match.team_away.short_name}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Challenge a league member to a 1v1 draft</p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Incoming challenge */}
      {receivedChallenge && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full ${getAvatarColor(receivedChallenge.challenger.display_name)} flex items-center justify-center`}>
                <span className="text-white text-sm font-bold">{getInitials(receivedChallenge.challenger.display_name)}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{receivedChallenge.challenger.display_name}</p>
                <p className="text-xs text-muted-foreground">challenged you to a draft duel</p>
              </div>
              <Badge variant="outline" className="text-primary border-primary/40">Incoming</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                size="sm"
                onClick={() => handleAccept(receivedChallenge.id)}
                disabled={isPending}
              >
                Accept &amp; Start Draft
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDecline(receivedChallenge.id)}
                disabled={isPending}
              >
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sent challenge waiting */}
      {sentChallenge && (
        <Card className="border-border">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full ${getAvatarColor(sentChallenge.challenged.display_name)} flex items-center justify-center`}>
                <span className="text-white text-sm font-bold">{getInitials(sentChallenge.challenged.display_name)}</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{sentChallenge.challenged.display_name}</p>
                <p className="text-xs text-muted-foreground">Waiting for them to accept…</p>
              </div>
              <Badge variant="secondary">Pending</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => handleCancel(sentChallenge.id)}
              disabled={isPending}
            >
              Cancel Challenge
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Challenge list — only show if no active challenge */}
      {!sentChallenge && !receivedChallenge && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">League members</p>
          {challengeable.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No other users in the league yet.</p>
          ) : (
            challengeable.map((profile) => (
              <Card key={profile.id} className="border-border">
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full ${getAvatarColor(profile.display_name)} flex items-center justify-center`}>
                      <span className="text-white text-xs font-bold">{getInitials(profile.display_name)}</span>
                    </div>
                    <span className="text-sm font-medium">{profile.display_name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSend(profile.id)}
                    disabled={isPending}
                  >
                    Challenge
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
