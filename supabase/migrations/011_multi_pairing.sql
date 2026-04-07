-- Migration 011: Allow a user to appear in multiple pairings per match
-- Previously UNIQUE(match_id, user1_id) and UNIQUE(match_id, user2_id) blocked this.
-- Replace with a pair-level unique so the same two users can't be paired twice,
-- but each user can play against multiple opponents.

ALTER TABLE match_pairings DROP CONSTRAINT match_pairings_match_id_user1_id_key;
ALTER TABLE match_pairings DROP CONSTRAINT match_pairings_match_id_user2_id_key;

-- Prevent exact duplicate pairs (A vs B twice), but allow A vs B and A vs C
ALTER TABLE match_pairings ADD CONSTRAINT match_pairings_unique_pair
  UNIQUE(match_id, user1_id, user2_id);
