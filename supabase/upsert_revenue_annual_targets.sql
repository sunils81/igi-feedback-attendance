-- ═══════════════════════════════════════════════════════════════
-- REVENUE TARGETS SETUP — Run this entire file in Supabase SQL
-- https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql
-- Sets up BOTH counsellor-level AND centre-level annual targets
-- Period: 2026-27 (April 2026 – March 2027)
-- Column names match shared.js: annual_course_fee_target / annual_course_fee_gst_target
-- ═══════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
-- TABLE 1: COUNSELLOR ANNUAL TARGETS
-- ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS revenue_annual_targets;

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

INSERT INTO revenue_annual_targets
  (period, counsellor, centre, annual_course_fee_target, annual_course_fee_gst_target, notes, updated_by, updated_at)
VALUES
  ('2026-27', 'Bianca',       'Mumbai',    6500000.00,  7670000.00,  '', 'Admin', NOW()),
  ('2026-27', 'Anuradha',     'Mumbai',   17500000.00, 20650000.00,  'Other centres', 'Admin', NOW()),
  ('2026-27', 'Omkar Kadam',  'Mumbai',    3500000.00,  4130000.00,  '', 'Admin', NOW()),
  ('2026-27', 'Sunita',       'Delhi',    12000000.00, 14160000.00,  '', 'Admin', NOW()),
  ('2026-27', 'Arpita',       'Kolkata',   6000000.00,  7080000.00,  '', 'Admin', NOW()),
  ('2026-27', 'Rohit',        'Surat',     3500000.00,  4130000.00,  '', 'Admin', NOW()),
  ('2026-27', 'Preethy',      'Chennai',   3500000.00,  4130000.00,  '', 'Admin', NOW()),
  ('2026-27', 'Nadiya',       'Bangalore', 3500000.00,  4130000.00,  '', 'Admin', NOW()),
  ('2026-27', 'Rajini',       'Hyderabad', 3500000.00,  4130000.00,  '', 'Admin', NOW()),
  ('2026-27', 'Kripa',        'Jaipur',    3500000.00,  4130000.00,  '', 'Admin', NOW())
  -- Arjun Mistry removed 2026-07-09: he is an instructor, not a counsellor (see
  -- assets/shared.js INSTRUCTORS list). He was mistakenly seeded here with a counsellor
  -- revenue target for Ahmedabad, which surfaced him on the counsellor leaderboard on the
  -- CEO/board revenue dashboards. Ahmedabad's centre-level target remains in
  -- revenue_centre_targets below — reassign it to whichever counsellor actually covers
  -- Ahmedabad, if anyone does yet.
;

ALTER TABLE revenue_annual_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read"  ON revenue_annual_targets;
DROP POLICY IF EXISTS "public write" ON revenue_annual_targets;
CREATE POLICY "public read"  ON revenue_annual_targets FOR SELECT USING (true);
CREATE POLICY "public write" ON revenue_annual_targets FOR ALL    USING (true);


-- ─────────────────────────────────────────────────────────────
-- TABLE 2: CENTRE ANNUAL TARGETS
-- (Sum of counsellor targets per centre — can be edited by admin)
-- ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS revenue_centre_targets;

CREATE TABLE revenue_centre_targets (
  period                        TEXT NOT NULL,
  centre                        TEXT NOT NULL,
  annual_course_fee_target      NUMERIC(14,2) DEFAULT 0,
  annual_course_fee_gst_target  NUMERIC(14,2) DEFAULT 0,
  notes                         TEXT DEFAULT '',
  updated_by                    TEXT DEFAULT '',
  updated_at                    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (period, centre)
);

-- Centre targets taken directly from Revenue_Centre_Targets sheet in Google Spreadsheet
INSERT INTO revenue_centre_targets
  (period, centre, annual_course_fee_target, annual_course_fee_gst_target, notes, updated_by, updated_at)
VALUES
  ('2026-27', 'Mumbai',    26500000.00, 31270000.00, 'REVISION', 'Admin', '2026-06-04T10:06:42.149Z'),
  ('2026-27', 'Delhi',     12000000.00, 14160000.00, 'REVISED',  'Admin', '2026-06-04T10:04:27.346Z'),
  ('2026-27', 'Kolkata',    6000000.00,  7080000.00, '',         'Admin', '2026-06-02T12:49:14.318Z'),
  ('2026-27', 'Surat',      3500000.00,  4130000.00, '',         'Admin', '2026-06-02T12:49:14.600Z'),
  ('2026-27', 'Chennai',    3500000.00,  4130000.00, '',         'Admin', '2026-06-02T12:49:14.872Z'),
  ('2026-27', 'Hyderabad',  3500000.00,  4130000.00, '',         'Admin', '2026-06-02T12:49:15.143Z'),
  ('2026-27', 'Bangalore',  3500000.00,  4130000.00, '',         'Admin', '2026-06-02T12:49:15.396Z'),
  ('2026-27', 'Lucknow',    2000000.00,  2360000.00, '',         'Admin', '2026-06-02T12:49:15.686Z'),
  ('2026-27', 'Ahmedabad',  2000000.00,  2360000.00, '',         'Admin', '2026-06-02T12:49:16.519Z'),
  ('2026-27', 'Jaipur',     3500000.00,  4130000.00, '',         'Admin', '2026-06-02T12:49:17.290Z')
;

ALTER TABLE revenue_centre_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read"  ON revenue_centre_targets;
DROP POLICY IF EXISTS "public write" ON revenue_centre_targets;
CREATE POLICY "public read"  ON revenue_centre_targets FOR SELECT USING (true);
CREATE POLICY "public write" ON revenue_centre_targets FOR ALL    USING (true);


-- ─────────────────────────────────────────────────────────────
-- VERIFY: Should show all 11 counsellors + 9 centres
-- ─────────────────────────────────────────────────────────────
SELECT 'counsellors' AS table_name, COUNT(*) AS rows FROM revenue_annual_targets
UNION ALL
SELECT 'centres', COUNT(*) FROM revenue_centre_targets;
