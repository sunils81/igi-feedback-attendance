-- ============================================================================
-- Fix: partial fee payments appearing to "revert to 0" after save + reload
-- ============================================================================
-- Root cause: h_saveFee (assets/shared.js) used to GET the existing row for
-- (student_id, batch_code), then decide PATCH-if-found / POST-if-not-found.
-- That is NOT atomic — two near-simultaneous saves (a double-click, a slow
-- network retry, etc.) could both run the GET, both see "no existing row",
-- and both POST, leaving two rows for the same student + batch with no
-- defined order between them. There was also no unique constraint to stop
-- this. Every later read (the Fees tab list, the Update-Fee edit form) had
-- no ORDER BY either, so whichever duplicate row Postgres happened to return
-- first "won" — which is exactly how a saved partial payment could appear to
-- vanish back to a blank/zero record on a later visit.
--
-- This migration:
--   1. Deduplicates any existing (student_id, batch_code) duplicates, keeping
--      the most recently created row (the one most likely to hold the real,
--      final payment data) and deleting the rest.
--   2. Adds a UNIQUE(student_id, batch_code) constraint so it can never
--      happen again, and so assets/shared.js can use a true atomic upsert
--      (POST ... ?on_conflict=student_id,batch_code) instead of the old
--      GET-then-branch pattern.
--
-- Safe to re-run: step 1 is idempotent (no-op once there are no duplicates),
-- and step 2 uses IF NOT EXISTS-style guarding via a DO block.
-- ============================================================================

-- Step 1: keep only the newest row per (student_id, batch_code).
-- Tiebreak on id if two rows somehow share the same created_at.
DELETE FROM public.student_fees a
USING public.student_fees b
WHERE a.student_id = b.student_id
  AND a.batch_code = b.batch_code
  AND a.id <> b.id
  AND (
    a.created_at < b.created_at
    OR (a.created_at = b.created_at AND a.id < b.id)
  );

-- Step 2: prevent duplicates going forward.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'student_fees_student_batch_unique'
  ) THEN
    ALTER TABLE public.student_fees
      ADD CONSTRAINT student_fees_student_batch_unique UNIQUE (student_id, batch_code);
  END IF;
END $$;

-- ============================================================================
-- HOW TO RUN
-- ============================================================================
-- Open the Supabase dashboard → SQL Editor → paste this whole file → Run.
-- It's safe to run more than once.
-- ============================================================================
