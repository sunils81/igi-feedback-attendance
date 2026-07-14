-- ============================================================================
-- Correct MUM-JP-JUN26: was set up as "JewelPad Design" (₹41,900+GST, offline
-- rate) but is actually the online delivery, which should charge "JewelPad
-- Online" (₹35,900+GST). "JewelPad Online" never existed as a selectable
-- course before this fix (see assets/shared.js COURSE_FEES_JS) — this batch
-- had no correct option to be created under, hence the mischarge.
-- ============================================================================

-- Step 1: fix the batch itself. Safe and immediate — course is a plain text
-- column here, not a key anything else joins on, so this alone doesn't touch
-- any already-saved student_fees row (course_fee is a snapshot taken at save
-- time, not a live lookup). Going forward, re-saving any student's fee record
-- for this batch will correctly auto-compute ₹35,900+GST.
UPDATE public.batches
SET course = 'JewelPad Online'
WHERE batch_code = 'MUM-JP-JUN26';

-- Step 2: READ-ONLY audit of who was already charged the wrong (₹41,900-basis)
-- fee under this batch, and what happens to each once corrected. Deliberately
-- does NOT write anything — some of these students may have already paid
-- based on the old, higher total, which becomes an overpayment once corrected
-- (a refund/credit call for your team to make, not something to auto-resolve).
-- Run this, review it, THEN go correct each student one at a time from the
-- Fees tab: reopen "Update Fee" for that student — it will now show the
-- correct ₹35,900 course fee automatically (pulled from the batch, fixed in
-- Step 1) — and Save. The already-collected amount is never touched by this;
-- only what they're EXPECTED to pay (net payable / outstanding) changes.
SELECT
  sf.id,
  sf.student_id,
  s.name AS student_name,
  sf.course_fee AS old_course_fee,
  ROUND(sf.course_fee * 1.18) AS old_net_payable_approx,
  35900 AS new_course_fee,
  ROUND(35900 * 1.18) AS new_net_payable_approx,
  sf.amount AS collected,
  ROUND(35900 * 1.18) - sf.amount AS new_outstanding,
  CASE WHEN sf.amount > ROUND(35900 * 1.18)
       THEN '⚠ OVERPAID by ₹' || (sf.amount - ROUND(35900 * 1.18))::text
       ELSE 'ok'
  END AS flag
FROM public.student_fees sf
LEFT JOIN public.students s ON s.student_id = sf.student_id
WHERE sf.batch_code = 'MUM-JP-JUN26'
  AND sf.course_fee = 41900
ORDER BY sf.student_id;

-- Note: "new_net_payable_approx" assumes no discount was applied. If a student
-- had a discount on their original record, the Update Fee form will apply it
-- correctly against the new ₹35,900 base when you re-save — this audit query
-- is just to flag who needs a look and whether an overpayment resulted, not a
-- substitute for reviewing each record in the UI before saving it.

-- ============================================================================
-- HOW TO RUN
-- ============================================================================
-- 1. Supabase SQL Editor → paste and run this whole file.
-- 2. Step 1's UPDATE applies immediately.
-- 3. Read Step 2's result table — for every row, open that student in the
--    Fees tab (Batch: MUM-JP-JUN26) → Update Fee → confirm the numbers now
--    shown → Save. Any row flagged OVERPAID needs a manual refund/credit
--    decision on your side before you close it out.
-- 4. Newly-flagged "Overpaid" fee statuses will now also show as a distinct
--    purple badge (rather than looking like a normal "Paid" record) anywhere
--    fee status is shown, so it can't get missed once corrected.
-- ============================================================================
