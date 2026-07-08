-- Cleanup for student 7094 (Gajender Parihar)
-- Root cause: counsellor edited the free-typed Course Fee field to a wrong value (42000)
-- when creating this record, then deleted the student/enrollment. The delete only removed
-- 'students'/'enrollments' rows, not 'student_fees', leaving this orphaned record behind.
-- Confirmed safe to delete: amount collected on this row = 0 (nothing was ever received).
--
-- The two root causes are now fixed in code:
--   1. Course Fee field is locked (read-only, pulled from the fixed COURSE_FEES_JS price list)
--      in both the Enroll flow and the existing-student Fee tab.
--   2. h_removeStudent now also deletes matching student_fees rows when a student/enrollment
--      is removed, so this can't happen again going forward.
--
-- Review, then run in the Supabase SQL editor:

BEGIN;

DELETE FROM student_fees
WHERE id = 'b88c7058-1143-4be9-a959-9965b1368dae'
  AND student_id = '7094'
  AND amount = 0;   -- safety guard: only deletes if still zero-collected as verified

COMMIT;
