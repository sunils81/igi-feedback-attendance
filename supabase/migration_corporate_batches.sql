-- ============================================================
-- MIGRATION: Corporate Batch records — full per-transaction record for corporate
-- training revenue, instead of a single flat monthly number with no detail behind it.
-- Run this in Supabase -> SQL Editor
--
-- Mirrors student_fees in spirit (invoice-date-priority revenue_month, GST, discount) but
-- deliberately has NO foreign keys to students/batches — a corporate batch isn't tied to
-- an individual student or a course batch, it's a flat fee for training some number of
-- associates at a company.
-- ============================================================

CREATE TABLE IF NOT EXISTS corporate_batches (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name      TEXT NOT NULL,
  invoice_number    TEXT DEFAULT '',
  invoice_date      DATE,
  centre            TEXT NOT NULL,
  recorded_by       TEXT NOT NULL,
  course_fee        NUMERIC(12,2) NOT NULL DEFAULT 0,   -- flat total fee for the batch, Excl. GST
  gst_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_pct      NUMERIC(5,2) DEFAULT 0,
  discount_amount   NUMERIC(12,2) DEFAULT 0,
  associates_trained INTEGER DEFAULT 0,                  -- headcount, informational only — NEVER multiplied into course_fee
  location_client   TEXT DEFAULT '',
  description       TEXT DEFAULT '',
  revenue_month     TEXT NOT NULL,                       -- YYYY-MM, same invoice-date-priority rule as student_fees
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corp_batches_recorded_by ON corporate_batches(recorded_by);
CREATE INDEX IF NOT EXISTS idx_corp_batches_centre       ON corporate_batches(centre);
CREATE INDEX IF NOT EXISTS idx_corp_batches_rev_month    ON corporate_batches(revenue_month);

ALTER TABLE corporate_batches ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'corporate_batches' AND policyname = 'anon_all_corporate_batches'
  ) THEN
    EXECUTE 'CREATE POLICY anon_all_corporate_batches ON corporate_batches FOR ALL TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- RLS policy alone is not enough — Postgres also needs the base table-level GRANT before
-- RLS is even evaluated (confirmed twice already on this project: revenue_audit_log,
-- operational_invoices). Both go in from the start this time.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.corporate_batches TO anon;
