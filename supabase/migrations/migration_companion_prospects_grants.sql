-- ============================================================
-- Counsellor Prospects & Notes Companion — grants fix
-- Run AFTER migration_companion_prospects_notes.sql and _v2.sql.
-- Fixes: "permission denied for table companion_notes / companion_prospects"
-- (403 errors) seen in the counsellor/admin portals. The API calls these
-- tables with the Supabase service_role key, but tables created via the
-- SQL editor don't automatically inherit grants for that role on every
-- project — this makes it explicit. Purely additive/safe to re-run.
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companion_prospects TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companion_notes     TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companion_conflicts TO service_role;

ALTER TABLE public.companion_prospects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_notes     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_conflicts DISABLE ROW LEVEL SECURITY;
