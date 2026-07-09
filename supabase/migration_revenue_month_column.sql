-- Adds a `revenue_month` column to student_fees — the single authoritative answer to
-- "which month does this fee record's revenue count toward", replacing the current
-- implicit reliance on created_at (row insert/edit time) inside syncStudentRevenue().
--
-- WHY: created_at answers "when was this row touched in the database", which is NOT the
-- same as "when did the business/payment actually happen". A counsellor catching up on
-- data entry for an April enrollment during July was getting that revenue counted as
-- July — confirmed root cause of Kripa's July over-count. revenue_month is computed from
-- the first installment's paid date (or the full-payment date, when paid in one shot —
-- both are inst1_paid_date in the receipt_no JSON), falling back to payment_date, then
-- created_at, for older rows that predate installment tracking.
--
-- SAFETY: purely additive. No existing column, row, or app behavior changes until the
-- corresponding code (assets/shared.js) is deployed to actually read/write it — this
-- migration alone is inert.
--
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql

-- 1. Add the column (nullable text, 'YYYY-MM' format, same convention as
--    revenue_monthly_achieved.month).
ALTER TABLE student_fees ADD COLUMN IF NOT EXISTS revenue_month TEXT;

-- 2. Backfill every existing row. receipt_no is stored as plain TEXT (not JSONB), so this
--    parses it with regexp rather than JSON operators — matches the exact key names
--    assets/shared.js writes (inst1_paid_date, inst1_paid).
UPDATE student_fees
SET revenue_month = COALESCE(
  -- a) first installment was marked paid and has a paid date recorded
  (CASE WHEN receipt_no ~ '"inst1_paid"\s*:\s*"Y"'
        THEN substring(receipt_no from '"inst1_paid_date"\s*:\s*"(\d{4}-\d{2})')
   END),
  -- b) fall back to the plain payment_date column
  (CASE WHEN payment_date IS NOT NULL THEN to_char(payment_date::date, 'YYYY-MM') END),
  -- c) last resort — when the row was created
  to_char(created_at, 'YYYY-MM')
)
WHERE revenue_month IS NULL;

-- 3. Supporting index — this column becomes the primary filter for both the AUTO revenue
--    sync and the new "cross-check and verify" drill-down / reconciliation queries.
CREATE INDEX IF NOT EXISTS idx_student_fees_revenue_bucket
  ON student_fees (recorded_by, centre, revenue_month);

-- 4. Spot-check: rows where revenue_month and created_at disagree — these are exactly the
--    kind of late/backfilled entries that were previously misattributed. Informational only.
SELECT recorded_by, centre, revenue_month, to_char(created_at,'YYYY-MM') AS created_month, COUNT(*)
FROM student_fees
WHERE revenue_month <> to_char(created_at,'YYYY-MM')
GROUP BY 1,2,3,4
ORDER BY 1,2,3;
