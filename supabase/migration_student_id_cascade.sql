-- ============================================================
-- MIGRATION: Make Student ID edits cascade everywhere
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql
--
-- Context: students.student_id is referenced as a foreign key by 11 other
-- tables. None of those foreign keys currently cascade on update, so today
-- a Student ID rename only succeeds for a brand-new student with no history
-- yet — the moment attendance, fees, marks, or a CRM lead exist under the
-- old ID, Postgres blocks the rename outright (safe, but not what you want
-- when correcting a real student's ID after the fact).
--
-- This migration adds ON UPDATE CASCADE to all 11 foreign keys, so renaming
-- a student_id in the students table automatically updates every linked
-- row in one transaction. ON DELETE behaviour is left untouched (still
-- blocks deleting a student who has history) — this migration only changes
-- what happens on a RENAME, not a delete.
-- ============================================================

-- enrollments
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_student_id_fkey;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON UPDATE CASCADE;

-- attendance_feedback
ALTER TABLE public.attendance_feedback DROP CONSTRAINT IF EXISTS attendance_feedback_student_id_fkey;
ALTER TABLE public.attendance_feedback ADD CONSTRAINT attendance_feedback_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON UPDATE CASCADE;

-- att_records
ALTER TABLE public.att_records DROP CONSTRAINT IF EXISTS att_records_student_id_fkey;
ALTER TABLE public.att_records ADD CONSTRAINT att_records_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON UPDATE CASCADE;

-- assessment_marks
ALTER TABLE public.assessment_marks DROP CONSTRAINT IF EXISTS assessment_marks_student_id_fkey;
ALTER TABLE public.assessment_marks ADD CONSTRAINT assessment_marks_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON UPDATE CASCADE;

-- student_fees
ALTER TABLE public.student_fees DROP CONSTRAINT IF EXISTS student_fees_student_id_fkey;
ALTER TABLE public.student_fees ADD CONSTRAINT student_fees_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON UPDATE CASCADE;

-- diplomas
ALTER TABLE public.diplomas DROP CONSTRAINT IF EXISTS diplomas_student_id_fkey;
ALTER TABLE public.diplomas ADD CONSTRAINT diplomas_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON UPDATE CASCADE;

-- test_responses
ALTER TABLE public.test_responses DROP CONSTRAINT IF EXISTS test_responses_student_id_fkey;
ALTER TABLE public.test_responses ADD CONSTRAINT test_responses_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON UPDATE CASCADE;

-- manual_grades
ALTER TABLE public.manual_grades DROP CONSTRAINT IF EXISTS manual_grades_student_id_fkey;
ALTER TABLE public.manual_grades ADD CONSTRAINT manual_grades_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON UPDATE CASCADE;

-- test_warnings
ALTER TABLE public.test_warnings DROP CONSTRAINT IF EXISTS test_warnings_student_id_fkey;
ALTER TABLE public.test_warnings ADD CONSTRAINT test_warnings_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON UPDATE CASCADE;

-- test_starts
ALTER TABLE public.test_starts DROP CONSTRAINT IF EXISTS test_starts_student_id_fkey;
ALTER TABLE public.test_starts ADD CONSTRAINT test_starts_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON UPDATE CASCADE;

-- crm_leads
ALTER TABLE public.crm_leads DROP CONSTRAINT IF EXISTS crm_leads_student_id_fkey;
ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON UPDATE CASCADE;

-- ── Verify: every FK below should show update_rule = 'CASCADE' ──────────
SELECT
  tc.table_name,
  tc.constraint_name,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_name LIKE '%student_id_fkey'
ORDER BY tc.table_name;
