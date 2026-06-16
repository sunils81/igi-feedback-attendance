-- ============================================================
-- IGI Portal: Missing Column & Constraint Fixes
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. batches: add co_instructor columns (used by h_createBatch / h_saveCoInstructor)
ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS co_instructor       TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS co_instructor_until DATE;

-- 2. assessments: add instructor column (used by h_createAssessment)
ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS instructor TEXT DEFAULT '';

-- 3. attendance_feedback: add marked_by column (used by h_instructorMarkAttendance)
ALTER TABLE attendance_feedback
  ADD COLUMN IF NOT EXISTS marked_by TEXT DEFAULT '';

-- 4. inv_dispatch: add courier_info column (used by h_dispatch)
ALTER TABLE inv_dispatch
  ADD COLUMN IF NOT EXISTS courier_info TEXT DEFAULT '';

-- 4. holidays: add UNIQUE constraint on (holiday_date, centre)
--    so h_addHoliday on_conflict upsert works correctly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'holidays_holiday_date_centre_key'
  ) THEN
    ALTER TABLE holidays ADD CONSTRAINT holidays_holiday_date_centre_key
      UNIQUE (holiday_date, centre);
  END IF;
END $$;

-- 5. inv_dispatch: add courier_info column
ALTER TABLE inv_dispatch
  ADD COLUMN IF NOT EXISTS courier_info TEXT DEFAULT '';

-- 6. students: add photo_url column
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS photo_url TEXT DEFAULT '';
