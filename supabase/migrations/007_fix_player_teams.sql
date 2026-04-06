-- Fix stale team assignments from previous IPL seasons.
-- Finn Allen played for RCB in IPL 2024 but moved to KKR for IPL 2025/2026.
-- Incorrect team_id caused him to appear as an RCB player in drafts.

UPDATE players
SET team_id = (SELECT id FROM teams WHERE short_name = 'KKR' LIMIT 1)
WHERE name = 'Finn Allen'
  AND team_id = (SELECT id FROM teams WHERE short_name = 'RCB' LIMIT 1);
