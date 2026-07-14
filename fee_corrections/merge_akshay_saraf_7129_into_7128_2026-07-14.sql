-- Merge Akshay Saraf's duplicate student profile (7129) back into his real one (7128).
--
-- WHAT HAPPENED: he was added to SUR-DG-AUG26 correctly as Student ID 7128. When he was
-- later added to SUR-COL-AUG26 (the CSG half of his combined GG course), whoever added him
-- typed a NEW Student ID (7129) instead of re-entering 7128, so the system correctly did
-- exactly what it was told — it created a second, genuinely separate student profile, with
-- its own enrollment and fee record. Nothing auto-generated or changed an ID; two different
-- IDs were typed for the same real person. This script folds 7129 back into 7128 so his
-- portal, attendance, and diploma tracking are all under the one ID they should be.
--
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql

-- 1. Confirm both IDs and see everything currently attached to each, before changing
--    anything. Expect 7128 to have the DG enrollment/fee, 7129 to have the CSG one.
--    Three separate result sets (different table shapes) rather than one UNION.
SELECT student_id, name, mobile, batch_code, status FROM students WHERE student_id IN ('7128','7129');

SELECT student_id, batch_code, status FROM enrollments WHERE student_id IN ('7128','7129');

SELECT student_id, batch_code, course_fee, recorded_by, centre FROM student_fees WHERE student_id IN ('7128','7129');

-- 2. Diagnostic — checks every OTHER table that can reference a student_id, so nothing gets
--    silently left behind under 7129 (attendance, test records, diplomas, etc.). For a
--    student added only days ago these should all read 0, but confirm before deleting 7129.
SELECT 'attendance_feedback' AS tbl, count(*) FROM attendance_feedback WHERE student_id = '7129'
UNION ALL SELECT 'att_records', count(*) FROM att_records WHERE student_id = '7129'
UNION ALL SELECT 'assessment_marks', count(*) FROM assessment_marks WHERE student_id = '7129'
UNION ALL SELECT 'diplomas', count(*) FROM diplomas WHERE student_id = '7129'
UNION ALL SELECT 'test_responses', count(*) FROM test_responses WHERE student_id = '7129'
UNION ALL SELECT 'manual_grades', count(*) FROM manual_grades WHERE student_id = '7129'
UNION ALL SELECT 'test_warnings', count(*) FROM test_warnings WHERE student_id = '7129'
UNION ALL SELECT 'test_starts', count(*) FROM test_starts WHERE student_id = '7129';

-- 3. The actual merge. Re-points 7129's CSG enrollment and fee record to 7128 (safe: 7128's
--    existing rows are for the DG batch, a different batch_code, so no unique-constraint
--    collision), then removes the now-empty duplicate profile. If step 2 found rows in any
--    other table, add the same UPDATE pattern for those tables here before running this.
BEGIN;

UPDATE enrollments   SET student_id = '7128' WHERE student_id = '7129';
UPDATE student_fees  SET student_id = '7128' WHERE student_id = '7129';

DELETE FROM students WHERE student_id = '7129';

COMMIT;

-- 4. Verify — 7128 should now show both batches/fee records, and 7129 should return nothing
--    from any of the three.
SELECT student_id, name, batch_code FROM students WHERE student_id IN ('7128','7129');

SELECT student_id, batch_code, status FROM enrollments WHERE student_id IN ('7128','7129');

SELECT student_id, batch_code, course_fee FROM student_fees WHERE student_id IN ('7128','7129');
