-- Diagnose doubled revenue for Kripa (or any counsellor) — READ ONLY, changes nothing.
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql

-- 1. Every revenue_monthly_achieved row for Kripa this period, so we can see exactly
--    what's being summed. Look for: (a) more than one business_type per month with
--    similar amounts (manual entry + auto-derived both present), or (b) a
--    business_centre value that looks wrong (numeric, blank, mis-cased).
SELECT month, business_centre, business_type, student_count,
       achieved_course_fee, achieved_course_fee_gst, notes, locked, updated_at
FROM revenue_monthly_achieved
WHERE counsellor = 'Kripa' AND period = '2026-27'
ORDER BY month, business_type;

-- 2. Same numeric-business_centre garbage check that fixed Bianca's case —
--    confirms/rules out that specific prior bug for Kripa.
SELECT month, business_centre, business_type, achieved_course_fee
FROM revenue_monthly_achieved
WHERE counsellor = 'Kripa' AND business_centre ~ '^[0-9]';

-- 3. What auto-derive (student_fees) independently computes for Kripa's July,
--    to compare against whatever manual entry shows for July in query #1.
SELECT centre, COUNT(*) AS fee_rows, SUM(course_fee) AS total_course_fee
FROM student_fees
WHERE recorded_by = 'Kripa'
  AND created_at >= '2026-07-01' AND created_at < '2026-08-01'
GROUP BY centre;
