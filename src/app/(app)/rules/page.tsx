import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { PageTransition } from "@/components/page-transition"
import type { ScoringCategory } from "@/lib/types"

const CATEGORY_ORDER: ScoringCategory[] = ["batting", "bowling", "fielding", "bonus", "penalty"]
const CATEGORY_LABELS: Record<ScoringCategory, string> = {
  batting: "Batting",
  bowling: "Bowling",
  fielding: "Fielding",
  bonus: "Bonus",
  penalty: "Penalty",
}
const CATEGORY_COLOR: Record<ScoringCategory, string> = {
  batting: "text-blue-400",
  bowling: "text-purple-400",
  fielding: "text-emerald-400",
  bonus: "text-amber-400",
  penalty: "text-red-400",
}

const howToPlaySections = [
  {
    title: "The Challenge",
    color: "text-primary",
    steps: [
      "Before each match, challenge any league member to a 1v1 draft duel from the match page.",
      "Your opponent receives a notification. Once they accept, the draft begins immediately.",
      "You can run multiple simultaneous drafts — challenge as many players as you like for the same match.",
    ],
  },
  {
    title: "Building Your Roster — The Snake Draft",
    color: "text-blue-400",
    steps: [
      "Both players draft from the combined Playing XI (up to 22 players across both teams).",
      "A coin toss determines who picks first (Team A). The loser picks second (Team B).",
      "Picks follow a snake order: Team A picks 1st, 3rd, 5th… Team B picks 2nd, 4th, 6th…",
      "Each player drafts exactly 8 players. The remaining slots are filled automatically from the undrafted pool.",
      "The player who picked second (Team B) in this match gets first pick (Team A) in your next match together — the advantage alternates every game.",
    ],
  },
  {
    title: "Captain & Impact Player",
    color: "text-amber-400",
    steps: [
      "After the draft, each player secretly picks one of their 8 drafted players as their Impact Player.",
      "The Impact Player earns 2× fantasy points for that match.",
      "Choose wisely — your opponent won't see your pick until scores are revealed.",
    ],
  },
  {
    title: "Scoring & Winning",
    color: "text-emerald-400",
    steps: [
      "Fantasy points are calculated after the match based on real performances (runs, wickets, catches, etc.).",
      "Your total = sum of all 11 players' fantasy points, with your Impact Player doubled.",
      "The player with the higher total wins the H2H matchup.",
      "Your net score (your total minus your opponent's) is added to the season leaderboard.",
      "No Result matches: all players receive a flat 15 points.",
    ],
  },
  {
    title: "Season Standings",
    color: "text-purple-400",
    steps: [
      "The leaderboard ranks players by cumulative net score across all matches.",
      "Win big → big positive net. Lose → negative net. The margin matters.",
      "You can be paired against multiple opponents per match — your net is the sum of all H2H results that match.",
    ],
  },
]

export default async function RulesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()
  const { data: rules } = await admin
    .from("scoring_rules")
    .select("category, label, points")
    .eq("is_active", true)
    .order("points", { ascending: false })

  // Group by category
  type RuleRow = { category: string; label: string; points: number }
  const grouped = new Map<ScoringCategory, RuleRow[]>()
  for (const rule of rules ?? []) {
    const cat = rule.category as ScoringCategory
    const arr = grouped.get(cat) ?? []
    arr.push(rule)
    grouped.set(cat, arr)
  }

  const activeCategories = CATEGORY_ORDER.filter((c) => (grouped.get(c)?.length ?? 0) > 0)

  return (
    <PageTransition>
    <div className="p-4 md:p-6 space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-display">Rules & Guide</h1>
        <p className="text-sm text-muted-foreground mt-1">How to play and point scoring reference</p>
      </div>

      <Tabs defaultValue="how-to-play">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="how-to-play">How to Play</TabsTrigger>
          <TabsTrigger value="scoring">Scoring Guide</TabsTrigger>
        </TabsList>

        {/* ── How to Play ── */}
        <TabsContent value="how-to-play" className="mt-4 space-y-4">
          {howToPlaySections.map((section) => (
            <Card key={section.title} className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className={`text-base ${section.color}`}>{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {section.steps.map((step, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="text-muted-foreground shrink-0 tabular-nums mt-0.5">{i + 1}.</span>
                    <span className="text-foreground/90 leading-relaxed">{step}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Scoring Guide ── */}
        <TabsContent value="scoring" className="mt-4 space-y-4">
          {activeCategories.map((cat) => {
            const catRules = grouped.get(cat) ?? []
            return (
              <Card key={cat} className="border border-border">
                <CardHeader className="pb-3">
                  <CardTitle className={`text-base flex items-center gap-2 ${CATEGORY_COLOR[cat]}`}>
                    {CATEGORY_LABELS[cat]}
                    <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground border-border">
                      {catRules.length} rules
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-border/50">
                  {catRules.map((rule) => (
                    <div key={rule.label} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 text-sm">
                      <span className="text-foreground/90">{rule.label}</span>
                      <span className={`font-semibold tabular-nums shrink-0 ml-4 ${rule.points >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {rule.points > 0 ? "+" : ""}{rule.points}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>
    </div>
    </PageTransition>
  )
}
