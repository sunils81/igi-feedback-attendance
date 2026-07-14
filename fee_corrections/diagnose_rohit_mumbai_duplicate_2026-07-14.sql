-- Diagnose: Rohit's Mumbai Centre Standings card shows 2 students / ₹3,31,800 for
-- Q1 2026-27 (Apr-Jul), but Sunil confirms only one real admission this quarter
-- (Vishwas Chohan, ₹1,65,900 basic course fee, batch Jul-6, admitted via "Merrito").
-- ₹3,31,800 is exactly 2 × ₹1,65,900 — the shape of the number points to the same
-- student's fee being counted twice, not two different students. READ ONLY, changes
-- nothing. Same diagnostic pattern already used for Bianca/Kripa's over-counts.
--
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql

-- 1. Every revenue_monthly_achieved row for Rohit, Mumbai, this period — this is exactly
--    what's summed into the Centre Standings contributor line ("Rohit: ₹3,31,800, 2 stu").
--    Look for two rows in the same month, or one row where student_count/achieved_course_fee
--    already looks doubled.
SELECT month, counsellor, assigned_centre, business_centre, business_type,
       student_count, achieved_course_fee, achieved_course_fee_gst, notes, locked, updated_at
FROM revenue_monthly_achieved
WHERE counsellor = 'Rohit' AND business_centre = 'Mumbai' AND period = '2026-27'
ORDER BY month;

-- 2. For auto-derived months (Jul-26 onward), that cached row is recomputed from student_fees
--    as student_count = COUNT(rows) and achieved_course_fee = SUM(course_fee) — NOT
--    COUNT(DISTINCT student_id). So two student_fees rows for the same student (a leftover
--    row from a delete/re-entry, or a correction that inserted a new row instead of updating
--    the existing one — the same mechanics that caused the student-7094 orphan and Bianca's
--    numeric-business_centre duplicates) will double both figures. This lists every raw row
--    behind Rohit's Mumbai total across the whole quarter.
SELECT student_id, batch_code, recorded_by, centre, course_fee, gst_amount, revenue_month,
       receipt_no, created_at
FROM student_fees
WHERE recorded_by = 'Rohit' AND centre = 'Mumbai'
  AND revenue_month IN ('2026-04','2026-05','2026-06','2026-07')
ORDER BY revenue_month, student_id;

-- 3. Isolates the duplicate: any student_id billed more than once under Rohit/Mumbai
--    this quarter. If this returns exactly one row with row_count = 2 and
--    summed_course_fee = 331800, that confirms the same student is being counted twice.
SELECT student_id, COUNT(*) AS row_count, SUM(course_fee) AS summed_course_fee
FROM student_fees
WHERE recorded_by = 'Rohit' AND centre = 'Mumbai'
  AND revenue_month IN ('2026-04','2026-05','2026-06','2026-07')
GROUP BY student_id
HAVING COUNT(*) > 1;

-- 4. Names the student(s) behind query 1-3 so you can confirm it's Vishwas Chohan
--    (or find out it's someone else, if the extra row belongs to a different student
--    entirely, e.g. one your CSV export didn't happen to include).
SELECT s.student_id, s.name, sf.batch_code, sf.course_fee, sf.revenue_month, sf.created_at
FROM student_fees sf
JOIN students s ON s.student_id = sf.student_id
WHERE sf.recorded_by = 'Rohit' AND sf.centre = 'Mumbai'
  AND sf.revenue_month IN ('2026-04','2026-05','2026-06','2026-07')
ORDER BY s.name, sf.created_at;

-- Next step once you've confirmed which row is the duplicate: delete it by its exact
-- `id` (never by a broad WHERE clause), the same way fix_student_7094_2026-07-08.sql
-- did — e.g.:
--
--   DELETE FROM student_fees WHERE id = '<the-duplicate-row-id>';
--
-- The cached revenue_monthly_achieved row will self-correct the next time any fee record
-- for Rohit/Mumbai/that month is saved or deleted (syncStudentRevenue re-derives it from
-- student_fees). If you want it to correct immediately without waiting for that trigger,
-- say so and this can include a targeted UPDATE for that one cached row.
