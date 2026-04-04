import { type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCricketProvider } from "@/lib/api"

// SportMonks statuses that map to our DB statuses
const FINISHED_STATUSES = new Set(["Finished"])
const NO_RESULT_STATUSES = new Set(["Abandoned", "Cancelled", "Postponed"])

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()

  // Only check matches that: (a) have a cricapi_match_id, (b) are not yet completed/no_result
  // Prioritise: live first, then upcoming whose start_time has already passed
  const now = new Date().toISOString()
  const { data: matches } = await admin
    .from("matches")
    .select("id, status, cricapi_match_id")
    .in("status", ["live", "upcoming"])
    .not("cricapi_match_id", "is", null)
    .or(`status.eq.live,and(status.eq.upcoming,start_time.lt.${now})`)
    .order("start_time", { ascending: true })
    .limit(50) // cap API calls per run

  if (!matches || matches.length === 0) {
    return Response.json({ message: "No matches to check", completed: 0, no_result: 0 })
  }

  let completed = 0
  let no_result = 0
  const errors: string[] = []

  for (const match of matches) {
    try {
      const info = await getCricketProvider().fetchMatchInfo(match.cricapi_match_id!)
      if (!info) continue

      if (FINISHED_STATUSES.has(info.status)) {
        const note = (info.note ?? "").replace(/\s{2,}/g, " ").trim()
        await admin
          .from("matches")
          .update({
            status: "completed",
            ...(note ? { result_summary: note } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq("id", match.id)
        completed++
      } else if (NO_RESULT_STATUSES.has(info.status)) {
        await admin
          .from("matches")
          .update({ status: "no_result", updated_at: new Date().toISOString() })
          .eq("id", match.id)
        no_result++
      }
    } catch (err) {
      errors.push(`${match.id}: ${String(err)}`)
    }
  }

  // Refresh season leaderboard if any matches were finalised
  if (completed + no_result > 0) {
    await admin.rpc("refresh_leaderboard")
  }

  return Response.json({
    checked: matches.length,
    completed,
    no_result,
    errors: errors.length > 0 ? errors : undefined,
  })
}
