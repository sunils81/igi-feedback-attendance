-- ============================================================
-- MIGRATION: Regularisation Requests — a student explains why they missed a session and
-- asks for it to count as attended; counsellor reviews and approves/rejects.
-- 2026-08-04, per instruction (matching a feature from the igi-student.zeroes.in mockup).
--
-- On APPROVAL, the corresponding attendance_feedback row is updated from Absent -> Present
-- (see h_reviewRegularisationRequest in shared.js) — deliberately NOT a separate parallel
-- "regularised" status tracked only here, since that would mean every existing attendance-%
-- calculation across the whole app (student portal, counsellor portal, admin dashboard)
-- would need to separately learn about regularisation to count it correctly. Updating the
-- real underlying record means it's automatically correct everywhere, with this table
-- serving as the audit trail of WHY it was changed and who approved it.
-- Run this in Supabase -> SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS regularisation_requests (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        TEXT NOT NULL,
  student_name      TEXT NOT NULL,
  batch_code        TEXT NOT NULL,
  centre            TEXT NOT NULL,
  session_code      TEXT NOT NULL,
  session_date      DATE,
  session_topic     TEXT DEFAULT '',
  reason            TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  submitted_at      TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by       TEXT DEFAULT '',
  reviewed_at       TIMESTAMPTZ,
  review_note       TEXT DEFAULT '',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  -- One pending request per (student, session) at a time -- resubmitting after a rejection
  -- is allowed (only blocks a second PENDING request for the same session), enforced in
  -- h_saveRegularisationRequest rather than a DB constraint since "one pending at a time"
  -- isn't expressible as a simple unique index across a mutable status column.
  UNIQUE(student_id, session_code, status)
);

CREATE INDEX IF NOT EXISTS idx_regularisation_status ON regularisation_requests(status);
CREATE INDEX IF NOT EXISTS idx_regularisation_centre ON regularisation_requests(centre);
CREATE INDEX IF NOT EXISTS idx_regularisation_student ON regularisation_requests(student_id);

ALTER TABLE regularisation_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'regularisation_requests' AND policyname = 'anon_all_regularisation_requests'
  ) THEN
    EXECUTE 'CREATE POLICY anon_all_regularisation_requests ON regularisation_requests FOR ALL TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- RLS policy alone is not enough -- Postgres also needs the base table-level GRANT before
-- RLS is even evaluated (learned this three times already on this project: revenue_audit_log,
-- operational_invoices, corporate_batches -- both go in together from the start now).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regularisation_requests TO anon;
