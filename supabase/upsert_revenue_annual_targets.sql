-- Revenue Annual Targets — align with shared.js column names + re-seed
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql
-- NOTE: Column names are annual_course_fee_target / annual_course_fee_gst_target
--       to match what shared.js saves (h_saveRevenue) and reads (buildRevenueDashboardJSON)

-- Step 1: Drop existing table
DROP TABLE IF EXISTS revenue_annual_targets;

-- Step 2: Create with column names matching shared.js
CREATE TABLE revenue_annual_targets (
  period                        TEXT NOT NULL,
  counsellor                    TEXT NOT NULL,
  centre                        TEXT NOT NULL DEFAULT '',
  annual_course_fee_target      NUMERIC(14,2) DEFAULT 0,
  annual_course_fee_gst_target  NUMERIC(14,2) DEFAULT 0,
  notes                         TEXT DEFAULT '',
  updated_by                    TEXT DEFAULT '',
  updated_at                    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (period, counsellor)
);

-- Step 3: Insert all counsellor annual targets for 2026-27
INSERT INTO revenue_annual_targets
  (period, counsellor, centre, annual_course_fee_target, annual_course_fee_gst_target, notes, updated_by, updated_at)
VALUES
  ('2026-27','Bianca',      'Mumbai',    6500000.0,  7670000.0,  '', 'Admin', '2026-06-02T03:54:38.506Z'),
  ('2026-27','Anuradha',    'Mumbai',   17500000.0, 20650000.0,  'Other centres', 'Admin', '2026-06-02T12:46:59.723Z'),
  ('2026-27','Rohit',       'Surat',     3500000.0,  4130000.0,  'individual revenue', 'Admin', '2026-06-03T06:26:44.221Z'),
  ('2026-27','Preethy',     'Chennai',   3500000.0,  4130000.0,  'individual revenue', 'Admin', '2026-06-03T06:26:44.593Z'),
  ('2026-27','Nadiya',      'Bangalore', 3500000.0,  4130000.0,  'individual revenue', 'Admin', '2026-06-03T06:26:44.981Z'),
  ('2026-27','Rajini',      'Hyderabad', 3500000.0,  4130000.0,  'individual revenue', 'Admin', '2026-06-03T06:26:45.320Z'),
  ('2026-27','Kripa',       'Jaipur',    3500000.0,  4130000.0,  'individual revenue', 'Admin', '2026-06-03T06:26:45.696Z'),
  ('2026-27','Omkar Kadam', 'Mumbai',    3500000.0,  4130000.0,  '', 'Admin', '2026-06-02T12:51:42.429Z'),
  ('2026-27','Sunita',      'Delhi',    12000000.0, 14160000.0,  '', 'Admin', '2026-06-02T12:51:42.755Z'),
  ('2026-27','Arpita',      'Kolkata',   6000000.0,  7080000.0,  'individual revenue', 'Admin', '2026-06-03T06:26:43.967Z'),
  ('2026-27','Arjun Mistry','Ahmedabad',  500000.0,   590000.0,  'Rectifying negative value', 'Admin', '2026-06-04T09:34:26.221Z')
;

-- Step 4: Enable RLS (anon key read/write needed by portal)
ALTER TABLE revenue_annual_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read" ON revenue_annual_targets;
DROP POLICY IF EXISTS "public write" ON revenue_annual_targets;
CREATE POLICY "public read"  ON revenue_annual_targets FOR SELECT USING (true);
CREATE POLICY "public write" ON revenue_annual_targets FOR ALL    USING (true);
