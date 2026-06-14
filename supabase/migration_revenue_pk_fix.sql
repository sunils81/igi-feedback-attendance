-- ============================================================
-- FIX: revenue_monthly_achieved primary key
-- Old PK: (month, period, counsellor)          ← breaks multi-row saves
-- New PK: (month, period, counsellor, business_centre, business_type)
-- Run in Supabase → SQL Editor
-- ============================================================

-- 1. Drop existing primary key
ALTER TABLE public.revenue_monthly_achieved
  DROP CONSTRAINT IF EXISTS revenue_monthly_achieved_pkey;

-- 2. Add the corrected composite primary key
ALTER TABLE public.revenue_monthly_achieved
  ADD CONSTRAINT revenue_monthly_achieved_pkey
  PRIMARY KEY (month, period, counsellor, business_centre, business_type);

-- Verify
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'revenue_monthly_achieved';
