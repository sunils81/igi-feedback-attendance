-- ============================================================
-- IGI Portal: Diploma & Invoice Audit Fields
-- Adds the fields needed to reproduce the "Pan India Student
-- Count & Diploma Released" audit report directly from
-- student_fees, instead of a manually-compiled spreadsheet.
--
-- Safe to run any time: additive, nullable, non-breaking.
-- Existing inserts/updates to student_fees that don't set
-- these fields are unaffected.
--
-- Run in Supabase SQL Editor (same as other files in
-- supabase/migrations/).
-- ============================================================

ALTER TABLE student_fees
  ADD COLUMN IF NOT EXISTS invoice_number TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS diploma_count  INTEGER DEFAULT 0;

-- Fast lookup by invoice number (auditors search by invoice #)
CREATE INDEX IF NOT EXISTS idx_student_fees_invoice
  ON student_fees(invoice_number)
  WHERE invoice_number IS NOT NULL AND invoice_number != '';

-- Course + centre already exist on student_fees; add an index
-- so the centre x course x month audit report (built off this
-- table) stays fast as data grows.
CREATE INDEX IF NOT EXISTS idx_student_fees_centre_course
  ON student_fees(centre, course);
