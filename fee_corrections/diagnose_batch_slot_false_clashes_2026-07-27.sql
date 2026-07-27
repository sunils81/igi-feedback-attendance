-- Diagnose: "⚠ Clash" badges on Batch Overview that may be false positives caused by a
-- missing/non-standard batch_slot value, not a real double-booking.
--
-- How the clash check works (counselor.html, getClashingBatches): two batches clash when
-- they share the same instructor + centre, their date ranges overlap, AND their slots
-- overlap — where slot overlap is "either one is 'Full Day', or they're the exact same
-- slot". A blank/NULL batch_slot is treated as 'Full Day' (occupies the whole day), which
-- makes it clash against literally any other overlapping-date batch for that instructor,
-- real conflict or not.
--
-- Root cause (fixed alongside this script in counselor.html): batches created through the
-- "Enroll New Student" modal's "+ Create New Batch" step used to collect this as a free-text
-- "Slot / Timings" field (placeholder "e.g. Mon/Wed 10am") instead of the controlled Full
-- Day / First Half / Second Half picker used everywhere else (the main Create Batch form,
-- the Edit Batch modal). Free text never matches 'First Half'/'Second Half', and a left-
-- blank field defaults to 'Full Day' — so batches created that way could show up as
-- clashing with something they don't actually overlap with in real time. The modal now uses
-- the same controlled dropdown, so this only affects batches created before the fix.
--
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql
-- READ ONLY — changes nothing. For anything flagged, use the portal's own
-- "📅 Edit Batch" button to set the correct slot (or leave 'Full Day' if that's accurate).

-- 1. Batches whose batch_slot isn't one of the three real values — these are exactly the
--    ones the old free-text field could have produced (blank, or arbitrary text like
--    "Mon/Wed 10am"), and are the candidates for a false "Full Day" clash.
SELECT batch_code, centre, course, instructor, batch_slot, type, start_date, end_date
FROM batches
WHERE (batch_slot IS NULL OR batch_slot NOT IN ('Full Day','First Half','Second Half'))
  AND (end_date IS NULL OR end_date >= CURRENT_DATE)   -- only still-relevant (not-yet-completed) batches
ORDER BY centre, instructor, start_date;

-- 2. Pairs of batches that currently clash (same instructor+centre, overlapping dates,
--    'Full Day' on at least one side) where at least one side has a non-standard slot —
--    i.e. the specific pairs most likely to be false positives rather than real
--    double-bookings. Review each pair: if the two batches really do run at different times
--    of day, fix the non-standard side's slot via Edit Batch and the clash badge clears.
SELECT a.batch_code AS batch_a, a.batch_slot AS slot_a, a.start_date AS start_a, a.end_date AS end_a,
       b.batch_code AS batch_b, b.batch_slot AS slot_b, b.start_date AS start_b, b.end_date AS end_b,
       a.instructor, a.centre
FROM batches a
JOIN batches b
  ON a.centre = b.centre
 AND a.instructor = b.instructor
 AND a.batch_code < b.batch_code
 AND a.instructor IS NOT NULL
 AND a.start_date <= b.end_date AND b.start_date <= a.end_date
WHERE (COALESCE(a.batch_slot,'Full Day') = 'Full Day' OR COALESCE(b.batch_slot,'Full Day') = 'Full Day')
  AND (a.batch_slot IS NULL OR a.batch_slot NOT IN ('Full Day','First Half','Second Half')
       OR b.batch_slot IS NULL OR b.batch_slot NOT IN ('Full Day','First Half','Second Half'))
  AND (a.end_date IS NULL OR a.end_date >= CURRENT_DATE)
ORDER BY a.centre, a.instructor;
