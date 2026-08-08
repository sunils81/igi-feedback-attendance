-- QUERY 1: What UNIQUE/PRIMARY KEY constraint actually exists on assessment_marks?
-- Expected (correct): one row showing columns = "assessment_id, student_id"
-- If you instead see "student_id" alone, or no rows at all, that confirms the bug:
-- saving marks for a student in one batch can silently overwrite their row from
-- another batch, because the database isn't told the two are different tests.

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
