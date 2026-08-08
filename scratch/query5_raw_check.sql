-- QUERY 5: Ground truth, no filters/assumptions. For the Jaipur GG students we
-- already confirmed overlap (6653, 6827, 6905 — enrolled in both JAI-DG-JUL26
-- and JAI-COL-JUL26), show EVERY assessment that exists for those two batches,
-- and EVERY assessment_marks row these students actually have, however it's
-- labeled. This tells us whether "Practical" marks are even going through the
-- assessments/assessment_marks tables at all, or somewhere else.

-- 5a. Every test (any type) that's been created for these two Jaipur batches
SELECT assessment_id, batch_code, test_name, test_type, max_marks, held_on, instructor
FROM assessments
WHERE batch_code IN ('JAI-DG-JUL26', 'JAI-COL-JUL26')
ORDER BY batch_code, held_on;

-- 5b. Every mark these 3 students actually have, across those tests
SELECT a.batch_code, a.test_name, a.test_type, am.student_id, am.marks, am.remarks
FROM assessment_marks am
JOIN assessments a ON a.assessment_id = am.assessment_id
WHERE am.student_id IN ('6653', '6827', '6905')
  AND a.batch_code IN ('JAI-DG-JUL26', 'JAI-COL-JUL26')
ORDER BY am.student_id, a.batch_code;

-- 5c. In case practicals are graded through the Online Test system instead
--     (online_tests + manual_grades, a separate mechanism with NO unique
--     constraint on manual_grades — worth checking regardless):
SELECT test_id, title, test_type, batch_codes, batch_code, status
FROM online_tests
WHERE batch_codes ILIKE '%JAI-DG-JUL26%' OR batch_codes ILIKE '%JAI-COL-JUL26%'
   OR batch_code IN ('JAI-DG-JUL26', 'JAI-COL-JUL26');
