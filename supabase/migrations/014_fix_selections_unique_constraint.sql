-- Migration 014: Fix selections unique constraint for multi-session drafts
-- The UNIQUE(user_id, match_id) constraint blocks a user from having multiple
-- draft selections on the same match (one per draft session). Migration 012
-- allowed multiple draft_sessions per match per user but forgot to fix this.

-- Drop the overly-broad constraint
ALTER TABLE selections DROP CONSTRAINT IF EXISTS selections_user_id_match_id_key;

-- For regular (non-draft) picks: still 1 per user per match
CREATE UNIQUE INDEX selections_unique_regular
  ON selections(user_id, match_id)
  WHERE is_draft_pick = false;

-- For draft picks: 1 per user per match per session
CREATE UNIQUE INDEX selections_unique_draft
  ON selections(user_id, match_id, draft_session_id)
  WHERE is_draft_pick = true;
