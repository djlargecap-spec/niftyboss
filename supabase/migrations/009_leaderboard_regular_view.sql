-- Migration 009: Convert season_leaderboard from materialized view to regular view
-- This ensures all registered users always appear regardless of scoring status.
-- Previously the materialized view was created at migration time (before any users),
-- and only refreshed on match completion — meaning 0-score users were invisible.

DROP MATERIALIZED VIEW IF EXISTS season_leaderboard;

CREATE VIEW season_leaderboard AS
SELECT
  p.id                                                              AS user_id,
  p.display_name,
  p.avatar_url,
  COALESCE(SUM(ums.total_points), 0)                               AS total_points,
  COUNT(ums.id)                                                     AS matches_played,
  CASE WHEN COUNT(ums.id) > 0
    THEN ROUND(SUM(ums.total_points)::numeric / COUNT(ums.id), 1)
    ELSE 0
  END                                                               AS avg_points,
  COUNT(CASE WHEN ums.rank = 1 THEN 1 END)                        AS first_place_count,
  COUNT(CASE WHEN ums.rank <= 3 THEN 1 END)                       AS podium_count,
  ROW_NUMBER() OVER (
    ORDER BY COALESCE(SUM(ums.total_points), 0) DESC, p.display_name
  )                                                                 AS season_rank
FROM profiles p
LEFT JOIN user_match_scores ums ON ums.user_id = p.id
GROUP BY p.id, p.display_name, p.avatar_url;

-- Grant read access to authenticated users (mirrors the previous materialized view grant)
GRANT SELECT ON season_leaderboard TO authenticated;

-- Keep function signature intact so scoring pipeline calls don't break.
-- The view is live; no refresh step is needed.
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- season_leaderboard is now a regular view; no manual refresh needed.
  NULL;
END;
$$;
