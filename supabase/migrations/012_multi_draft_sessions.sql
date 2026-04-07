-- Migration 012: Allow a user to be in multiple draft sessions per match
-- Previously UNIQUE(match_id, user1_id) and UNIQUE(match_id, user2_id) on draft_sessions
-- blocked a user from drafting with a second opponent in the same match.

ALTER TABLE draft_sessions DROP CONSTRAINT IF EXISTS draft_sessions_match_id_user1_id_key;
ALTER TABLE draft_sessions DROP CONSTRAINT IF EXISTS draft_sessions_match_id_user2_id_key;

-- Keep a constraint that the exact same pair can't have two sessions for one match
ALTER TABLE draft_sessions ADD CONSTRAINT draft_sessions_unique_pair
  UNIQUE(match_id, user1_id, user2_id);
