-- ============================================================
-- MIGRATION: Smart Learning access + progress (2026-11-27, per Sunil)
-- Counsellor sends a Smart Learning DG/CSG batch to the HOD (hod_approvals type
-- 'SmartLearning'); approving it writes one sl_access row per student: 3 months from the
-- approval day (or the batch start date if later). 'SLExtend' approvals move ends_on.
-- sl_progress holds each module's quiz result and each weekly test; passed_at set = gate open.
-- See h_submitSmartLearningRequest / slApplyApproval / h_getMySmartLearning in shared.js.
-- ============================================================

CREATE TABLE IF NOT EXISTS sl_access (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      TEXT NOT NULL,
  batch_code      TEXT NOT NULL,
  programme       TEXT NOT NULL,              -- 'DG' | 'CSG'
  starts_on       DATE NOT NULL,
  ends_on         DATE NOT NULL,              -- inclusive; moved by extensions
  status          TEXT NOT NULL DEFAULT 'Active',  -- 'Active' | 'Revoked'
  approval_id     TEXT DEFAULT '',
  approved_by     TEXT DEFAULT '',
  approved_at     TIMESTAMPTZ DEFAULT NOW(),
  extended_by     TEXT DEFAULT '',
  extended_at     TIMESTAMPTZ,
  extension_note  TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, batch_code)
);
CREATE INDEX IF NOT EXISTS idx_sl_access_student ON sl_access(student_id);
CREATE INDEX IF NOT EXISTS idx_sl_access_batch ON sl_access(batch_code);

CREATE TABLE IF NOT EXISTS sl_progress (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id     TEXT NOT NULL,
  programme      TEXT NOT NULL,
  module_id      TEXT NOT NULL,               -- e.g. 'dg-clarity-inclusions', 'week-2', 'final'
  watched_pct    INT DEFAULT 0,
  quiz_best      INT,                         -- micro-quiz: correct of 5; tests: percent
  quiz_attempts  INT DEFAULT 0,
  passed_at      TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, programme, module_id)
);
CREATE INDEX IF NOT EXISTS idx_sl_progress_student ON sl_progress(student_id);

ALTER TABLE sl_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE sl_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sl_access' AND policyname = 'anon_all_sl_access') THEN
    EXECUTE 'CREATE POLICY anon_all_sl_access ON sl_access FOR ALL TO anon USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sl_progress' AND policyname = 'anon_all_sl_progress') THEN
    EXECUTE 'CREATE POLICY anon_all_sl_progress ON sl_progress FOR ALL TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sl_access TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sl_progress TO anon;
GRANT SELECT ON public.sl_access, public.sl_progress TO service_role;
