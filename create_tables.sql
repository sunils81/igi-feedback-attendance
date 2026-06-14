-- ============================================================
-- IGI Portal — Create ONLY the tables missing from Supabase
-- Already exist (skip): online_tests, test_questions,
--   test_responses, test_starts, test_warnings,
--   question_bank, revenue_targets
-- Run this in Supabase SQL Editor
-- ============================================================

-- Tray Registry (inventory loan/tracking system)
CREATE TABLE IF NOT EXISTS public.tray_registry (
  tray_id             TEXT PRIMARY KEY,
  category            TEXT,
  topic_code          TEXT,
  topic_name          TEXT,
  home_centre         TEXT,
  home_instructor     TEXT,
  stone_count         INTEGER,
  week_usage          TEXT,
  location_status     TEXT,
  current_centre      TEXT,
  expected_return     DATE,
  registered_at       TIMESTAMPTZ,
  notes               TEXT,
  borrower_confirmed  TEXT
);

-- Tray History (movement legs)
CREATE TABLE IF NOT EXISTS public.tray_history (
  history_id       TEXT PRIMARY KEY,
  tray_id          TEXT,
  leg_number       INTEGER,
  from_centre      TEXT,
  to_centre        TEXT,
  from_instructor  TEXT,
  to_instructor    TEXT,
  planned_start    DATE,
  planned_end      DATE,
  actual_sent      DATE,
  actual_received  DATE,
  status           TEXT
);

-- Tray Notifications
CREATE TABLE IF NOT EXISTS public.tray_notifications (
  notif_id      TEXT PRIMARY KEY,
  to_instructor TEXT,
  type          TEXT,
  booking_id    TEXT,
  message       TEXT,
  read          TEXT,
  created_at    TIMESTAMPTZ
);

-- Revenue Annual Targets (per counsellor)
CREATE TABLE IF NOT EXISTS public.revenue_annual_targets (
  period                        TEXT,
  counsellor                    TEXT,
  centre                        TEXT,
  annual_course_fee_target      NUMERIC,
  annual_course_fee_gst_target  NUMERIC,
  notes                         TEXT,
  updated_by                    TEXT,
  updated_at                    TIMESTAMPTZ,
  PRIMARY KEY (period, counsellor)
);

-- Revenue Centre Targets (per centre)
CREATE TABLE IF NOT EXISTS public.revenue_centre_targets (
  period                        TEXT,
  centre                        TEXT,
  annual_course_fee_target      NUMERIC,
  annual_course_fee_gst_target  NUMERIC,
  notes                         TEXT,
  updated_by                    TEXT,
  updated_at                    TIMESTAMPTZ,
  PRIMARY KEY (period, centre)
);

-- Revenue Monthly Achieved (all counsellors merged)
CREATE TABLE IF NOT EXISTS public.revenue_monthly_achieved (
  month                     TEXT,
  period                    TEXT,
  counsellor                TEXT,
  assigned_centre           TEXT,
  business_centre           TEXT,
  business_type             TEXT,
  student_count             INTEGER,
  achieved_course_fee       NUMERIC,
  achieved_course_fee_gst   NUMERIC,
  notes                     TEXT,
  updated_by                TEXT,
  locked                    TEXT,
  updated_at                TIMESTAMPTZ,
  PRIMARY KEY (month, period, counsellor)
);

-- Revenue Target Revisions (audit log)
CREATE TABLE IF NOT EXISTS public.revenue_target_revisions (
  id                            BIGSERIAL PRIMARY KEY,
  revised_at                    TIMESTAMPTZ,
  target_type                   TEXT,
  period                        TEXT,
  centre                        TEXT,
  counsellor                    TEXT,
  old_course_fee_target         NUMERIC,
  old_course_fee_gst_target     NUMERIC,
  new_course_fee_target         NUMERIC,
  new_course_fee_gst_target     NUMERIC,
  reason                        TEXT,
  updated_by                    TEXT
);

-- ── RLS: enable + allow anon full access ──────────────────────────────────────
ALTER TABLE public.tray_registry           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tray_history            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tray_notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_annual_targets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_centre_targets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_monthly_achieved ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_target_revisions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'tray_registry','tray_history','tray_notifications',
    'revenue_annual_targets','revenue_centre_targets',
    'revenue_monthly_achieved','revenue_target_revisions'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "anon_all_%s" ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "anon_all_%s" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)',
      tbl, tbl
    );
  END LOOP;
END $$;
