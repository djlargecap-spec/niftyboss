import type { DraftPhase, DraftPick } from "./types"

/**
 * Snake draft order for the 1v1 system.
 *
 * Each match has two phases of 8 picks (4 per user):
 *   Team A phase (picks 0–7):  user1 starts → pattern 1-2-2-1-1-2-2-1
 *   Team B phase (picks 8–15): user2 starts → pattern 2-1-1-2-2-1-1-2
 *
 * The order is fully deterministic from pick_count — no state needed.
 */

// Positions in an 8-pick round where the "starter" picks (snake: S-O-O-S-S-O-O-S)
const STARTER_POSITIONS = new Set([0, 3, 4, 7])

export function getWhoseTurn(
  pickCount: number,
  user1Id: string,
  user2Id: string
): string {
  if (pickCount < 8) {
    // Team A phase: user1 is the starter
    const pos = pickCount % 8
    return STARTER_POSITIONS.has(pos) ? user1Id : user2Id
  } else {
    // Team B phase: user2 is the starter
    const pos = (pickCount - 8) % 8
    return STARTER_POSITIONS.has(pos) ? user2Id : user1Id
  }
}

export function getPhaseFromPickCount(pickCount: number): DraftPhase {
  if (pickCount < 8) return "team_a"
  if (pickCount < 16) return "team_b"
  return "impact_selection"
}

/** How many picks each user has made in the given phase */
export function getPicksForUser(picks: DraftPick[], userId: string, phase: DraftPhase): DraftPick[] {
  return picks.filter((p) => p.user_id === userId && p.phase === phase)
}

/** All player IDs already drafted in this session */
export function getDraftedPlayerIds(picks: DraftPick[]): Set<string> {
  return new Set(picks.map((p) => p.player_id))
}

/** Which team's players are available for the current phase */
export function getActiveTeamId(
  phase: DraftPhase,
  teamHomeId: string,
  teamAwayId: string
): string | null {
  if (phase === "team_a") return teamHomeId
  if (phase === "team_b") return teamAwayId
  return null
}
