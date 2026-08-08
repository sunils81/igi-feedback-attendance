-- ============================================================
-- MIGRATION: Add payload to discount_requests
-- 2026-08-08, per instruction: "After the discount was approved, student should have
-- been automatically added in the batch... make it seamless."
--
-- Root cause found: h_saveFee's hard block rejects the WHOLE save before persisting
-- anything, so all the payment details a counsellor entered (installments, invoice, mode,
-- etc.) were being lost, not just the discount -- confirmed live on Rita Debnath (student
-- 7306), who has a real students+enrollments record but zero fee records despite her
-- discount now being approved. This column stashes the full intended saveFeeRecord
-- payload at request time, so once approved the counsellor can resume with one click
-- instead of re-entering everything from scratch.
-- Run this in Supabase -> SQL Editor
-- ============================================================

ALTER TABLE discount_requests ADD COLUMN IF NOT EXISTS payload JSONB;
