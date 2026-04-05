-- Add team_a_starter_id to track who picks first in Team A phase.
-- NULL = starter not yet decided (StarterPicker UI shown).
-- Team B starter is always the OTHER user (automatic).

ALTER TABLE draft_sessions
  ADD COLUMN team_a_starter_id UUID REFERENCES profiles(id);
