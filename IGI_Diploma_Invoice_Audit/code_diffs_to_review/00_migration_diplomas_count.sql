-- ============================================================
-- IGI Portal: Diploma Count field
-- diplomas already lives in Supabase and is written to LIVE
-- (counselor.html -> Supabase REST, on releaseDiploma) -- this
-- table genuinely is the system of record already, unlike
-- student_fees. This migration just adds the missing count
-- field for bundle courses (e.g. Graduate Gemologist releasing
-- 3 certificates in one action).
--
-- Safe to run any time: additive, nullable-with-default,
-- non-breaking.
-- ============================================================

ALTER TABLE diplomas
  ADD COLUMN IF NOT EXISTS diploma_count INTEGER DEFAULT 1;
