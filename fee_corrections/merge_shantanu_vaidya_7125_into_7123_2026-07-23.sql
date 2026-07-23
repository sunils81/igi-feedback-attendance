-- Merge Shantanu Vaidya's duplicate student profile (7125) back into his real one (7123).
--
-- WHAT HAPPENED: he was added to MUM-DG-JUL26-A correctly as Student ID 7123. When he was
-- later added to MUM-COL-JUL26-A (the CSG/COL half of his combined GG course), whoever
-- added him typed a NEW Student ID (7125) instead of re-entering 7123, so the system did
-- exactly what it was told — it created a second, genuinely separate student profile with
-- its own enrollment and fee record. This is the same class of issue fixed for Akshay Saraf
-- (merge_akshay_saraf_7129_into_7128_2026-07-14.sql). The counsellor portal's Edit Student
-- Record ID field can't fix this directly — renaming 7125 to 7123 collides with 7123's
-- existing primary key (the 409 "duplicate key value violates unique constraint
-- students_pkey" error) because both rows already exist. This script does a proper merge.
--
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql

-- 1. Confirm both IDs and see everything currently attached to each, before changing
--    anything. Expect 7123 to have the DG enrollment/fee, 7125 to have the COL one.
SELECT student_id, name, mobile, batch_code, status FROM students WHERE student_id IN ('7123','7125');

SELECT student_id, batch_code, status FROM enrollments WHERE student_id IN ('7123','7125');

SELECT student_id, batch_code, course_fee, recorded_by, centre, revenue_month FROM student_fees WHERE student_id IN ('7123','7125');

-- 2. Diagnostic — checks every OTHER table that can reference a student_id, so nothing gets
--    silently left behind under 7125 (attendance, test records, diplomas, etc.). Confirm
--    these before deleting 7125 — if any read > 0, add the matching UPDATE in step 3.
SELECT 'attendance_feedback' AS tbl, count(*) FROM attendance_feedback WHERE student_id = '7125'
UNION ALL SELECT 'att_records', count(*) FROM att_records WHERE student_id = '7125'
UNION ALL SELECT 'assessment_marks', count(*) FROM assessment_marks WHERE student_id = '7125'
UNION ALL SELECT 'diplomas', count(*) FROM diplomas WHERE student_id = '7125'
UNION ALL SELECT 'test_responses', count(*) FROM test_responses WHERE student_id = '7125'
UNION ALL SELECT 'manual_grades', count(*) FROM manual_grades WHERE student_id = '7125'
UNION ALL SELECT 'test_warnings', count(*) FROM test_warnings WHERE student_id = '7125'
UNION ALL SELECT 'test_starts', count(*) FROM test_starts WHERE student_id = '7125';

-- 3. The actual merge. Re-points 7125's COL enrollment and fee record to 7123 (safe: 7123's
--    existing rows are for the DG batch, a different batch_code, so no unique-constraint
--    collision), then removes the now-empty duplicate profile. If step 2 found rows in any
--    other table, add the same UPDATE pattern for those tables here before running this.
BEGIN;

UPDATE enrollments   SET student_id = '7123' WHERE student_id = '7125';
UPDATE student_fees  SET student_id = '7123' WHERE student_id = '7125';

DELETE FROM students WHERE student_id = '7125';

COMMIT;

-- 4. Verify — 7123 should now show both batches/fee records, and 7125 should return nothing
--    from any of the three.
SELECT student_id, name, batch_code FROM students WHERE student_id IN ('7123','7125');

SELECT student_id, batch_code, status FROM enrollments WHERE student_id IN ('7123','7125');

SELECT student_id, batch_code, course_fee, revenue_month FROM student_fees WHERE student_id IN ('7123','7125');

-- 5. NOTE ON REVENUE: this merge does not by itself refresh revenue_monthly_achieved —
-- that table only re-syncs when a fee record for Bianca/that centre/that month is saved
-- or deleted through the app (syncStudentRevenue). The student_id merge doesn't change
-- centre, counsellor, or revenue_month, so Bianca's June/July "Achieved" totals will read
-- the same before and after this merge (the money was never doubled — this was purely a
-- duplicate PROFILE, not a duplicate CHARGE). The July "7 students" count issue (counting
-- fee rows instead of distinct students) is separate and unaffected by this merge; that
-- would need a code fix in syncStudentRevenue's student_count calculation.
