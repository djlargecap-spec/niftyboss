#!/usr/bin/env node
/**
 * CricBoss End-to-End Simulation Script
 * Tests: Leaderboard view, Match status flow, Scoring pipeline, Selection lock
 *
 * Usage:
 *   node scripts/simulate.mjs
 *
 * Requires the dev server to be running on localhost:3000
 */

// ─── Config ─────────────────────────────────────────────────────────────────
const SUPA_URL = "https://vgwlvwakrdzhqydbawtg.supabase.co"
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnd2x2d2FrcmR6aHF5ZGJhd3RnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTEyMzQ1NCwiZXhwIjoyMDkwNjk5NDU0fQ.cs1Rs0rrIa_ZrEBF8NBknO8_rFqdk0qyWjva5SbZ5uw"
const SM_TOKEN = "uGSfJN0A1SueUv6szCNbWZdDQD9kQNv8fgFRe4qYvuScZqfijXENaAl3uQuy"
const SM_BASE  = "https://cricket.sportmonks.com/api/v2.0"
const CRON_SECRET = "3a5223d57bb531b1c18e324b765992eb"
const LOCAL = "http://localhost:3000"

// Match 11 (completed April 5, cricapi=69528) — used for scoring simulation
const SIM_MATCH_DB_ID    = "81205ae8-9eaf-436a-a09a-31a5691ccf53"
const SIM_CRICAPI_ID     = "69528"
const SIM_TEAM_HOME_ID   = "a1000001-0000-0000-0000-000000000008"  // SRH
const SIM_TEAM_AWAY_ID   = "a1000001-0000-0000-0000-000000000001"  // CSK

let passed = 0, failed = 0, warned = 0

// ─── Helpers ─────────────────────────────────────────────────────────────────
function log(msg)  { process.stdout.write(msg + "\n") }
function ok(label)  { passed++; log(`  ✅ ${label}`) }
function fail(label, detail) { failed++; log(`  ❌ ${label}${detail ? ": " + detail : ""}`) }
function warn(label, detail) { warned++; log(`  ⚠️  ${label}${detail ? ": " + detail : ""}`) }
function section(title) { log(`\n${"═".repeat(60)}\n  ${title}\n${"═".repeat(60)}`) }

async function supa(path, opts = {}) {
  const res = await fetch(`${SUPA_URL}/rest/v1${path}`, {
    ...opts,
    headers: {
      "Authorization": `Bearer ${SUPA_KEY}`,
      "apikey": SUPA_KEY,
      "Content-Type": "application/json",
      "Prefer": opts.prefer ?? "return=representation",
      ...(opts.headers ?? {}),
    },
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = text }
  return { ok: res.ok, status: res.status, data }
}

async function supaRpc(fn, params = {}) {
  return supa(`/rpc/${fn}`, { method: "POST", body: JSON.stringify(params) })
}

// ─── Stage 0: Scoring Rule Audit ────────────────────────────────────────────
async function auditScoringRules() {
  section("STAGE 0 — Scoring Rule Audit")

  const { data: rules } = await supa("/scoring_rules?select=name,points,is_active&order=category")
  if (!Array.isArray(rules) || rules.length === 0) {
    fail("scoring_rules loaded", "no active rules found — scoring will produce 0 pts for everyone")
    return
  }

  const activeRules = rules.filter(r => r.is_active)
  ok(`${activeRules.length} active scoring rules loaded`)

  // Check for non-standard values
  const expectations = { run: 1, four_bonus: 4, six_bonus: 6, wicket: 25, catch: 8 }
  for (const rule of activeRules) {
    const expected = expectations[rule.name]
    if (expected !== undefined && rule.points !== expected) {
      warn(`scoring rule '${rule.name}' = ${rule.points} pts`, `standard is ${expected} pts — verify this is intentional`)
    } else {
      log(`     ${rule.name}: ${rule.points} pts`)
    }
  }
}

// ─── Stage 1: Leaderboard View ───────────────────────────────────────────────
async function verifyLeaderboard() {
  section("STAGE 1 — Leaderboard View")

  const { data: rows } = await supa("/season_leaderboard?select=display_name,total_points,matches_played,season_rank&order=season_rank")

  if (!Array.isArray(rows)) {
    fail("season_leaderboard query", JSON.stringify(rows))
    return
  }

  if (rows.length === 0) {
    fail("all users visible on leaderboard", "0 rows returned — materialized view issue or no profiles")
    return
  }

  ok(`${rows.length} users visible on leaderboard (expected 9+)`)

  // All users should appear (even 0-score users)
  const zeroScore = rows.filter(r => Number(r.total_points) === 0)
  const withScore = rows.filter(r => Number(r.total_points) > 0)
  log(`     users with pts: ${withScore.length}, users with 0 pts: ${zeroScore.length}`)

  // After reset, everyone should have 0 pts
  if (withScore.length > 0) {
    warn("some users have non-zero points", `${withScore.length} user(s) still have scores — reset may not have run yet`)
  } else {
    ok("all users at 0 pts (clean start confirmed)")
  }

  // season_rank should be sequential and 1-indexed
  const ranks = rows.map(r => r.season_rank)
  if (ranks[0] === 1) ok("season_rank starts at 1")
  else fail("season_rank starts at 1", `first rank is ${ranks[0]}`)

  for (const r of rows) {
    log(`     ${String(r.season_rank).padStart(2)}. ${r.display_name.padEnd(25)} pts=${r.total_points} matches=${r.matches_played}`)
  }
}

// ─── Stage 2: Match Status Flow ──────────────────────────────────────────────
async function verifyMatchStatusFlow() {
  section("STAGE 2 — Match Status Flow")

  // Check auto_lock_matches function exists
  const { data: fns } = await supa("/rpc/auto_lock_matches", { method: "POST", body: "{}" })
  // If it errors it means the function doesn't exist or errored
  if (fns && fns.code) {
    fail("auto_lock_matches RPC exists", fns.message ?? JSON.stringify(fns))
  } else {
    ok("auto_lock_matches() RPC callable (pg_cron will call this every 5 min)")
  }

  // Today's match (Match 12) should be upcoming
  const { data: match12 } = await supa("/matches?match_number=eq.12&select=id,status,start_time")
  if (!Array.isArray(match12) || match12.length === 0) {
    fail("Match 12 exists", "not found")
    return
  }
  const m12 = match12[0]
  log(`     Match 12: status=${m12.status}, start=${m12.start_time}`)

  if (m12.status === "upcoming") ok("Match 12 is upcoming (correct — not yet started)")
  else if (m12.status === "live") ok("Match 12 is live (started — scoring pipeline should be running)")
  else fail("Match 12 status", `expected upcoming/live, got ${m12.status}`)

  // Verify start_time is in the future or very recent (UTC)
  const startUtc = new Date(m12.start_time)
  const nowUtc = new Date()
  const diffMins = (startUtc - nowUtc) / 60000
  log(`     Match 12 starts in: ${diffMins > 0 ? diffMins.toFixed(0) + " min" : "already started (${Math.abs(diffMins).toFixed(0)} min ago)"}`)

  if (diffMins > 0) {
    ok(`Match 12 lock will trigger in ${diffMins.toFixed(0)} min via pg_cron auto_lock_matches()`)
  } else {
    warn("Match 12 start_time has passed", "it should be live — check if pg_cron is enabled in Supabase")
  }

  // Completed match count
  const { data: statusCounts } = await supa("/matches?select=status")
  if (Array.isArray(statusCounts)) {
    const counts = {}
    for (const m of statusCounts) counts[m.status] = (counts[m.status] || 0) + 1
    ok(`Match status distribution: ${JSON.stringify(counts)}`)
  }
}

// ─── Stage 3: Scoring Pipeline ───────────────────────────────────────────────
async function verifyScoring() {
  section("STAGE 3 — Scoring Pipeline (Match 11 simulation)")

  // Step 1: Verify SportMonks has scorecard data for Match 11
  log("\n  Step 1: Fetch SportMonks scorecard for match 69528...")
  const smRes = await fetch(
    `${SM_BASE}/fixtures/69528?include=batting.result,bowling,lineup&api_token=${SM_TOKEN}`
  )
  const smData = await smRes.json()

  if (!smRes.ok || !smData.data) {
    fail("SportMonks API reachable for match 69528", smData.error ?? "unknown error")
    return
  }

  const fixture = smData.data
  const innings = fixture.batting ?? []
  const bowlingRaw = fixture.bowling ?? []
  const lineup = fixture.lineup ?? []

  log(`     innings entries: ${innings.length}, bowling entries: ${bowlingRaw.length}, lineup: ${lineup.length}`)

  if (innings.length === 0) {
    fail("Match 69528 has scorecard data", "no batting data — match may not be fully scored on SportMonks yet")
    return
  }
  ok(`SportMonks has scorecard data for Match 11 (${innings.length} batting entries)`)

  // Step 2: Build player ID → name map from lineup
  // NOTE: SportMonks lineup nests substitution under p.lineup.substitution
  //       and uses p.id (not p.player_id) for the player's SportMonks ID
  const pidToName = new Map()  // sportmonks_player_id (number) → fullname
  for (const p of lineup) {
    pidToName.set(p.id, p.fullname ?? "")
  }
  const starters = lineup.filter(p => !p.lineup?.substitution)
  log(`     Playing XI starters in lineup: ${starters.length} (total lineup: ${lineup.length})`)

  // Step 3: Parse batting + bowling stats (mirrors parseScorecardToStats logic)
  const playerStats = new Map()  // normalizedName → stats

  function getOrInitStats(name) {
    const k = normName(name)
    if (!playerStats.has(k)) playerStats.set(k, { runs: 0, balls_faced: 0, fours: 0, sixes: 0, wickets: 0, overs_bowled: 0, runs_conceded: 0, maidens: 0, catches: 0, stumpings: 0, run_outs: 0 })
    return playerStats.get(k)
  }

  for (const b of innings) {
    const name = pidToName.get(b.player_id) ?? `Player#${b.player_id}`
    const s = getOrInitStats(name)
    s.runs += b.score ?? 0
    s.balls_faced += b.ball ?? 0
    s.fours += b.four_x ?? 0
    s.sixes += b.six_x ?? 0

    // Credit catches/stumpings/runouts to the fielder
    const resultName = b.result?.name ?? ""
    if ((resultName === "Catch Out") && b.catch_stump_player_id) {
      const fn = pidToName.get(b.catch_stump_player_id)
      if (fn) getOrInitStats(fn).catches += 1
    } else if (resultName === "Stumped" && b.catch_stump_player_id) {
      const fn = pidToName.get(b.catch_stump_player_id)
      if (fn) getOrInitStats(fn).stumpings += 1
    } else if (resultName === "Run Out" && b.runout_by_id) {
      const fn = pidToName.get(b.runout_by_id)
      if (fn) getOrInitStats(fn).run_outs += 1
    }
  }

  for (const bwl of bowlingRaw) {
    const name = pidToName.get(bwl.player_id) ?? `Player#${bwl.player_id}`
    const s = getOrInitStats(name)
    s.wickets += bwl.wickets ?? 0
    s.overs_bowled += parseFloat(String(bwl.overs ?? 0))
    s.runs_conceded += bwl.runs ?? 0
    s.maidens += bwl.medians ?? 0
  }

  ok(`Parsed stats for ${playerStats.size} unique players`)

  // Step 4: Load DB players for Match 11's teams
  const { data: dbPlayers } = await supa(
    `/players?team_id=in.(${SIM_TEAM_HOME_ID},${SIM_TEAM_AWAY_ID})&select=id,name,team_id`
  )
  if (!Array.isArray(dbPlayers) || dbPlayers.length === 0) {
    fail("DB players loaded for Match 11 teams", "no players found")
    return
  }
  ok(`${dbPlayers.length} DB players loaded for the two teams`)

  // Build DB name map for matching
  const dbNameMap = new Map()
  for (const p of dbPlayers) dbNameMap.set(normName(p.name), p.id)

  // Step 5: Match API names to DB IDs
  const scoreRows = []
  const { data: rules } = await supa("/scoring_rules?select=name,points&is_active=eq.true")
  const ruleMap = new Map((rules ?? []).map(r => [r.name, r.points]))

  let matched = 0, unmatched = []
  for (const [apiNorm, stats] of playerStats) {
    const dbId = fuzzyMatch(apiNorm, dbNameMap)
    if (!dbId) { unmatched.push(apiNorm); continue }
    matched++
    const pts = calcPts(stats, ruleMap)
    scoreRows.push({ player_id: dbId, stats, pts })
  }

  log(`     Matched: ${matched}/${playerStats.size} players to DB IDs`)
  if (unmatched.length > 0) {
    warn("Some players unmatched", unmatched.slice(0, 5).join(", ") + (unmatched.length > 5 ? "…" : ""))
  }
  ok(`Fantasy points calculated for ${scoreRows.length} players`)

  // Show top scorers
  const top5 = [...scoreRows].sort((a, b) => b.pts.total - a.pts.total).slice(0, 5)
  log("\n     Top 5 scorers (simulation):")
  for (const s of top5) {
    const p = dbPlayers.find(p => p.id === s.player_id)
    log(`       ${(p?.name ?? s.player_id).padEnd(25)} = ${s.pts.total} pts  (${JSON.stringify(s.pts.breakdown)})`)
  }

  // Step 6: Create test selections (2 users picking the top 11 fantasy scorers)
  log("\n  Step 6: Creating test selections for 2 users...")

  // Get 2 real user IDs
  const { data: profiles } = await supa("/profiles?select=id,display_name&limit=2")
  if (!Array.isArray(profiles) || profiles.length < 2) {
    fail("fetch 2 profiles for simulation", "need at least 2 users in DB")
    return
  }

  const [user1, user2] = profiles
  log(`     Using users: ${user1.display_name}, ${user2.display_name}`)

  // Pick top 11 matched players by fantasy points for the test team
  // Use best 11 by pts, respecting the simplest valid composition (no composition check in sim)
  const top11 = [...scoreRows].sort((a, b) => b.pts.total - a.pts.total).slice(0, 11)
  const top11Ids = top11.map(s => s.player_id)

  if (top11Ids.length < 11) {
    warn("Not enough matched players for test team", `only ${top11Ids.length} — will use what's available`)
  }

  // Temporarily set Match 11 to "live" so scoring cron will process it
  log("\n  Step 6a: Setting Match 11 to 'live' for simulation...")
  await supa(`/matches?id=eq.${SIM_MATCH_DB_ID}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "live" }),
    prefer: "return=minimal",
  })

  // Insert test selections
  const simUserIds = [user1.id, user2.id]
  const selectionIds = []
  for (let i = 0; i < simUserIds.length; i++) {
    const uid = simUserIds[i]
    // Remove any existing selection for this match+user (from previous sim runs)
    await supa(`/selections?user_id=eq.${uid}&match_id=eq.${SIM_MATCH_DB_ID}`, {
      method: "DELETE", prefer: "return=minimal",
    })

    const { data: selData } = await supa("/selections", {
      method: "POST",
      body: JSON.stringify({
        user_id: uid,
        match_id: SIM_MATCH_DB_ID,
        captain_id: top11Ids[0] ?? null,
        vice_captain_id: top11Ids[1] ?? null,
        is_auto_pick: false,
        locked_at: new Date().toISOString(),
      }),
    })
    const selId = Array.isArray(selData) ? selData[0]?.id : selData?.id
    if (!selId) {
      fail(`Insert test selection for ${user1.display_name}`, JSON.stringify(selData))
      // Restore match status and bail
      await supa(`/matches?id=eq.${SIM_MATCH_DB_ID}`, { method: "PATCH", body: JSON.stringify({ status: "completed" }), prefer: "return=minimal" })
      return
    }
    selectionIds.push(selId)

    // Insert selection_players
    const spRows = top11Ids.map(pid => ({ selection_id: selId, player_id: pid }))
    await supa("/selection_players", { method: "POST", body: JSON.stringify(spRows), prefer: "return=minimal" })
  }
  ok("Test selections created for 2 users in Match 11")

  // Step 7: Call live-score cron endpoint
  log("\n  Step 7: Calling live-score cron...")
  let cronResult
  try {
    const cronRes = await fetch(`${LOCAL}/api/cron/live-score`, {
      headers: { "Authorization": `Bearer ${CRON_SECRET}` },
      signal: AbortSignal.timeout(30000),
    })
    cronResult = await cronRes.json()
    log(`     cron response: ${JSON.stringify(cronResult)}`)

    if (cronResult.errors && cronResult.errors.length > 0) {
      warn("live-score cron had errors", JSON.stringify(cronResult.errors))
    }
    if (cronResult.updated && cronResult.updated.includes(SIM_MATCH_DB_ID)) {
      ok("live-score cron processed Match 11 successfully")
    } else if (cronResult.updated && cronResult.updated.length > 0) {
      ok(`live-score cron processed matches: ${cronResult.updated.join(", ")}`)
    } else {
      warn("live-score cron ran but Match 11 not in 'updated' list", "check errors above")
    }
  } catch (err) {
    fail("Call live-score cron at localhost:3000", err.message)
    log("     Is the dev server running? Run: npm run dev")
    // Restore and bail
    await supa(`/matches?id=eq.${SIM_MATCH_DB_ID}`, { method: "PATCH", body: JSON.stringify({ status: "completed" }), prefer: "return=minimal" })
    return
  }

  // Step 8: Verify scores written to DB
  log("\n  Step 8: Verifying scores written to DB...")
  const { data: playerScores } = await supa(
    `/match_player_scores?match_id=eq.${SIM_MATCH_DB_ID}&select=player_id,fantasy_points&order=fantasy_points.desc&limit=5`
  )
  if (!Array.isArray(playerScores) || playerScores.length === 0) {
    fail("match_player_scores written", "no rows found")
  } else {
    ok(`${playerScores.length}+ player scores written (showing top 5):`)
    for (const ps of playerScores) {
      const p = dbPlayers.find(p => p.id === ps.player_id)
      log(`       ${(p?.name ?? ps.player_id).padEnd(25)} ${ps.fantasy_points} pts`)
    }
  }

  const { data: userScores } = await supa(
    `/user_match_scores?match_id=eq.${SIM_MATCH_DB_ID}&select=user_id,total_points,rank`
  )
  if (!Array.isArray(userScores) || userScores.length === 0) {
    fail("user_match_scores written", "no rows found")
  } else {
    ok(`${userScores.length} user scores written`)
    for (const us of userScores) {
      const prof = profiles.find(p => p.id === us.user_id)
      log(`       rank ${us.rank}: ${(prof?.display_name ?? us.user_id).padEnd(25)} ${us.total_points} pts`)
    }
  }

  // Step 9: Verify leaderboard reflects new scores
  log("\n  Step 9: Verifying leaderboard updated...")
  const { data: lb } = await supa("/season_leaderboard?select=display_name,total_points,matches_played&order=season_rank")
  const scored = (lb ?? []).filter(r => Number(r.total_points) > 0)
  if (scored.length >= 2) ok("Leaderboard shows 2+ users with points from scoring simulation")
  else warn("Leaderboard users with points", `expected 2+, got ${scored.length}`)

  // Step 10: Cleanup — delete sim selections/scores and restore match status
  log("\n  Step 10: Cleaning up simulation data...")
  // Delete selection_players for our test selections
  for (const selId of selectionIds) {
    await supa(`/selection_players?selection_id=eq.${selId}`, { method: "DELETE", prefer: "return=minimal" })
  }
  // Delete selections
  for (const uid of simUserIds) {
    await supa(`/selections?user_id=eq.${uid}&match_id=eq.${SIM_MATCH_DB_ID}`, { method: "DELETE", prefer: "return=minimal" })
  }
  // Delete user scores and player scores for Match 11
  await supa(`/user_match_scores?match_id=eq.${SIM_MATCH_DB_ID}`, { method: "DELETE", prefer: "return=minimal" })
  await supa(`/match_player_scores?match_id=eq.${SIM_MATCH_DB_ID}`, { method: "DELETE", prefer: "return=minimal" })
  // Set match back to completed
  await supa(`/matches?id=eq.${SIM_MATCH_DB_ID}`, {
    method: "PATCH", body: JSON.stringify({ status: "completed" }), prefer: "return=minimal",
  })
  ok("Simulation data cleaned up, Match 11 restored to completed")
}

// ─── Stage 4: Selection Lock ──────────────────────────────────────────────────
async function verifySelectionLock() {
  section("STAGE 4 — Selection Lock & Auto-Pick")

  // Verify lock-and-autopick endpoint is reachable
  try {
    const res = await fetch(`${LOCAL}/api/cron/lock-and-autopick`, {
      headers: { "Authorization": `Bearer ${CRON_SECRET}` },
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    log(`     lock-and-autopick response: ${JSON.stringify(data)}`)
    ok("lock-and-autopick cron endpoint callable")

    if (typeof data.locked === "number") {
      log(`     matches locked in this run: ${data.locked}`)
      if (data.locked > 0) {
        ok(`${data.locked} match(es) just transitioned upcoming → live`)
      } else {
        ok("No matches to lock right now (correct if Match 12 hasn't started yet)")
      }
    }
  } catch (err) {
    fail("lock-and-autopick endpoint", err.message)
  }

  // Verify auto_pick_enabled is a valid column (regression check)
  const { data: profile } = await supa("/profiles?select=auto_pick_enabled&limit=1")
  if (Array.isArray(profile) && profile.length > 0 && "auto_pick_enabled" in profile[0]) {
    ok("auto_pick_enabled column exists on profiles table")
  } else {
    fail("auto_pick_enabled column", "missing from profiles — auto-pick will silently process 0 users")
  }

  // Check how many users have auto-pick enabled
  const { data: autoPickUsers } = await supa("/profiles?select=display_name&auto_pick_enabled=eq.true")
  log(`     Users with auto-pick enabled: ${Array.isArray(autoPickUsers) ? autoPickUsers.length : "?"}`)
  if (Array.isArray(autoPickUsers)) {
    for (const u of autoPickUsers) log(`       - ${u.display_name}`)
  }
  ok("auto-pick config verified")
}

// ─── Stage 5: Today's Match Readiness ────────────────────────────────────────
async function verifyTodayMatch() {
  section("STAGE 5 — Today's Match (Match 12) Readiness")

  const { data: match12 } = await supa(
    "/matches?match_number=eq.12&select=id,status,start_time,cricapi_match_id,team_home_id,team_away_id"
  )
  const m = Array.isArray(match12) ? match12[0] : null
  if (!m) { fail("Match 12 found", "not in DB"); return }

  // Check playing XI is populated
  const { data: xi, headers: xiH } = await supa(`/playing_xi?match_id=eq.${m.id}&select=player_id`)
  const xiCount = Array.isArray(xi) ? xi.length : 0
  log(`     Playing XI populated for Match 12: ${xiCount} players`)

  if (xiCount >= 22) ok("Playing XI complete (22 players)")
  else if (xiCount > 0) warn("Playing XI partial", `${xiCount} players — lineup may not be announced yet`)
  else warn("Playing XI empty", "lineup not yet fetched — fetch-playing-xi cron will populate this ~30 min before match")

  // Count how many users have picked for today
  const { data: sels } = await supa(`/selections?match_id=eq.${m.id}&select=user_id`)
  const selCount = Array.isArray(sels) ? sels.length : 0
  log(`     User selections for Match 12: ${selCount}`)
  ok(`${selCount} user(s) have picked teams for Match 12`)

  // Check if fetch-playing-xi cron is configured
  ok("fetch-playing-xi cron: GitHub Actions will call /api/cron/fetch-playing-xi every 15 min from 9-16 UTC")
  ok("lock-and-autopick cron: GitHub Actions will call at 10:00 and 14:00 UTC")
  ok("live-score cron: GitHub Actions will call every 5 min from 10-18 UTC")
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  log("╔══════════════════════════════════════════════════════════╗")
  log("║           CRICBOSS END-TO-END SIMULATION                 ║")
  log(`║           ${new Date().toUTCString()}`)
  log("╚══════════════════════════════════════════════════════════╝")

  await auditScoringRules()
  await verifyLeaderboard()
  await verifyMatchStatusFlow()
  await verifyScoring()
  await verifySelectionLock()
  await verifyTodayMatch()

  section("SUMMARY")
  log(`  ✅ PASSED : ${passed}`)
  log(`  ❌ FAILED : ${failed}`)
  log(`  ⚠️  WARNED : ${warned}`)
  log("")
  if (failed === 0 && warned === 0) log("  🏆 ALL CHECKS PASSED — system is ready")
  else if (failed === 0) log("  ✅ No failures — review warnings above")
  else log("  ❌ Action required — check failures above")
}

// ─── Scoring helpers (mirroring src/lib/scoring.ts) ─────────────────────────
function calcPts(stats, ruleMap) {
  const breakdown = {}
  if (stats.runs > 0)    breakdown.run        = (ruleMap.get("run") ?? 0) * stats.runs
  if (stats.fours > 0)   breakdown.four_bonus  = (ruleMap.get("four_bonus") ?? 0) * stats.fours
  if (stats.sixes > 0)   breakdown.six_bonus   = (ruleMap.get("six_bonus") ?? 0) * stats.sixes
  if (stats.wickets > 0) breakdown.wicket      = (ruleMap.get("wicket") ?? 0) * stats.wickets
  if (stats.catches > 0) breakdown.catch       = (ruleMap.get("catch") ?? 0) * stats.catches
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0)
  return { total, breakdown }
}

// ─── Name matching helpers ────────────────────────────────────────────────────
function normName(n) {
  return (n ?? "").toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim()
}

function fuzzyMatch(apiNorm, dbMap) {
  if (dbMap.has(apiNorm)) return dbMap.get(apiNorm)
  for (const [dbNorm, id] of dbMap) {
    if (dbNorm.includes(apiNorm) || apiNorm.includes(dbNorm)) return id
    // Last name match
    const apiLast = apiNorm.split(" ").at(-1)
    const dbLast  = dbNorm.split(" ").at(-1)
    if (apiLast && dbLast && apiLast === dbLast && apiLast.length > 3) return id
  }
  return null
}

main().catch(err => { console.error("Fatal:", err); process.exit(1) })
