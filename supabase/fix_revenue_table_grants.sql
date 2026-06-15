-- ═══════════════════════════════════════════════════════════════
-- FIX: Grant anon + authenticated access to revenue tables
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql
--
-- Problem: Tables created via raw SQL don't auto-grant access to
--   the anon/authenticated roles. PostgREST returns 401 because
--   the sb_publishable_ anon key isn't a JWT, so it falls back to
--   unauthenticated access — which is blocked without explicit GRANTs.
-- ═══════════════════════════════════════════════════════════════

-- Grant full access to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON revenue_annual_targets  TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON revenue_centre_targets   TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON revenue_monthly_achieved TO anon, authenticated;

-- Also grant USAGE on sequences (needed for any serial/identity columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Make sure RLS policies are in place (re-create idempotently)
ALTER TABLE revenue_annual_targets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_centre_targets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_monthly_achieved ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon read"  ON revenue_annual_targets;
DROP POLICY IF EXISTS "anon write" ON revenue_annual_targets;
CREATE POLICY "anon read"  ON revenue_annual_targets FOR SELECT USING (true);
CREATE POLICY "anon write" ON revenue_annual_targets FOR ALL    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon read"  ON revenue_centre_targets;
DROP POLICY IF EXISTS "anon write" ON revenue_centre_targets;
CREATE POLICY "anon read"  ON revenue_centre_targets FOR SELECT USING (true);
CREATE POLICY "anon write" ON revenue_centre_targets FOR ALL    USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon read"  ON revenue_monthly_achieved;
DROP POLICY IF EXISTS "anon write" ON revenue_monthly_achieved;
CREATE POLICY "anon read"  ON revenue_monthly_achieved FOR SELECT USING (true);
CREATE POLICY "anon write" ON revenue_monthly_achieved FOR ALL    USING (true) WITH CHECK (true);

-- Verify
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('revenue_annual_targets','revenue_centre_targets','revenue_monthly_achieved')
  AND grantee IN ('anon','authenticated')
ORDER BY table_name, grantee, privilege_type;
