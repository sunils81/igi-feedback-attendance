-- Fixes exactly the bug in your screenshot: the Jul 2026 Surat card showed "1 student /
-- ₹1,65,900" but the drill-down said "No student-level records found."
--
-- WHY: that ₹1,65,900 figure lives in revenue_monthly_achieved — a CACHE table that only
-- gets refreshed when syncStudentRevenue() fires (on a fee record save/delete). The
-- revenue_month migration fixed the underlying student_fees data and the drill-down (which
-- reads student_fees live), but it did NOT retroactively re-fire syncStudentRevenue for
-- every existing counsellor+centre+month combo — so every AUTO card that hasn't had a
-- fresh save/delete since you pushed the code is still showing its PRE-fix total. That's
-- why the card and the drill-down disagreed: the drill-down was already correct, the card
-- was stale.
--
-- This script is a one-time bulk version of exactly what syncStudentRevenue already does
-- per-record — it recomputes every AUTO month's Centre Revenue total directly from
-- student_fees.revenue_month and overwrites the cache to match. Safe to re-run any time
-- (idempotent). Does not touch pre-July months, Corporate Programs, or the `locked` flag
-- on any row — same behavior syncStudentRevenue already has live.
--
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql

WITH auto_months AS (
  SELECT unnest(ARRAY['2026-07','2026-08','2026-09','2026-10','2026-11','2026-12','2027-01','2027-02','2027-03']) AS month
),
existing_keys AS (
  -- Every counsellor+centre+month combo that already has a cached row, so combos that
  -- should now be zero (like this Surat case) still get corrected, not just skipped.
  SELECT DISTINCT counsellor, business_centre AS centre, month
  FROM revenue_monthly_achieved
  WHERE business_type = 'Centre Revenue' AND month IN (SELECT month FROM auto_months)
),
fee_keys AS (
  SELECT DISTINCT recorded_by AS counsellor, centre, revenue_month AS month
  FROM student_fees
  WHERE revenue_month IN (SELECT month FROM auto_months)
    AND recorded_by IS NOT NULL AND centre IS NOT NULL
),
all_keys AS (
  SELECT counsellor, centre, month FROM existing_keys
  UNION
  SELECT counsellor, centre, month FROM fee_keys
),
computed AS (
  SELECT
    k.counsellor, k.centre, k.month,
    COALESCE(SUM(sf.course_fee), 0)                       AS fee_total,
    COALESCE(SUM(sf.course_fee) + SUM(sf.gst_amount), 0)  AS fee_gst_total,
    COUNT(sf.id)                                          AS stu_count
  FROM all_keys k
  LEFT JOIN student_fees sf
    ON sf.recorded_by = k.counsellor AND sf.centre = k.centre AND sf.revenue_month = k.month
  GROUP BY k.counsellor, k.centre, k.month
)
INSERT INTO revenue_monthly_achieved
  (month, period, counsellor, assigned_centre, business_centre, business_type,
   achieved_course_fee, achieved_course_fee_gst, student_count, notes, updated_at)
SELECT
  month, '2026-27', counsellor, centre, centre, 'Centre Revenue',
  fee_total, fee_gst_total, stu_count,
  CASE WHEN stu_count = 0 THEN 'auto-derived (zeroed — no remaining fee records this month)' ELSE 'auto-derived' END,
  now()
FROM computed
ON CONFLICT (month, period, counsellor, business_centre, business_type)
DO UPDATE SET
  achieved_course_fee     = EXCLUDED.achieved_course_fee,
  achieved_course_fee_gst = EXCLUDED.achieved_course_fee_gst,
  student_count            = EXCLUDED.student_count,
  notes                    = EXCLUDED.notes,
  updated_at               = EXCLUDED.updated_at;

-- Verify: every row here should now match what each counsellor's Revenue tab shows.
-- (Separate statement, so it needs its own copy of the month list — CTEs don't carry
-- across statement boundaries.)
SELECT counsellor, business_centre, month, student_count, achieved_course_fee, achieved_course_fee_gst
FROM revenue_monthly_achieved
WHERE business_type = 'Centre Revenue'
  AND month IN ('2026-07','2026-08','2026-09','2026-10','2026-11','2026-12','2027-01','2027-02','2027-03')
ORDER BY counsellor, month;
