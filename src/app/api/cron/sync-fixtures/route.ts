import { type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCricketProvider } from "@/lib/api"

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()

  const [seasonFixtures, { data: dbMatches }, { data: teams }] = await Promise.all([
    getCricketProvider().fetchSeasonFixtures(),
    admin
      .from("matches")
      .select("id, match_number, start_time, cricapi_match_id, team_home:teams!team_home_id(short_name), team_away:teams!team_away_id(short_name)")
      .order("match_number"),
    admin.from("teams").select("id, short_name"),
  ])

  if (!seasonFixtures) return Response.json({ error: "Failed to fetch fixtures from SportMonks" }, { status: 502 })
  if (!dbMatches) return Response.json({ error: "Failed to load matches from DB" }, { status: 500 })

  const allTeams = teams ?? []
  const teamMap = getCricketProvider().getTeamMap()

  // SportMonks team_id → DB team id
  const smToDb = new Map<number, string>()
  for (const [smId, shortName] of Object.entries(teamMap)) {
    const dbTeam = allTeams.find((t) => t.short_name === shortName)
    if (dbTeam) smToDb.set(Number(smId), dbTeam.id)
  }

  const maxMatchNumber = dbMatches.reduce((m, d) => Math.max(m, d.match_number), 0)

  const toUpdate: Array<{ id: string; cricapi_match_id: string; start_time?: string }> = []
  const toCreate: Array<{
    match_number: number
    team_home_id: string
    team_away_id: string
    venue: string
    start_time: string
    status: string
    cricapi_match_id: string
  }> = []
  let newMatchCounter = maxMatchNumber

  for (const fixture of seasonFixtures) {
    const fixtureId = String(fixture.id)
    const apiDate = new Date(fixture.starting_at).getTime()
    const homeCode = teamMap[fixture.localteam_id] ?? ""
    const awayCode = teamMap[fixture.visitorteam_id] ?? ""

    if (!homeCode || !awayCode) continue // unknown team — skip

    // Find existing DB match by team pair + date within 24h
    const dbMatch = dbMatches.find((dbm) => {
      const home = (dbm.team_home as unknown as { short_name: string })?.short_name
      const away = (dbm.team_away as unknown as { short_name: string })?.short_name
      const dbDate = new Date(dbm.start_time).getTime()
      const withinDay = Math.abs(apiDate - dbDate) < 24 * 60 * 60 * 1000
      const teamMatch = (home === homeCode && away === awayCode) || (home === awayCode && away === homeCode)
      return withinDay && teamMatch
    })

    if (dbMatch) {
      // Update cricapi_match_id and/or start_time if changed
      const needsUpdate =
        dbMatch.cricapi_match_id !== fixtureId ||
        Math.abs(new Date(dbMatch.start_time).getTime() - apiDate) > 60_000 // >1 min drift

      if (needsUpdate) {
        toUpdate.push({
          id: dbMatch.id,
          cricapi_match_id: fixtureId,
          ...(Math.abs(new Date(dbMatch.start_time).getTime() - apiDate) > 60_000
            ? { start_time: fixture.starting_at }
            : {}),
        })
      }
    } else {
      // New fixture — only create if both teams are mapped
      const homeId = smToDb.get(Number(fixture.localteam_id))
      const awayId = smToDb.get(Number(fixture.visitorteam_id))
      if (!homeId || !awayId) continue

      // Avoid duplicate creates within this batch (same fixture appearing twice)
      const alreadyQueued = toCreate.some((c) => c.cricapi_match_id === fixtureId)
      if (alreadyQueued) continue

      newMatchCounter++
      toCreate.push({
        match_number: newMatchCounter,
        team_home_id: homeId,
        team_away_id: awayId,
        venue: "",
        start_time: fixture.starting_at,
        status: "upcoming",
        cricapi_match_id: fixtureId,
      })
    }
  }

  let updated = 0
  const updateErrors: string[] = []

  for (const row of toUpdate) {
    const { id, ...fields } = row
    const { error } = await admin
      .from("matches")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) updateErrors.push(`${id}: ${error.message}`)
    else updated++
  }

  let created = 0
  if (toCreate.length > 0) {
    // Sort by date so match numbers are assigned chronologically
    toCreate.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    // Re-assign match numbers in sorted order
    toCreate.forEach((row, i) => { row.match_number = maxMatchNumber + i + 1 })

    const { error } = await admin.from("matches").insert(toCreate)
    if (error) updateErrors.push(`insert: ${error.message}`)
    else created = toCreate.length
  }

  return Response.json({
    updated,
    created,
    skipped: seasonFixtures.length - updated - created,
    errors: updateErrors.length > 0 ? updateErrors : undefined,
  })
}
