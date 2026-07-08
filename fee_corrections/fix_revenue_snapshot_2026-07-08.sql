-- Cleanup for the stale Revenue tab snapshot caused by student 7094's deleted fee record.
--
-- Root cause: revenue_monthly_achieved is an auto-derived SNAPSHOT (recomputed from
-- student_fees by syncStudentRevenue()), not a live view. It was only ever refreshed after
-- a fee record was SAVED, never after one was DELETED — so deleting student 7094's wrong
-- fee row (course_fee 42000, HYD-DG-JUL26) left this stale row behind:
--
--   month=2026-07, counsellor=Rajini, business_centre=Hyderabad, business_type=Centre Revenue
--   achieved_course_fee=42000, achieved_course_fee_gst=49560, student_count=1
--
-- Verified live: student_fees now has ZERO rows matching
-- (recorded_by=Rajini, centre=Hyderabad, created_at in July 2026) — so the correct value
-- for this snapshot is 0, not 42000.
--
-- Both root causes are now fixed in code (shared.js):
--   1. h_removeStudent captures each deleted fee row's (recorded_by, centre, month) and
--      re-runs syncStudentRevenue() afterwards, so this snapshot self-corrects going forward.
--   2. syncStudentRevenue() previously bailed out early (no write at all) when a
--      recalculation found zero remaining fee records — meaning a fully-emptied month could
--      never be zeroed out even if something did try to resync it. It now writes through
--      with zeroed totals in that case.
--
-- Review, then run in the Supabase SQL editor:

BEGIN;

UPDATE revenue_monthly_achieved
SET achieved_course_fee = 0,
    achieved_course_fee_gst = 0,
    student_count = 0,
    notes = 'auto-derived (corrected 2026-07-08 — source student_fees record for student 7094 was deleted; see fix_student_7094_2026-07-08.sql)',
    updated_at = now()
WHERE month = '2026-07'
  AND period = '2026-27'
  AND counsellor = 'Rajini'
  AND business_centre = 'Hyderabad'
  AND business_type = 'Centre Revenue'
  AND achieved_course_fee = 42000;   -- safety guard: only touches the known-stale value

COMMIT;
