-- QUERY 6: Every assessment created by/for Khorehmand, regardless of batch_code —
-- to find out which batch_code the "Diamond Graduate" and "Colorstone" practical
-- marks actually got saved under, since they're NOT under JAI-DG-JUL26 / JAI-COL-JUL26.

SELECT assessment_id, batch_code, test_name, test_type, max_marks, held_on, instructor, created_at
FROM assessments
WHERE instructor ILIKE '%Khorehmand%'
ORDER BY created_at DESC;

-- If that returns nothing either (instructor field might be blank/typo'd), fall back
-- to searching by test name instead:
-- SELECT assessment_id, batch_code, test_name, test_type, max_marks, held_on, instructor, created_at
-- FROM assessments
-- WHERE test_type ILIKE '%practical%'
-- ORDER BY created_at DESC
-- LIMIT 50;
