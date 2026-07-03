-- ============================================================
-- IGI Portal: Batch Accountability Columns
-- Run this in Supabase SQL Editor BEFORE deploying the code that
-- uses it (h_createBatch / h_getBatches / h_confirmBatchCreation
-- in assets/shared.js). Without these columns, batch creation will
-- start failing with a 400 error the moment the new code goes live.
-- ============================================================

-- Tracks WHO actually created a batch and from WHICH home centre, separate
-- from `centre` (the batch's own centre). When these differ, the batch was
-- created remotely (e.g. a counselor at one centre setting up a batch for
-- another) and stays unconfirmed until that centre's team acknowledges it.
ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS created_by_centre    TEXT,
  ADD COLUMN IF NOT EXISTS created_by_counselor TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_by         TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_at         TIMESTAMPTZ;

-- Backfill existing rows as "confirmed, created by their own centre" so the
-- new remote-batch banners/oversight view don't flag historical data.
UPDATE batches
SET created_by_centre = centre,
    created_by_counselor = counselor,
    confirmed_by = counselor,
    confirmed_at = created_at
WHERE created_by_centre IS NULL;
