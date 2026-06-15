-- Fix doubled revenue: remove garbage rows where business_centre is a numeric value
-- (caused by old bug in parseRevenueMonthlyAchievedSheet that used col[4] as businessCentre
--  instead of the text centre name — col[4] was actually the course fee amount)
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql

-- Preview what will be deleted first (run this SELECT before DELETE to verify):
SELECT counsellor, month, business_centre, achieved_course_fee, achieved_course_fee_gst
FROM revenue_monthly_achieved
WHERE business_centre ~ '^[0-9]'
ORDER BY counsellor, month;

-- Delete the garbage rows (business_centre starts with a digit = numeric garbage):
DELETE FROM revenue_monthly_achieved
WHERE business_centre ~ '^[0-9]';

-- After deletion, verify Bianca's totals look correct (should be ~half of what was shown):
SELECT counsellor, SUM(achieved_course_fee) AS total_course, SUM(achieved_course_fee_gst) AS total_gst
FROM revenue_monthly_achieved
WHERE period = '2026-27'
GROUP BY counsellor
ORDER BY counsellor;
