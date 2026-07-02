-- =========================================================
-- IGI Portal — Enable Row-Level Security on all tables
-- Run in Supabase SQL Editor → clears the security alert.
--
-- Uses DO $$ blocks so it skips tables that don't exist yet
-- and drops/recreates policies safely on re-runs.
-- =========================================================

-- ── 1. Enable RLS on every table (skips if table doesn't exist) ──
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users','batches','students','enrollments','sessions',
    'attendance_feedback','student_fees','assessments','assessment_marks',
    'holidays','hod_approvals','diplomas','otp_tokens','fixed_assets',
    'revenue_monthly_achieved','revenue_annual_targets',
    'revenue_centre_targets','revenue_target_revisions','revenue_audit_log',
    'online_tests','test_questions','test_responses','test_starts','test_warnings',
    'question_bank',
    'crm_leads','crm_activities','crm_followups','crm_assignment_rules',
    'crm_routing_rules','crm_rr_state','crm_system_settings',
    'inv_items','inv_stock','inv_requests','inv_dispatch',
    'inv_vendors','inv_item_vendors',
    'tray_registry','tray_history','tray_notifications'
  ])
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      RAISE NOTICE 'RLS enabled on %', t;
    ELSE
      RAISE NOTICE 'Skipped (table not found): %', t;
    END IF;
  END LOOP;
END $$;


-- ── 2. Drop existing IGI anon policies (safe re-run) ──────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND policyname LIKE 'igi_anon_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;


-- ── 3. Add anon SELECT + ALL policies on every existing table ─────
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users','batches','students','enrollments','sessions',
    'attendance_feedback','student_fees','assessments','assessment_marks',
    'holidays','hod_approvals','diplomas','otp_tokens','fixed_assets',
    'revenue_monthly_achieved','revenue_annual_targets',
    'revenue_centre_targets','revenue_target_revisions','revenue_audit_log',
    'online_tests','test_questions','test_responses','test_starts','test_warnings',
    'question_bank',
    'crm_leads','crm_activities','crm_followups','crm_assignment_rules',
    'crm_routing_rules','crm_rr_state','crm_system_settings',
    'inv_items','inv_stock','inv_requests','inv_dispatch',
    'inv_vendors','inv_item_vendors',
    'tray_registry','tray_history','tray_notifications'
  ])
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      -- Allow anon to read and write (preserves current app behaviour)
      EXECUTE format(
        'CREATE POLICY igi_anon_%s ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)',
        t, t
      );
      RAISE NOTICE 'Policy created on %', t;
    END IF;
  END LOOP;
END $$;

-- ── Done ──────────────────────────────────────────────────────────
-- After running you should see 0 RLS warnings in Supabase dashboard.
-- These are permissive policies — tighten once you add JWT auth.
