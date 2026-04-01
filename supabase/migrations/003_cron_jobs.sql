-- ============================================================
-- TIPL Fantasy Cricket — Cron Jobs (pg_cron)
-- ============================================================
-- NOTE: pg_cron must be enabled in Supabase Dashboard > Database > Extensions
-- before running these statements.

-- Auto-lock matches: transition 'upcoming' → 'live' when start_time passes
-- Runs every 5 minutes
SELECT cron.schedule(
  'auto-lock-matches',
  '*/5 * * * *',
  'SELECT public.auto_lock_matches()'
);
