import type { DraftPhase, DraftPick } from "./types"

/**
 * Alternating 1-2-1-2 draft order.
 *
 * Team A (picks 0–7): starter, other, starter, other… (4 picks each)
 * Team B (picks 8–15): the OTHER user starts, then alternates
 *
 * team_a_starter_id is chosen via StarterPicker before the draft begins.
 * Team B starter is always the user who did NOT start Team A.
 */
export function getWhoseTurn(
  pickCount: number,
  teamAStarterId: string,
  user1Id: string,
  user2Id: string
): string {
  const teamBStarterId = teamAStarterId === user1Id ? user2Id : user1Id
  const phaseStarter = pickCount < 8 ? teamAStarterId : teamBStarterId
  const phaseOther   = phaseStarter === user1Id ? user2Id : user1Id
  const posInPhase   = pickCount < 8 ? pickCount % 2 : (pickCount - 8) % 2
  return posInPhase === 0 ? phaseStarter : phaseOther
}

export function getPhaseFromPickCount(pickCount: number): DraftPhase {
  if (pickCount < 8) return "team_a"
  if (pickCount < 16) return "team_b"
  return "impact_selection"
}

export function getDraftedPlayerIds(picks: DraftPick[]): Set<string> {
  return new Set(picks.map((p) => p.player_id))
}

export function getActiveTeamId(
  phase: DraftPhase,
  teamATeamId: string,   // whichever team the starter chose
  teamBTeamId: string    // the other team
): string | null {
  if (phase === "team_a") return teamATeamId
  if (phase === "team_b") return teamBTeamId
  return null
}

/** Given two team IDs and the starter's chosen team, return the other team ID */
export function getTeamBId(teamHomeId: string, teamAwayId: string, teamATeamId: string): string {
  return teamATeamId === teamHomeId ? teamAwayId : teamHomeId
}
