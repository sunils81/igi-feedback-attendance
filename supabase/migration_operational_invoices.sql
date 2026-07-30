-- ============================================================
-- MIGRATION: Operational Invoices & Receipts (inventory/manuals/other spend)
-- Run this in Supabase → SQL Editor
--
-- Standalone log for day-to-day operational invoices a counsellor raises/receives
-- (e.g. buying course manuals, centre inventory/supplies, or other misc spend) with
-- the actual receipt/invoice file attached. Deliberately NOT linked to inv_requests —
-- that system tracks item QUANTITIES moving between centres/HQ, this tracks the
-- financial/documentation side of a purchase, which inv_requests never had at all.
-- ============================================================

CREATE TABLE IF NOT EXISTS operational_invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_date      DATE NOT NULL,
  category        TEXT NOT NULL DEFAULT 'Other',  -- 'Inventory' | 'Manuals' | 'Other'
  vendor          TEXT DEFAULT '',
  description     TEXT DEFAULT '',
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  invoice_number  TEXT DEFAULT '',
  centre          TEXT NOT NULL,
  entered_by      TEXT NOT NULL,
  file_url        TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_op_invoices_entered_by  ON operational_invoices(entered_by);
CREATE INDEX IF NOT EXISTS idx_op_invoices_centre      ON operational_invoices(centre);
CREATE INDEX IF NOT EXISTS idx_op_invoices_entry_date  ON operational_invoices(entry_date);
CREATE INDEX IF NOT EXISTS idx_op_invoices_category    ON operational_invoices(category);

ALTER TABLE operational_invoices ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'operational_invoices' AND policyname = 'anon_all_operational_invoices'
  ) THEN
    EXECUTE 'CREATE POLICY anon_all_operational_invoices ON operational_invoices FOR ALL TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- RLS policies alone are not enough — Postgres also requires the base table-level GRANT
-- for the anon role before RLS is even evaluated. Found 2026-07-30: the table + policy
-- above were created successfully, but SELECT still failed with "permission denied for
-- table operational_invoices" until this explicit grant was added (same class of gap as
-- revenue_audit_log elsewhere in this project).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operational_invoices TO anon;

-- Reuses the existing fee-receipts storage bucket (already public-read, already working
-- for student fee receipts) under a new 'operational/' path prefix, instead of requiring
-- a brand new bucket to be created and configured in the Supabase dashboard.
-- No SQL needed for this — just a path-prefix convention in the app code.
