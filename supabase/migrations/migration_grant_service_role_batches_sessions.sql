-- ============================================================
-- IGI Portal: Grant service_role privileges on batches/sessions
-- Run this in Supabase SQL Editor
-- ============================================================
--
-- Context: the /api/cron/create-sessions Vercel Cron job (and any other
-- serverless function under /api using SUPABASE_SERVICE_ROLE_KEY) connects
-- as the `service_role` Postgres role. Row Level Security policies (like the
-- anon_all policies referenced in BUG_AUDIT.md) only govern the `anon` role
-- used by the browser-side client in assets/shared.js — they say nothing
-- about raw table GRANTs for `service_role`.
--
-- `batches` and `sessions` are older core tables (from schema.sql /
-- create_core_tables.sql) that predate the service-role serverless pattern
-- introduced for things like /api/companion/*, and never received an
-- explicit GRANT for service_role. This caused the cron job to fail with:
--   "permission denied for table batches" (Postgres error 42501)
-- every single time it ran, silently, since no one was watching the logs.
--
-- GRANT is idempotent — safe to re-run.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.batches  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO service_role;
