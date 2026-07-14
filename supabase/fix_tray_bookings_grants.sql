-- ═══════════════════════════════════════════════════════════════
-- FIX: Grant anon + authenticated access to tray_bookings / tray_weekly_needs
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql
--
-- Problem: migration_tray_bookings_and_weekly_needs.sql created these two
--   tables and set up RLS policies, but never ran the GRANT statement
--   (unlike create_tables.sql's original tables, which got their grants
--   from enable_policies.sql). RLS policies alone don't grant access —
--   Postgres also requires an explicit table-level GRANT for the role,
--   which is why PostgREST returns 401 / 42501 "permission denied for
--   table tray_bookings" even though the policy exists.
-- ═══════════════════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tray_bookings     TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tray_weekly_needs TO anon, authenticated;

-- Sequences (harmless no-op here since both PKs are TEXT, but keeps parity
-- with the rest of the schema in case columns change later)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Verify
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('tray_bookings','tray_weekly_needs')
  AND grantee IN ('anon','authenticated')
ORDER BY table_name, grantee, privilege_type;
