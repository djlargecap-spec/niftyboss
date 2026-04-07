-- Migration 010: H2H pairings + net scoring
-- Adds match_pairings table so admin can set who plays who each match.
-- After scoring, net_points = my_total - opponent_total.
-- season_leaderboard now ranks by SUM(net_points) instead of SUM(total_points).

-- ── 1. Pairings table ─────────────────────────────────────────────────────────
CREATE TABLE match_pairings (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id   UUID        NOT NULL REFERENCES matches(id)   ON DELETE CASCADE,
  user1_id   UUID        NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  user2_id   UUID        NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, user1_id),
  UNIQUE(match_id, user2_id),
  CHECK(user1_id <> user2_id)
);

ALTER TABLE match_pairings ENABLE ROW LEVEL SECURITY;

-- Admins can do everything; authenticated users can read
CREATE POLICY "admins_manage_pairings" ON match_pairings
  FOR ALL
  USING   (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "auth_view_pairings" ON match_pairings
  FOR SELECT USING (auth.role() = 'authenticated');

-- ── 2. net_points column on user_match_scores ─────────────────────────────────
-- Stores (my_total - opponent_total) for a given H2H pairing.
-- NULL means no pairing was set for this match.
ALTER TABLE user_match_scores ADD COLUMN net_points NUMERIC;

-- ── 3. season_leaderboard: rank by net_points ─────────────────────────────────
DROP VIEW IF EXISTS season_leaderboard;

CREATE VIEW season_leaderboard AS
SELECT
  p.id                                                                      AS user_id,
  p.display_name,
  p.avatar_url,
  -- Season total = sum of net scores (0 for matches with no pairing)
  COALESCE(SUM(ums.net_points), 0)                                          AS total_points,
  -- Highest single-match raw fantasy score (used in Key Stats)
  COALESCE(MAX(ums.total_points), 0)                                        AS highest_score,
  COUNT(ums.id)                                                              AS matches_played,
  CASE WHEN COUNT(ums.id) > 0
    THEN ROUND(COALESCE(SUM(ums.net_points), 0)::numeric / COUNT(ums.id), 1)
    ELSE 0
  END                                                                        AS avg_points,
  COUNT(CASE WHEN ums.rank = 1 THEN 1 END)                                 AS first_place_count,
  COUNT(CASE WHEN ums.rank <= 3 THEN 1 END)                                AS podium_count,
  ROW_NUMBER() OVER (
    ORDER BY COALESCE(SUM(ums.net_points), 0) DESC, p.display_name
  )                                                                          AS season_rank
FROM profiles p
LEFT JOIN user_match_scores ums ON ums.user_id = p.id
GROUP BY p.id, p.display_name, p.avatar_url;

GRANT SELECT ON season_leaderboard TO authenticated;

-- Keep refresh_leaderboard() intact (no-op since view is live)
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NULL;
END;
$$;
