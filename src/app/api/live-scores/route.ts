import { getCricketProvider } from "@/lib/api"
import { NextResponse } from "next/server"

export type LiveScoreEntry = {
  cricapiMatchId: string
  ms: "fixture" | "live" | "result" | string
  score1: string
  score2: string
  note: string | null
}

export async function GET() {
  const scores = await getCricketProvider().fetchLiveScores()
  if (!scores) {
    return NextResponse.json([], { status: 200 })
  }

  // Provider already filters to IPL
  const entries = scores.map((s) => ({
    cricapiMatchId: s.id,
    ms: s.ms,
    score1: s.t1s ?? "",
    score2: s.t2s ?? "",
    note: s.note ?? null,
  } satisfies LiveScoreEntry))

  return NextResponse.json(entries, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
  })
}
