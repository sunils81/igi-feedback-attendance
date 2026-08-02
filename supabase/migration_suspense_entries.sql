-- ============================================================
-- MIGRATION: Suspense Entries — a holding area for real money that can't yet be
-- classified as normal course-fee revenue (e.g. Kavya Mehta's Rs 16,590 invoice,
-- 2026-08-02: unclear whether it's a separate registration fee or a course-fee
-- installment). Deliberately NOT counted in revenue_monthly_achieved until someone
-- reviews and resolves it -- the whole point is it shouldn't silently inflate revenue
-- while its classification is still in question.
-- Run this in Supabase -> SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS suspense_entries (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description       TEXT NOT NULL,
  amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  related_student_id   TEXT DEFAULT '',
  related_student_name TEXT DEFAULT '',
  centre            TEXT NOT NULL,
  invoice_number    TEXT DEFAULT '',
  invoice_date      DATE,
  flagged_reason    TEXT NOT NULL,             -- why it's in suspense, e.g. "second invoice for same student same day -- registration fee or course fee installment?"
  recorded_by       TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'resolved'
  resolution_note   TEXT DEFAULT '',
  resolved_by       TEXT DEFAULT '',
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suspense_status ON suspense_entries(status);
CREATE INDEX IF NOT EXISTS idx_suspense_centre ON suspense_entries(centre);

ALTER TABLE suspense_entries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'suspense_entries' AND policyname = 'anon_all_suspense_entries'
  ) THEN
    EXECUTE 'CREATE POLICY anon_all_suspense_entries ON suspense_entries FOR ALL TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- RLS policy alone is not enough -- Postgres also needs the base table-level GRANT
-- before RLS is even evaluated (learned this the hard way on corporate_batches and
-- operational_invoices earlier this project -- both go in together from the start now).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suspense_entries TO anon;
