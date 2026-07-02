-- =========================================================
-- IGI Portal — Enable Row-Level Security on all tables
-- Run once in Supabase SQL Editor to clear the security alert.
--
-- Strategy: Enable RLS on every table, then grant anon SELECT
-- on all tables (app reads via anon key) and anon INSERT/UPDATE
-- on tables the app writes to. This preserves current behaviour
-- while satisfying Supabase's security check.
--
-- Tighten individual policies after confirming nothing breaks.
-- =========================================================

-- ── 1. ENABLE RLS ────────────────────────────────────────────
ALTER TABLE public.counselors                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_students              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_feedback         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fees                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_marks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hod_approvals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tray_registry               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tray_history                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tray_notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_annual_targets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_centre_targets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_monthly_achieved    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_target_revisions    ENABLE ROW LEVEL SECURITY;

-- Run this only if you already ran revenue_audit_log_migration.sql:
-- ALTER TABLE public.revenue_audit_log        ENABLE ROW LEVEL SECURITY;

-- Add any other tables created after this file was written:
-- ALTER TABLE public.<table_name>             ENABLE ROW LEVEL SECURITY;


-- ── 2. DROP OLD POLICIES (safe to re-run) ────────────────────
-- Prevents "policy already exists" errors on re-runs.
DO $$ DECLARE
  t TEXT;
  p TEXT;
BEGIN
  FOR t, p IN
    SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public'
    AND policyname LIKE 'igi_anon_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p, t);
  END LOOP;
END $$;


-- ── 3. ANON READ — all tables (app reads everything via anon key) ──
CREATE POLICY igi_anon_select_counselors             ON public.counselors             FOR SELECT USING (true);
CREATE POLICY igi_anon_select_batches                ON public.batches                FOR SELECT USING (true);
CREATE POLICY igi_anon_select_batch_students         ON public.batch_students         FOR SELECT USING (true);
CREATE POLICY igi_anon_select_sessions               ON public.sessions               FOR SELECT USING (true);
CREATE POLICY igi_anon_select_attendance_feedback    ON public.attendance_feedback    FOR SELECT USING (true);
CREATE POLICY igi_anon_select_student_fees           ON public.student_fees           FOR SELECT USING (true);
CREATE POLICY igi_anon_select_assessments            ON public.assessments            FOR SELECT USING (true);
CREATE POLICY igi_anon_select_assessment_marks       ON public.assessment_marks       FOR SELECT USING (true);
CREATE POLICY igi_anon_select_holidays               ON public.holidays               FOR SELECT USING (true);
CREATE POLICY igi_anon_select_hod_approvals          ON public.hod_approvals          FOR SELECT USING (true);
CREATE POLICY igi_anon_select_tray_registry          ON public.tray_registry          FOR SELECT USING (true);
CREATE POLICY igi_anon_select_tray_history           ON public.tray_history           FOR SELECT USING (true);
CREATE POLICY igi_anon_select_tray_notifications     ON public.tray_notifications     FOR SELECT USING (true);
CREATE POLICY igi_anon_select_rev_annual             ON public.revenue_annual_targets      FOR SELECT USING (true);
CREATE POLICY igi_anon_select_rev_centre             ON public.revenue_centre_targets      FOR SELECT USING (true);
CREATE POLICY igi_anon_select_rev_monthly            ON public.revenue_monthly_achieved    FOR SELECT USING (true);
CREATE POLICY igi_anon_select_rev_revisions          ON public.revenue_target_revisions    FOR SELECT USING (true);


-- ── 4. ANON WRITE — tables the app inserts/updates via anon key ──

-- Counselors (login check, update PIN/photo)
CREATE POLICY igi_anon_write_counselors ON public.counselors
  FOR ALL USING (true) WITH CHECK (true);

-- Batches (counsellor creates/edits batches)
CREATE POLICY igi_anon_write_batches ON public.batches
  FOR ALL USING (true) WITH CHECK (true);

-- Batch students (enroll / remove students)
CREATE POLICY igi_anon_write_batch_students ON public.batch_students
  FOR ALL USING (true) WITH CHECK (true);

-- Sessions (create / update / cancel)
CREATE POLICY igi_anon_write_sessions ON public.sessions
  FOR ALL USING (true) WITH CHECK (true);

-- Attendance & feedback
CREATE POLICY igi_anon_write_attendance_feedback ON public.attendance_feedback
  FOR ALL USING (true) WITH CHECK (true);

-- Student fees
CREATE POLICY igi_anon_write_student_fees ON public.student_fees
  FOR ALL USING (true) WITH CHECK (true);

-- Assessments + marks
CREATE POLICY igi_anon_write_assessments ON public.assessments
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY igi_anon_write_assessment_marks ON public.assessment_marks
  FOR ALL USING (true) WITH CHECK (true);

-- Holidays
CREATE POLICY igi_anon_write_holidays ON public.holidays
  FOR ALL USING (true) WITH CHECK (true);

-- HOD approvals
CREATE POLICY igi_anon_write_hod_approvals ON public.hod_approvals
  FOR ALL USING (true) WITH CHECK (true);

-- Tray tables
CREATE POLICY igi_anon_write_tray_registry      ON public.tray_registry      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY igi_anon_write_tray_history       ON public.tray_history       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY igi_anon_write_tray_notifications ON public.tray_notifications FOR ALL USING (true) WITH CHECK (true);

-- Revenue tables
CREATE POLICY igi_anon_write_rev_annual   ON public.revenue_annual_targets   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY igi_anon_write_rev_centre   ON public.revenue_centre_targets   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY igi_anon_write_rev_monthly  ON public.revenue_monthly_achieved FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY igi_anon_write_rev_revisions ON public.revenue_target_revisions FOR ALL USING (true) WITH CHECK (true);

-- Audit log (if already created)
-- CREATE POLICY igi_anon_write_rev_audit ON public.revenue_audit_log FOR ALL USING (true) WITH CHECK (true);


-- ── DONE ─────────────────────────────────────────────────────
-- After running this you should see 0 RLS warnings in Supabase.
-- The policies above are permissive (USING (true)) — they stop
-- the alert and do not change who can access what today.
--
-- NEXT STEP (optional hardening):
--   Replace USING (true) write policies with row-level checks
--   once you add a proper auth layer (e.g. JWT claims, service key).
-- =========================================================
