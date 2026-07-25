-- Diagnose: Anuradha's Revenue tab "Total Achieved" (₹80,21,358 = Own Centre ₹33,71,312 +
-- Other Centres ₹41,84,546 + Corporate ₹4,65,500) is roughly DOUBLE her Fee Record tab's
-- live total (₹41,85,800, all centres, post cross-centre-visibility fix). The gap is too
-- large to be a timing/backfill difference — this matches the exact bug class already hit
-- for Bianca/Kripa/Rohit: duplicate or stale rows in revenue_monthly_achieved (one
-- auto-derived, one manual/legacy) both getting summed by the portal, plus late-entry rows
-- landing in the wrong month (see migration_revenue_month_column.sql — "Kripa's July
-- over-count"). READ ONLY, changes nothing.
--
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql
-- Scope: April, May, June, July 2026 (per user request), period '2026-27'.

-- 1. Every revenue_monthly_achieved row for Anuradha, Apr-Jul 2026. Look for:
--    (a) two+ rows in the SAME month with the same business_centre but different
--        business_type / notes (e.g. one "Auto" one "Manual") — both get summed on the
--        portal, silently doubling that month's figure;
--    (b) a business_centre value that isn't a clean centre name (numeric/blank garbage —
--        the exact bug fixed before for Bianca);
--    (c) a locked='Y' row sitting alongside a newer unlocked row for the same key.
SELECT month, business_centre, business_type, student_count,
       achieved_course_fee, achieved_course_fee_gst, notes, locked, updated_at
FROM revenue_monthly_achieved
WHERE counsellor = 'Anuradha' AND period = '2026-27' AND month IN ('2026-04','2026-05','2026-06','2026-07')
ORDER BY month, business_centre, business_type;

-- 2. Numeric/garbage business_centre check, scoped to Anuradha.
SELECT month, business_centre, business_type, achieved_course_fee
FROM revenue_monthly_achieved
WHERE counsellor = 'Anuradha' AND business_centre ~ '^[0-9]';

-- 3. What the underlying student_fees ledger actually shows per month/centre for Anuradha
--    (uses revenue_month, the authoritative "which month this sale counts toward" column —
--    NOT created_at). Compare this against query #1's achieved_course_fee for the matching
--    month+centre — a portal total higher than this points to a stale/duplicate row in
--    revenue_monthly_achieved rather than genuinely higher sales.
SELECT revenue_month, centre, COUNT(*) AS fee_rows,
       SUM(course_fee) AS total_course_fee, SUM(gst_amount) AS total_gst
FROM student_fees
WHERE recorded_by = 'Anuradha' AND revenue_month IN ('2026-04','2026-05','2026-06','2026-07')
GROUP BY revenue_month, centre
ORDER BY revenue_month, centre;

-- 4. Side-by-side monthly totals — the fastest way to see exactly which month(s) diverge
--    and by how much (portal figure vs live ledger figure).
SELECT rma.month,
       SUM(rma.achieved_course_fee) AS portal_total,
       (SELECT COALESCE(SUM(sf.course_fee),0) FROM student_fees sf
         WHERE sf.recorded_by = 'Anuradha' AND sf.revenue_month = rma.month) AS ledger_total
FROM revenue_monthly_achieved rma
WHERE rma.counsellor = 'Anuradha' AND rma.period = '2026-27'
  AND rma.month IN ('2026-04','2026-05','2026-06','2026-07')
GROUP BY rma.month
ORDER BY rma.month;

-- 5. Rows where revenue_month and created_at disagree, scoped to Anuradha — flags
--    backfilled/late entries that may have been counted into a different month on the
--    portal than where the live ledger now places them.
SELECT recorded_by, centre, revenue_month, to_char(created_at,'YYYY-MM') AS created_month,
       COUNT(*), SUM(course_fee) AS total_course_fee
FROM student_fees
WHERE recorded_by = 'Anuradha'
GROUP BY 1,2,3,4
HAVING revenue_month <> to_char(created_at,'YYYY-MM')
ORDER BY revenue_month;

-- 6. Duplicate student_fees rows under Anuradha (same student billed twice) — the unique
--    constraint on (student_id, batch_code) won't catch a typo'd/second batch_code for the
--    same enrollment.
SELECT student_id, COUNT(*) AS row_count, SUM(course_fee) AS summed_course_fee,
       array_agg(batch_code) AS batch_codes, array_agg(id) AS row_ids
FROM student_fees
WHERE recorded_by = 'Anuradha'
GROUP BY student_id
HAVING COUNT(*) > 1;

-- 7. Names behind query 6, so any duplicate can be confirmed against what Anuradha
--    actually sold.
SELECT s.student_id, s.name, sf.batch_code, sf.centre, sf.course_fee, sf.revenue_month,
       sf.created_at, sf.id
FROM student_fees sf
JOIN students s ON s.student_id = sf.student_id
WHERE sf.recorded_by = 'Anuradha'
ORDER BY s.name, sf.created_at;

-- Next step once query 4 identifies the offending month(s):
--   - If query 1 shows two rows for that month/centre (duplicate business_type/notes):
--     delete the stale one by its exact composite key (month, period, counsellor,
--     business_centre, business_type), same approach as fix_revenue_monthly_duplicates.sql.
--   - If query 2 finds numeric-garbage business_centre rows: delete by that same pattern.
--   - If query 5/6/7 point to a duplicate or misdated student_fees row instead: delete by
--     its exact `id` only — never a broad WHERE clause.
--   - After any delete, the revenue_monthly_achieved row self-corrects the next time a fee
--     record for Anuradha/that centre/that month is saved (syncStudentRevenue re-derives
--     it from student_fees) — or ask for an immediate targeted UPDATE instead of waiting.
