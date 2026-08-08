-- QUERY 8: Found it (probably) — only 1 row exists in `assessments` across the
-- ENTIRE system. The manual Marks tab appears to have never actually persisted
-- data for anyone. Most likely cause: Row Level Security silently blocking the
-- anon-key INSERT that the instructor portal uses (the client-side code doesn't
-- verify the write actually landed — see h_createAssessment / h_saveAssessmentMarks
-- in assets/shared.js, which report "ok" on any non-error HTTP response even if
-- RLS caused Postgres to insert zero rows).

-- 8a. Is RLS even enabled on these two tables, and do policies exist for the
--     `anon` role (the key the instructor portal actually authenticates with)?
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('assessments', 'assessment_marks');

-- 8b. What policies actually exist on these tables (if any), and for which roles?
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('assessments', 'assessment_marks');

-- 8c. What does that single existing row in `assessments` actually look like?
--     (helps tell us whether it was a real instructor save, a manual test insert,
--     or seed data)
SELECT * FROM assessments;
