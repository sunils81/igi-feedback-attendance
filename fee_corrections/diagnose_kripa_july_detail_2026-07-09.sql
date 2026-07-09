-- Kripa / Jaipur / July 2026 — READ ONLY, changes nothing.
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql
--
-- Root cause confirmed by reading assets/shared.js: syncStudentRevenue() buckets a fee
-- record into a month using created_at (the moment the row was inserted/edited in the
-- database), not payment_date (when the money was actually collected) or the batch's
-- actual start date. If Kripa entered/edited fee records THIS month for students who
-- enrolled or paid earlier, they land in "July" regardless of when the real transaction
-- happened. Query 1 below shows exactly that gap per row.

-- 1. The actual 8 rows behind the ₹13,87,200 / 8-student "AUTO" card. created_at is what
--    the system currently uses to call this "July revenue" — payment_date is what it
--    probably should use. Any row where these two differ in month is very likely
--    misattributed.
SELECT id, student_id, batch_code, course_fee, gst_amount,
       payment_date,
       created_at,
       to_char(payment_date::date, 'YYYY-MM') AS payment_month,
       to_char(created_at, 'YYYY-MM')         AS created_month,
       (to_char(payment_date::date,'YYYY-MM') <> to_char(created_at,'YYYY-MM')) AS month_mismatch
FROM student_fees
WHERE recorded_by = 'Kripa'
  AND centre = 'Jaipur'
  AND created_at >= '2026-07-01' AND created_at < '2026-08-01'
ORDER BY created_at;

-- 2. Literal duplicates — same student_id + batch_code appearing more than once would
--    double-count that student's fee on its own, separate from the date-bucketing issue.
SELECT student_id, batch_code, COUNT(*) AS row_count, SUM(course_fee) AS total_course_fee
FROM student_fees
WHERE recorded_by = 'Kripa' AND centre = 'Jaipur'
  AND created_at >= '2026-07-01' AND created_at < '2026-08-01'
GROUP BY student_id, batch_code
HAVING COUNT(*) > 1;

-- 3. What July would look like if bucketed by payment_date instead of created_at —
--    i.e. only rows whose actual payment fell in July, regardless of when the row was
--    typed into the system. Compare this total to the ₹13,87,200 shown on the card.
SELECT COUNT(*) AS fee_rows, SUM(course_fee) AS total_course_fee
FROM student_fees
WHERE recorded_by = 'Kripa' AND centre = 'Jaipur'
  AND payment_date >= '2026-07-01' AND payment_date < '2026-08-01';
