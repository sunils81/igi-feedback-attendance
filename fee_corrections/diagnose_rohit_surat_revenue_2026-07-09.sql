-- Diagnose: Rohit's personal "Total Achieved" (₹22,98,673) exactly equals Surat centre's
-- combined total (all counsellors), and his "Other Centres" figure (₹1,65,900) exactly
-- matches what's shown as Bianca's contribution to Surat. Could be a coincidence (₹1,65,900
-- looks like a common single-student course fee in this system) or a real duplicate/
-- misattributed row — same class of bug fix_revenue_monthly_duplicates.sql fixed for Bianca
-- before. READ ONLY, changes nothing.
--
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql

-- 1. Every row for Rohit, all centres, this period — shows exactly what's backing his
--    personal Own/Other/Corporate totals.
SELECT month, counsellor, assigned_centre, business_centre, business_type,
       student_count, achieved_course_fee, achieved_course_fee_gst, notes, locked, updated_at
FROM revenue_monthly_achieved
WHERE counsellor = 'Rohit' AND period = '2026-27'
ORDER BY month, business_centre;

-- 2. Every row where business_centre = Surat, any counsellor — shows exactly what's
--    backing the Centre Standings total and contributor breakdown.
SELECT month, counsellor, assigned_centre, business_centre, business_type,
       student_count, achieved_course_fee, achieved_course_fee_gst, notes, locked, updated_at
FROM revenue_monthly_achieved
WHERE business_centre = 'Surat' AND period = '2026-27'
ORDER BY month, counsellor;

-- 3. If it's the same underlying sale double-counted, it'll show up as two student_fees
--    rows for the same student_id+batch_code under different recorded_by values.
SELECT student_id, batch_code, recorded_by, centre, course_fee, gst_amount, revenue_month, created_at
FROM student_fees
WHERE centre = 'Surat'
ORDER BY student_id, batch_code;
