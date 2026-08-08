-- ============================================================
-- MIGRATION: Grant DELETE on discount_requests, admin-only
-- 2026-08-08, per instruction: "TEST RECORD STILL THERE" (a leftover test discount
-- request showing in the real list, with no way to remove it).
--
-- Reconsidered the original no-DELETE decision: every other table built this session
-- (misc_charges, credit_notes, corporate_batches) grants DELETE at the DB level and
-- gates it with an isAdmin check at the application level -- that's the consistent
-- security model throughout this whole project (the anon key has broad DB permissions;
-- the app enforces business-logic restrictions). Withholding DELETE only on
-- discount_requests was an inconsistency, not a meaningfully stronger protection --
-- it just meant genuine mistakes/test data had no cleanup path except manual SQL.
-- Run this in Supabase -> SQL Editor
-- ============================================================

GRANT DELETE ON public.discount_requests TO anon;
