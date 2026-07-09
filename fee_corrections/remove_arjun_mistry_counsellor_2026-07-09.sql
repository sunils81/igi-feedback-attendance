-- Remove Arjun Mistry as a "counsellor" from the revenue system.
--
-- Arjun Mistry is an instructor (see assets/shared.js INSTRUCTORS list), but was mistakenly
-- seeded into revenue_annual_targets as a counsellor with a ₹5,00,000 annual target for
-- Ahmedabad (supabase/upsert_revenue_annual_targets.sql, original row). This is the live
-- source that drives the counsellor list on both the CEO portal (igi-ceo-portal.html) and
-- board portal (board-portal/index.html) — their hardcoded fallback arrays have already
-- been corrected in code, but loadData() overwrites those fallbacks from this table, so the
-- live row is what actually needs to go.
--
-- Verified live (2026-07-09):
--   - revenue_annual_targets has exactly one row for him (period 2026-27, Ahmedabad, target
--     500000 / GST target 590000).
--   - revenue_monthly_achieved has ZERO rows with counsellor = 'Arjun Mistry' (no actual
--     revenue was ever recorded against him) — safe to remove outright, nothing to reassign.
--   - batches.counselor and student_fees.recorded_by have no rows referencing him either.
--
-- Review, then run in the Supabase SQL editor:

BEGIN;

DELETE FROM revenue_annual_targets
WHERE period = '2026-27'
  AND counsellor = 'Arjun Mistry';

COMMIT;

-- Note: Ahmedabad's CENTRE-level target (revenue_centre_targets, ₹20,00,000) is untouched by
-- this — that's independent of any one counsellor. If Ahmedabad needs a counsellor target of
-- its own going forward, insert a fresh row into revenue_annual_targets for whoever actually
-- covers that centre.
