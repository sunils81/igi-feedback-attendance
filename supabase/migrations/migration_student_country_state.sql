-- ============================================================
-- IGI Portal: Student Country / State-Region columns
-- Run this in Supabase SQL Editor BEFORE deploying the code that uses it
-- (h_addStudent in assets/shared.js, and the Country/State fields added to the
-- Enroll New Student modal, Add Student tab, and Add Past Alumni modal). Without
-- these columns, saving a new student will start failing with a 400 error the
-- moment the new code goes live.
-- ============================================================

-- Tracks the student's home country (default 'India', the overwhelming majority of
-- enrollments) and, for non-India students, a free-text state/region (e.g. "Dubai",
-- "California") since a fixed Indian-states list doesn't apply to them. Indian
-- students continue to use the existing state dropdown on the CRM lead form; this
-- column is specifically for the STUDENT record created at enrollment.
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS country      TEXT DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS state_region TEXT DEFAULT '';

-- Backfill existing rows explicitly (NULL country would otherwise read ambiguously
-- in reports) — every student added before this change was, in practice, Indian.
UPDATE students
SET country = 'India'
WHERE country IS NULL;
