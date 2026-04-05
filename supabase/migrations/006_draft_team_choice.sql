-- The starter chooses which team to draft from first.
-- NULL = not yet chosen (TeamPicker UI shown after starter is decided).
-- team_b is always the other team (determined at runtime).

ALTER TABLE draft_sessions
  ADD COLUMN team_a_team_id UUID REFERENCES teams(id);
