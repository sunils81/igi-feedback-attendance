-- QUERY 4: For the overlapping GG students (found in query 3), does each of them
-- have a marks row for EVERY Practical test in EVERY batch they're enrolled in —
-- or is one missing because the other batch's save overwrote it?
-- Covers both Jaipur and Surat (the two centres query 3 flagged), instructor
-- filter removed so it catches all overlapping students, not just Khorehmand's.

WITH overlap_students AS (
  SELECT student_id, array_agg(DISTINCT batch_code) AS batches
  FROM enrollments
  WHERE status = 'Active'
  GROUP BY student_id
  HAVING count(DISTINCT batch_code) > 1
),
relevant_batches AS (
  SELECT DISTINCT unnest(batches) AS batch_code FROM overlap_students
),
practical_tests AS (
  SELECT assessment_id, batch_code, test_name, test_type, max_marks
  FROM assessments
  WHERE batch_code IN (SELECT batch_code FROM relevant_batches)
    AND test_type ILIKE '%practical%'
)
SELECT
  pt.batch_code, pt.assessment_id, pt.test_name,
  os.student_id,
  am.marks, am.remarks,
  CASE WHEN am.assessment_id IS NULL THEN '❌ MISSING — likely overwritten by the other batch''s save'
       ELSE '✅ present' END AS status
FROM practical_tests pt
JOIN overlap_students os ON pt.batch_code = ANY(os.batches)
LEFT JOIN assessment_marks am
  ON am.assessment_id = pt.assessment_id AND am.student_id = os.student_id
ORDER BY os.student_id, pt.batch_code;
