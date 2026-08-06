-- ============================================================
-- MIGRATION: Misc Charges (manual/diploma replacement costs charged to students) and
-- Credit Notes (refunds/overpayment corrections that reduce revenue).
-- 2026-08-05, per instruction: "Sometimes counsellor charge manual cost to students or
-- diploma cost in case they lose their manuals or diploma... credit note is issued in
-- case there is a refund or extra amount paid by student."
--
-- Design confirmed with Sunil: both blend into normal Centre Revenue totals (not tracked
-- as a separate reporting line), Credit Notes don't need approval (counsellor logs
-- directly, matching Corporate Batches), both live in the Ledger tab.
-- Run this in Supabase -> SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS misc_charges (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        TEXT NOT NULL,
  student_name      TEXT NOT NULL,
  charge_type       TEXT NOT NULL,          -- 'Manual Replacement' | 'Diploma Replacement' | 'Other'
  description       TEXT DEFAULT '',        -- required detail when charge_type = 'Other'
  amount            NUMERIC(12,2) NOT NULL DEFAULT 0,   -- excl. GST
  gst_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  invoice_number    TEXT DEFAULT '',
  invoice_date      DATE,
  centre            TEXT NOT NULL,
  recorded_by       TEXT NOT NULL,
  revenue_month     TEXT NOT NULL,          -- 'YYYY-MM', same convention as student_fees
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_notes (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id            TEXT NOT NULL,
  student_name          TEXT NOT NULL,
  original_invoice_number TEXT DEFAULT '',   -- the invoice this credit note relates to
  amount                NUMERIC(12,2) NOT NULL DEFAULT 0,   -- excl. GST, always positive -- SUBTRACTED at sync time, not stored negative
  reason                TEXT NOT NULL,        -- 'Refund' | 'Overpayment' | 'Other'
  reason_detail         TEXT DEFAULT '',      -- free text, required when reason = 'Other'
  centre                TEXT NOT NULL,
  recorded_by           TEXT NOT NULL,
  revenue_month         TEXT NOT NULL,        -- which month's revenue this reduces
  issued_date           DATE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_misc_charges_lookup ON misc_charges(recorded_by, centre, revenue_month);
CREATE INDEX IF NOT EXISTS idx_credit_notes_lookup ON credit_notes(recorded_by, centre, revenue_month);

ALTER TABLE misc_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'misc_charges' AND policyname = 'anon_all_misc_charges') THEN
    EXECUTE 'CREATE POLICY anon_all_misc_charges ON misc_charges FOR ALL TO anon USING (true) WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credit_notes' AND policyname = 'anon_all_credit_notes') THEN
    EXECUTE 'CREATE POLICY anon_all_credit_notes ON credit_notes FOR ALL TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- RLS policy alone is not enough -- base table-level GRANT is required before RLS is even
-- evaluated (learned this repeatedly on this project -- goes in together from the start now).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.misc_charges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_notes TO anon;
