-- ============================================================
-- IGI Portal — Core Tables (run in Supabase SQL Editor)
-- Covers: counselors, batches, batch_students, sessions,
--   attendance_feedback, student_fees, assessments,
--   assessment_marks, holidays, hod_approvals
-- ============================================================

-- ── Counselors (login / auth) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.counselors (
  name          TEXT PRIMARY KEY,
  pin           TEXT NOT NULL,
  role          TEXT DEFAULT 'Counselor',  -- Counselor | Manager | Admin
  centres       TEXT,                       -- comma-separated e.g. Mumbai,Chennai
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Batches ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.batches (
  batch_code    TEXT PRIMARY KEY,
  centre        TEXT,
  course        TEXT,
  type          TEXT,
  batch_slot    TEXT,
  start_date    DATE,
  end_date      DATE,
  counselor     TEXT,
  instructor    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Batch Students ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.batch_students (
  student_id            TEXT,
  batch_code            TEXT,
  name                  TEXT,
  mobile_last4          TEXT,
  mobile                TEXT,
  email                 TEXT,
  status                TEXT DEFAULT 'Active',
  welcome_email_status  TEXT,
  welcome_email_sent_at TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (student_id, batch_code)
);

-- ── Sessions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sessions (
  session_code    TEXT PRIMARY KEY,
  batch_code      TEXT,
  session_date    DATE,
  session_no      INTEGER,
  instructor      TEXT,
  session_type    TEXT DEFAULT 'Scheduled',
  topic_covered   TEXT,
  auto_created    TEXT DEFAULT 'N',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Attendance & Feedback ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance_feedback (
  session_code  TEXT,
  enrollment_no TEXT,
  student_name  TEXT,
  batch_code    TEXT,
  centre        TEXT,
  course        TEXT,
  instructor    TEXT,
  topic         TEXT,
  status        TEXT DEFAULT 'Completed',  -- Completed | Absent
  q1_rating     INTEGER,
  q2_clarity    INTEGER,
  q3_pace       TEXT,
  q4_doubts     TEXT,
  q5_learned    TEXT,
  q6_suggestion TEXT,
  anonymous     TEXT DEFAULT 'N',
  recorded_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (session_code, enrollment_no)
);

-- ── Student Fees ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_fees (
  student_id          TEXT PRIMARY KEY,
  student_name        TEXT,
  batch_code          TEXT,
  centre              TEXT,
  course              TEXT,
  course_fee          NUMERIC DEFAULT 0,
  gst_amount          NUMERIC DEFAULT 0,
  registration_fee    NUMERIC DEFAULT 0,
  registration_gst    NUMERIC DEFAULT 0,
  discount_pct        NUMERIC DEFAULT 0,
  discount_amount     NUMERIC DEFAULT 0,
  discount_reason     TEXT,
  tds_pct             NUMERIC DEFAULT 0,
  tds_amount          NUMERIC DEFAULT 0,
  net_payable         NUMERIC DEFAULT 0,
  n_installments      INTEGER DEFAULT 1,
  inst1_amount        NUMERIC DEFAULT 0,
  inst1_due           DATE,
  inst1_paid          TEXT DEFAULT 'N',
  inst1_paid_date     DATE,
  inst1_mode          TEXT,
  inst1_reference     TEXT,
  inst2_amount        NUMERIC DEFAULT 0,
  inst2_due           DATE,
  inst2_paid          TEXT DEFAULT 'N',
  inst2_paid_date     DATE,
  inst2_mode          TEXT,
  inst2_reference     TEXT,
  inst3_amount        NUMERIC DEFAULT 0,
  inst3_due           DATE,
  inst3_paid          TEXT DEFAULT 'N',
  inst3_paid_date     DATE,
  inst3_mode          TEXT,
  inst3_reference     TEXT,
  collected           NUMERIC DEFAULT 0,
  outstanding         NUMERIC DEFAULT 0,
  fee_status          TEXT DEFAULT 'Pending',
  entered_by          TEXT,
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ── Assessments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assessments (
  assessment_id TEXT PRIMARY KEY,
  batch_code    TEXT,
  test_name     TEXT,
  test_type     TEXT DEFAULT 'MCQ',
  test_date     DATE,
  total_marks   NUMERIC,
  instructor    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── Assessment Marks ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assessment_marks (
  assessment_id   TEXT,
  enrollment_no   TEXT,
  student_name    TEXT,
  marks_obtained  NUMERIC,
  percentage      NUMERIC,
  result          TEXT,
  remarks         TEXT,
  total_marks     NUMERIC,
  updated_at      TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (assessment_id, enrollment_no)
);

-- ── Holidays ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.holidays (
  date          DATE,
  holiday_name  TEXT,
  centre        TEXT,
  added_at      TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (date, centre)
);

-- ── HOD Approvals ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hod_approvals (
  approval_id   TEXT PRIMARY KEY,
  student_id    TEXT,
  batch_code    TEXT,
  student_name  TEXT,
  weekly_avg    NUMERIC,
  final_exam    NUMERIC,
  requested_by  TEXT,
  requested_at  TIMESTAMPTZ,
  status        TEXT DEFAULT 'Pending',
  reviewed_by   TEXT,
  reviewed_at   TIMESTAMPTZ,
  note          TEXT
);

-- ── RLS: enable + allow anon full access ──────────────────────
ALTER TABLE public.counselors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_students      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fees        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_marks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hod_approvals       ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'counselors','batches','batch_students','sessions',
    'attendance_feedback','student_fees','assessments',
    'assessment_marks','holidays','hod_approvals'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "anon_all_%s" ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "anon_all_%s" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)',
      tbl, tbl
    );
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon', tbl);
  END LOOP;
END $$;

-- ── Seed counselors (UPDATE pins before running!) ─────────────
-- Default PIN for all is 1234 — change immediately after setup
INSERT INTO public.counselors (name, pin, role, centres) VALUES
  ('Anuradha',  '1234', 'Counselor', 'Pune'),
  ('Arpita',    '1234', 'Counselor', 'Kolkata'),
  ('Bianca',    '1234', 'Counselor', 'Mumbai'),
  ('Kripa',     '1234', 'Counselor', 'Bangalore'),
  ('Mrinal',    '1234', 'Counselor', 'Delhi'),
  ('Preethy',   '1234', 'Counselor', 'Chennai'),
  ('Rajini',    '1234', 'Counselor', 'Hyderabad'),
  ('Rohit',     '1234', 'Counselor', 'Ahmedabad'),
  ('Sunita',    '1234', 'Counselor', 'Jaipur')
ON CONFLICT (name) DO NOTHING;

-- Admin (can access all centres)
INSERT INTO public.counselors (name, pin, role, centres) VALUES
  ('__admin__', '1234', 'Admin', '')
ON CONFLICT (name) DO NOTHING;
