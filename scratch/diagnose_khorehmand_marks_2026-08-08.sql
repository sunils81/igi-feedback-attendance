-- Diagnose: Khorehmand (Jaipur) GG student's Diamond Graduate practical marks
-- appear to change after Colorstone marks are entered.
-- Run each numbered block separately in the Supabase SQL editor (easier to read
-- the output one piece at a time), or run the whole file at once.

-- ============================================================
-- 1. THE ACTUAL CONSTRAINT on assessment_marks — this is the key question.
--    We expect ONE row here: UNIQUE (assessment_id, student_id).
--    If instead you see a constraint on student_id alone (or none at all),
--    that's the bug: saving marks for a student in Batch B silently
--    overwrites their row from Batch A instead of adding a new one.
-- ============================================================
SELECT
  tc.constraint_name,
  tc.constraint_type,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'assessment_marks'
  AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
GROUP BY tc.constraint_name, tc.constraint_type;


-- ============================================================
-- 2. Khorehmand's batches in Jaipur
-- ============================================================
SELECT batch_code, course, centre, instructor, co_instructor
FROM batches
WHERE instructor ILIKE '%Khorehmand%' OR co_instructor ILIKE '%Khorehmand%';
-- (If nothing comes back, the centre/name spelling may differ — try
--  centre ILIKE '%Jaipur%' on its own to see all Jaipur batches instead.)


-- ============================================================
-- 3. Students enrolled Active in MORE THAN ONE of Khorehmand's Jaipur batches
--    (the GG students doing both Diamond Grading + Colorstone modules —
--    the group at risk if the constraint in #1 is wrong)
-- ============================================================
WITH khorehmand_batches AS (
  SELECT batch_code FROM batches
  WHERE instructor ILIKE '%Khorehmand%' OR co_instructor ILIKE '%Khorehmand%'
)
SELECT student_id, array_agg(batch_code) AS batches, count(*) AS n
FROM enrollments
WHERE batch_code IN (SELECT batch_code FROM khorehmand_batches)
  AND status = 'Active'
GROUP BY student_id
HAVING count(DISTINCT batch_code) > 1;


-- ============================================================
-- 4. THE SMOKING GUN: for each Practical test in Khorehmand's Jaipur batches,
--    does every enrolled student who SHOULD have a mark actually have one —
--    or is a row from one batch missing because a later save in the other
--    batch overwrote it?
-- ============================================================
WITH khorehmand_batches AS (
  SELECT batch_code FROM batches
  WHERE instructor ILIKE '%Khorehmand%' OR co_instructor ILIKE '%Khorehmand%'
),
overlap_students AS (
  SELECT student_id
  FROM enrollments
  WHERE batch_code IN (SELECT batch_code FROM khorehmand_batches) AND status = 'Active'
  GROUP BY student_id
  HAVING count(DISTINCT batch_code) > 1
),
practical_tests AS (
  SELECT assessment_id, batch_code, test_name, test_type, max_marks
  FROM assessments
  WHERE batch_code IN (SELECT batch_code FROM khorehmand_batches)
    AND test_type ILIKE '%practical%'
)
SELECT
  pt.batch_code, pt.assessment_id, pt.test_name,
  os.student_id,
  am.marks, am.remarks,
  CASE WHEN am.assessment_id IS NULL THEN '❌ MISSING — likely overwritten by the other batch''s save'
       ELSE '✅ present' END AS status
FROM practical_tests pt
CROSS JOIN overlap_students os
LEFT JOIN assessment_marks am
  ON am.assessment_id = pt.assessment_id AND am.student_id = os.student_id
ORDER BY os.student_id, pt.batch_code;
