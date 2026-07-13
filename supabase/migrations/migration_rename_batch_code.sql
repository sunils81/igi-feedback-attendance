-- ============================================================================
-- Rename a batch code, project-wide
-- ============================================================================
-- Fixes: SUR-DG-20207 was created with a code that doesn't match the portal's
-- CENTRE-COURSE-MONTH convention (e.g. SUR-DG-AUG26). There's no "rename
-- batch" button anywhere in the portal because batch_code is the PRIMARY KEY
-- on `batches`, and is referenced (TEXT REFERENCES batches(batch_code), no
-- ON UPDATE CASCADE) from: students, enrollments, sessions, att_records,
-- assessments, student_fees, diplomas, online_tests, and class_resources.
-- A plain UPDATE on the parent's key fails with a foreign-key violation while
-- any child still points at the old value — that's the "not able to correct
-- it" you ran into. This also fixes the two places batch_code is stored
-- WITHOUT a real FK: test_responses.batch_code, and online_tests.batch_codes
-- (a comma-separated list of codes).
--
-- Safe rename order — the whole thing is one transaction (a DO block is
-- atomic), so if anything fails partway (e.g. a table below doesn't exist
-- yet on your database), NOTHING is changed:
--   1. Clone the batches row under the NEW code (parent must exist before
--      children can be repointed at it).
--   2. Repoint every FK child table from OLD to NEW.
--   3. Fix the two non-FK mentions.
--   4. Delete the OLD batches row (safe now — nothing references it).
--
-- TO REUSE for a future rename: just edit old_code / new_code below and
-- run again.
-- ============================================================================

DO $$
DECLARE
  old_code TEXT := 'SUR-DG-20207';
  new_code TEXT := 'SUR-DG-AUG26';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM batches WHERE batch_code = old_code) THEN
    RAISE EXCEPTION 'Batch % not found — nothing to rename', old_code;
  END IF;
  IF EXISTS (SELECT 1 FROM batches WHERE batch_code = new_code) THEN
    RAISE EXCEPTION 'Batch % already exists — pick a different new code, or merge the two batches manually', new_code;
  END IF;

  -- 1. Clone the row under the new code. Built via jsonb so this keeps working
  --    even if the batches table has gained columns since this script was written
  --    (co_instructor, confirmed_by, etc. were all added after the original schema.sql).
  INSERT INTO batches
  SELECT (jsonb_populate_record(NULL::batches, to_jsonb(b) || jsonb_build_object('batch_code', new_code))).*
  FROM batches b WHERE b.batch_code = old_code;

  -- 2. Repoint every FK-referencing child table.
  UPDATE students        SET batch_code = new_code WHERE batch_code = old_code;
  UPDATE enrollments     SET batch_code = new_code WHERE batch_code = old_code;
  UPDATE sessions        SET batch_code = new_code WHERE batch_code = old_code;
  UPDATE att_records     SET batch_code = new_code WHERE batch_code = old_code;
  UPDATE assessments     SET batch_code = new_code WHERE batch_code = old_code;
  UPDATE student_fees    SET batch_code = new_code WHERE batch_code = old_code;
  UPDATE diplomas        SET batch_code = new_code WHERE batch_code = old_code;
  UPDATE online_tests    SET batch_code = new_code WHERE batch_code = old_code;
  UPDATE class_resources SET batch_code = new_code WHERE batch_code = old_code;

  -- 3. Non-FK mentions.
  UPDATE test_responses SET batch_code = new_code WHERE batch_code = old_code;
  UPDATE online_tests
    SET batch_codes = regexp_replace(batch_codes, '(^|,)' || old_code || '(,|$)', '\1' || new_code || '\2')
    WHERE batch_codes LIKE '%' || old_code || '%';

  -- 4. Drop the old parent row — safe now, nothing points at it anymore.
  DELETE FROM batches WHERE batch_code = old_code;

  RAISE NOTICE 'Renamed batch % -> % across all tables.', old_code, new_code;
END $$;

-- ============================================================================
-- HOW TO RUN
-- ============================================================================
-- Supabase dashboard → SQL Editor → paste this whole file → Run.
-- If it errors (e.g. a table listed above doesn't exist on your database yet),
-- nothing is changed — just delete that one UPDATE line and re-run.
-- After running: reload the Counselor Portal. If SUR-DG-AUG26 doesn't show up
-- right away in the Fees/Report/Student dropdowns, it's the sessionStorage
-- cache — that's already fixed to auto-refresh after batch actions, but a hard
-- reload (Cmd/Ctrl+Shift+R) will always clear it too.
-- ============================================================================
