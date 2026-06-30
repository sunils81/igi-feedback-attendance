-- ============================================================
-- FIX: revenue_monthly_achieved primary key + locked column type
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql
--
-- Problem 1: Old PK was (month, period, counsellor) — only 3 cols.
--   h_saveRevenue uses on_conflict=month,period,counsellor,business_centre,business_type
--   → Supabase returns HTTP 400 "no unique constraint matching ON CONFLICT specification"
--   → Error was silently swallowed → portal showed success toast but nothing saved
--
-- Problem 2: locked column is TEXT but the portal was sending 'N'/'Y' strings
--   Fixed in shared.js v38 to send boolean true/false (PostgreSQL TEXT casts fine)
-- ============================================================

-- Step 1: Drop old primary key
ALTER TABLE public.revenue_monthly_achieved
  DROP CONSTRAINT IF EXISTS revenue_monthly_achieved_pkey;

-- Step 2: Add correct 5-column primary key matching the on_conflict in shared.js
ALTER TABLE public.revenue_monthly_achieved
  ADD CONSTRAINT revenue_monthly_achieved_pkey
  PRIMARY KEY (month, period, counsellor, business_centre, business_type);

-- Step 3: Verify the new constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'revenue_monthly_achieved'
  AND constraint_type = 'PRIMARY KEY';

-- Expected result: one row with constraint_name = 'revenue_monthly_achieved_pkey'
-- If there are duplicate rows blocking the PK creation, run this first to clean up:
-- DELETE FROM revenue_monthly_achieved a USING revenue_monthly_achieved b
-- WHERE a.ctid > b.ctid
--   AND a.month = b.month AND a.period = b.period AND a.counsellor = b.counsellor
--   AND a.business_centre = b.business_centre AND a.business_type = b.business_type;
