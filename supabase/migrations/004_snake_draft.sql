-- ============================================================
-- Snake Draft System — 1v1 Head-to-Head Pick
-- ============================================================

-- ============================================================
-- NEW ENUM TYPES
-- ============================================================

CREATE TYPE challenge_status AS ENUM ('pending', 'accepted', 'declined', 'expired', 'cancelled');
CREATE TYPE draft_phase AS ENUM ('team_a', 'team_b', 'impact_selection', 'complete');
CREATE TYPE draft_status AS ENUM ('active', 'complete', 'abandoned');

-- ============================================================
-- CHALLENGES (matchmaking)
-- ============================================================

CREATE TABLE challenges (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id       UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  challenger_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenged_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status         challenge_status NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT challenges_no_self_challenge CHECK (challenger_id <> challenged_id),
  UNIQUE(match_id, challenger_id, challenged_id)
);

CREATE INDEX idx_challenges_match      ON challenges(match_id);
CREATE INDEX idx_challenges_challenged ON challenges(challenged_id, status);
CREATE INDEX idx_challenges_challenger ON challenges(challenger_id, status);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Participants can see their own challenges
CREATE POLICY "challenges_select" ON challenges
  FOR SELECT TO authenticated
  USING (challenger_id = auth.uid() OR challenged_id = auth.uid());

-- Only the challenger can insert, and only for upcoming matches
CREATE POLICY "challenges_insert" ON challenges
  FOR INSERT TO authenticated
  WITH CHECK (
    challenger_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches
      WHERE id = match_id AND status = 'upcoming'
    )
  );

-- Participants can update status (accept/decline/cancel)
CREATE POLICY "challenges_update" ON challenges
  FOR UPDATE TO authenticated
  USING (challenger_id = auth.uid() OR challenged_id = auth.uid());

-- ============================================================
-- DRAFT SESSIONS (one per accepted challenge)
-- ============================================================

CREATE TABLE draft_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  challenge_id  UUID NOT NULL UNIQUE REFERENCES challenges(id) ON DELETE CASCADE,
  user1_id      UUID NOT NULL REFERENCES profiles(id), -- challenger, starts Team A
  user2_id      UUID NOT NULL REFERENCES profiles(id), -- challenged, starts Team B
  status        draft_status NOT NULL DEFAULT 'active',
  phase         draft_phase  NOT NULL DEFAULT 'team_a',
  pick_count    INTEGER NOT NULL DEFAULT 0,            -- 0–15; drives snake turn order
  current_turn  UUID NOT NULL REFERENCES profiles(id), -- denormalised for quick reads
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, user1_id),
  UNIQUE(match_id, user2_id)
);

CREATE INDEX idx_draft_sessions_match ON draft_sessions(match_id);
CREATE INDEX idx_draft_sessions_user1 ON draft_sessions(user1_id);
CREATE INDEX idx_draft_sessions_user2 ON draft_sessions(user2_id);

ALTER TABLE draft_sessions ENABLE ROW LEVEL SECURITY;

-- Participants can read their own session; everyone can read completed match sessions (for scores page)
CREATE POLICY "draft_sessions_select" ON draft_sessions
  FOR SELECT TO authenticated
  USING (
    user1_id = auth.uid()
    OR user2_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM matches
      WHERE id = match_id AND status IN ('live', 'completed', 'no_result', 'abandoned')
    )
  );

-- No INSERT/UPDATE via user JWT — admin client (service role) only

-- ============================================================
-- DRAFT PICKS (individual picks within a session)
-- ============================================================

CREATE TABLE draft_picks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_session_id  UUID NOT NULL REFERENCES draft_sessions(id) ON DELETE CASCADE,
  pick_number       INTEGER NOT NULL,  -- 0–15, sequential
  user_id           UUID NOT NULL REFERENCES profiles(id),
  player_id         UUID NOT NULL REFERENCES players(id),
  phase             draft_phase NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(draft_session_id, pick_number),  -- hard concurrency guard
  UNIQUE(draft_session_id, player_id)     -- no player picked twice in same session
);

CREATE INDEX idx_draft_picks_session ON draft_picks(draft_session_id);

ALTER TABLE draft_picks ENABLE ROW LEVEL SECURITY;

-- Participants and post-match public read
CREATE POLICY "draft_picks_select" ON draft_picks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM draft_sessions ds
      WHERE ds.id = draft_session_id
        AND (
          ds.user1_id = auth.uid()
          OR ds.user2_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM matches m
            WHERE m.id = ds.match_id
              AND m.status IN ('live', 'completed', 'no_result', 'abandoned')
          )
        )
    )
  );

-- No INSERT via user JWT — admin client only

-- ============================================================
-- EXTEND EXISTING TABLES (additive — nothing dropped)
-- ============================================================

-- selections: add draft-related columns
ALTER TABLE selections
  ADD COLUMN draft_session_id UUID REFERENCES draft_sessions(id),
  ADD COLUMN impact_player_id UUID REFERENCES players(id),
  ADD COLUMN is_draft_pick    BOOLEAN NOT NULL DEFAULT false;

-- captain_id is reused as impact player (same 2x logic in scoring engine)
-- vice_captain_id stays nullable — will be NULL for all draft picks

-- user_match_scores: track 1v1 result
ALTER TABLE user_match_scores
  ADD COLUMN opponent_id  UUID REFERENCES profiles(id),
  ADD COLUMN duel_winner  BOOLEAN;

-- ============================================================
-- SCORING RULES — replace with 5-rule set
-- ============================================================

-- Deactivate all existing rules
UPDATE scoring_rules SET is_active = false;

-- Insert the 5 new rules (upsert by name in case they exist)
INSERT INTO scoring_rules (category, name, label, points, is_active) VALUES
  ('batting', 'run',        'Run',    5,   true),
  ('batting', 'four_bonus', 'Four',   4,   true),
  ('batting', 'six_bonus',  'Six',    6,   true),
  ('bowling', 'wicket',     'Wicket', 150, true),
  ('fielding', 'catch',     'Catch',  75,  true)
ON CONFLICT (name) DO UPDATE
  SET points = EXCLUDED.points, is_active = true, label = EXCLUDED.label;
