"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getInitials, getAvatarColor } from "@/lib/avatar"
import type { DraftSession, MatchWithTeams } from "@/lib/types"

type SessionItem = {
  session: DraftSession
  opponent: { id: string; display_name: string }
}

type Props = {
  match: MatchWithTeams
  matchId: string
  sessions: SessionItem[]
}

const phaseLabel: Record<string, string> = {
  team_a: "Draft in progress",
  team_b: "Draft in progress",
  impact_selection: "Picking impact player",
  complete: "Complete",
}

export function DraftSessionSelector({ match, matchId, sessions }: Props) {
  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Match #{match.match_number}</p>
        <h2 className="text-lg font-bold font-display">
          {match.team_home.short_name} vs {match.team_away.short_name}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">You have {sessions.length} active drafts — pick one to continue</p>
      </div>

      <div className="space-y-3">
        {sessions.map(({ session, opponent }) => (
          <Card key={session.id} className="border-border">
            <CardContent className="flex items-center gap-4 py-4 px-4">
              <div className={`h-10 w-10 rounded-full ${getAvatarColor(opponent.display_name)} flex items-center justify-center shrink-0`}>
                <span className="text-white text-sm font-bold">{getInitials(opponent.display_name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{opponent.display_name}</p>
                <Badge variant="secondary" className="text-[10px] mt-0.5">
                  {phaseLabel[session.phase] ?? session.phase}
                </Badge>
              </div>
              <Button size="sm" asChild>
                <Link href={`/match/${matchId}/pick?session=${session.id}`}>
                  Continue →
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Link href={`/match/${matchId}/pick?session=new`} className="text-xs text-muted-foreground underline underline-offset-2">
          Challenge another player
        </Link>
      </div>
    </div>
  )
}
