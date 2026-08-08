-- QUERY 7a: What is the instructor's name actually spelled as on the Jaipur batches?
-- (confirms whether "Khorehmand" was a mis-spelling on my end)
SELECT batch_code, centre, course, instructor, co_instructor
FROM batches
WHERE centre ILIKE '%Jaipur%'
ORDER BY batch_code;

-- QUERY 7b: Does the assessments table have ANY Practical-type row at all, for
-- any batch, any instructor, anywhere in the system? This tells us whether the
-- manual Marks tab is actually being used for practicals at all right now.
SELECT assessment_id, batch_code, test_name, test_type, max_marks, held_on, instructor, created_at
FROM assessments
WHERE test_type ILIKE '%practical%'
ORDER BY created_at DESC
LIMIT 50;

-- QUERY 7c: Just in case — does the assessments table have ANY rows at all,
-- of any type, for any batch? (sanity check that this table isn't just empty
-- entirely, e.g. instructors are using the Online Test system exclusively now)
SELECT count(*) AS total_assessment_rows FROM assessments;
