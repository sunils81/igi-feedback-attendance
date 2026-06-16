-- ============================================================
-- Supabase RPC for getting active student counts per batch
-- Fixes N+1 memory exhaustion on the client side
-- ============================================================

CREATE OR REPLACE FUNCTION get_active_student_counts()
RETURNS TABLE(batch_code TEXT, student_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    UPPER(b.batch_code) AS batch_code,
    COUNT(DISTINCT s.student_id) AS student_count
  FROM (
    -- Primary batch mapped directly in students table
    SELECT batch_code, student_id
    FROM students
    WHERE status = 'Active' AND batch_code IS NOT NULL
    UNION
    -- Secondary/multiple batches mapped in enrollments
    SELECT batch_code, student_id
    FROM enrollments
    WHERE status = 'Active' AND batch_code IS NOT NULL
  ) AS active_enrollments
  JOIN batches b ON UPPER(active_enrollments.batch_code) = UPPER(b.batch_code)
  GROUP BY UPPER(b.batch_code);
$$;

-- Grant access to anon and authenticated
GRANT EXECUTE ON FUNCTION get_active_student_counts TO anon, authenticated;
