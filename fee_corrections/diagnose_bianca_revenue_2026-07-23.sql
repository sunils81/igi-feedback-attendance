-- Diagnose: Bianca's counsellor portal is showing an extra amount in revenue vs. her
-- fee records. This is the same class of bug already hit twice before for Bianca/Kripa/
-- Rohit (see fix_revenue_monthly_duplicates.sql, diagnose_kripa_revenue_2026-07-09.sql,
-- diagnose_rohit_surat_revenue_2026-07-09.sql, diagnose_rohit_mumbai_duplicate_2026-07-14.sql).
-- READ ONLY, changes nothing.
--
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql

-- 1. Every revenue_monthly_achieved row for Bianca this period. Look for:
--    (a) two rows in the same month with the same business_centre but different
--        business_type / notes (e.g. one "auto-derived", one manual) — both get
--        summed on the portal, which double-counts the same sale;
--    (b) a business_centre value that isn't a clean centre name (numeric or blank —
--        the exact bug fixed for Bianca before).
SELECT month, business_centre, business_type, student_count,
       achieved_course_fee, achieved_course_fee_gst, notes, locked, updated_at
FROM revenue_monthly_achieved
WHERE counsellor = 'Bianca' AND period = '2026-27'
ORDER BY month, business_centre, business_type;

-- 2. Re-check the specific "numeric business_centre garbage" bug fixed before for Bianca —
--    confirms/rules out whether it has recurred.
SELECT month, business_centre, business_type, achieved_course_fee
FROM revenue_monthly_achieved
WHERE counsellor = 'Bianca' AND business_centre ~ '^[0-9]';

-- 3. What the auto-derive logic (syncStudentRevenue in shared.js) independently computes
--    from student_fees for each month/centre — compare this against query #1's
--    achieved_course_fee for the matching month+centre. A mismatch here (portal total
--    higher than this) points to a stale/duplicate row in revenue_monthly_achieved rather
--    than bad underlying fee data.
SELECT revenue_month, centre, COUNT(*) AS fee_rows, SUM(course_fee) AS total_course_fee,
       SUM(gst_amount) AS total_gst
FROM student_fees
WHERE recorded_by = 'Bianca'
GROUP BY revenue_month, centre
ORDER BY revenue_month, centre;

-- 4. Duplicate student_fees rows under Bianca — more than one fee row for the same
--    student, which the unique constraint on (student_id, batch_code) should normally
--    prevent, but won't catch a typo'd/second batch_code for the same enrollment.
SELECT student_id, COUNT(*) AS row_count, SUM(course_fee) AS summed_course_fee,
       array_agg(batch_code) AS batch_codes, array_agg(id) AS row_ids
FROM student_fees
WHERE recorded_by = 'Bianca'
GROUP BY student_id
HAVING COUNT(*) > 1;

-- 5. Names behind query 4, so the duplicate can be confirmed against what Bianca
--    actually sold.
SELECT s.student_id, s.name, sf.batch_code, sf.course_fee, sf.revenue_month, sf.created_at, sf.id
FROM student_fees sf
JOIN students s ON s.student_id = sf.student_id
WHERE sf.recorded_by = 'Bianca'
ORDER BY s.name, sf.created_at;

-- Next step once the specific extra row is identified (from query 1, 2, or 4):
--   - If it's a stray revenue_monthly_achieved row (case a/b above): delete it by its
--     exact composite key (month, period, counsellor, business_centre, business_type),
--     the same way fix_revenue_monthly_duplicates.sql did.
--   - If it's a duplicate student_fees row (case 4/5): delete it by its exact `id`, the
--     same way fix_student_7094_2026-07-08.sql did — never by a broad WHERE clause.
--   - After either delete, the cached revenue_monthly_achieved row self-corrects the next
--     time any fee record for Bianca/that centre/that month is saved or deleted
--     (syncStudentRevenue re-derives it from student_fees), or say so if you want an
--     immediate targeted UPDATE instead of waiting for that trigger.
