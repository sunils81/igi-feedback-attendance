-- Revenue Annual Targets — create table + upsert all counsellors
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql

-- Step 1: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS revenue_annual_targets (
  period              TEXT NOT NULL,
  counsellor          TEXT NOT NULL,
  centre              TEXT NOT NULL,
  target_course       NUMERIC(14,2) DEFAULT 0,
  target_gst          NUMERIC(14,2) DEFAULT 0,
  notes               TEXT DEFAULT '',
  updated_by          TEXT DEFAULT '',
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (period, counsellor)
);

-- Step 2: Upsert data
INSERT INTO revenue_annual_targets
  (period, counsellor, centre, target_course, target_gst, notes, updated_by, updated_at)
VALUES
  ('2026-27','Bianca','Mumbai',6500000.0,7670000.0,'','Bianca','2026-06-02T03:54:38.506Z'),
  ('2026-27','Anuradha','Mumbai',17500000.0,20650000.0,'Other centres','Admin','2026-06-02T12:46:59.723Z'),
  ('2026-27','Rohit','Surat',3500000.0,4130000.0,'individual revenue','Admin','2026-06-03T06:26:44.221Z'),
  ('2026-27','Preethy','Chennai',3500000.0,4130000.0,'individual revenue','Admin','2026-06-03T06:26:44.593Z'),
  ('2026-27','Nadiya','Bangalore',3500000.0,4130000.0,'individual revenue','Admin','2026-06-03T06:26:44.981Z'),
  ('2026-27','Rajini','Hyderabad',3500000.0,4130000.0,'individual revenue','Admin','2026-06-03T06:26:45.320Z'),
  ('2026-27','Kripa','Jaipur',3500000.0,4130000.0,'individual revenue','Admin','2026-06-03T06:26:45.696Z'),
  ('2026-27','Omkar Kadam','Mumbai',3500000.0,4130000.0,'','Admin','2026-06-02T12:51:42.429Z'),
  ('2026-27','Sunita','Delhi',12000000.0,14160000.0,'','Admin','2026-06-02T12:51:42.755Z'),
  ('2026-27','Arpita','Kolkata',6000000.0,7080000.0,'individual revenue','Admin','2026-06-03T06:26:43.967Z'),
  ('2026-27','Arjun Mistry','Ahmedabad',500000.0,590000.0,'Rectifying negative value','Admin','2026-06-04T09:34:26.118Z')
ON CONFLICT (period, counsellor) DO UPDATE SET
  centre       = EXCLUDED.centre,
  target_course = EXCLUDED.target_course,
  target_gst   = EXCLUDED.target_gst,
  notes        = EXCLUDED.notes,
  updated_by   = EXCLUDED.updated_by,
  updated_at   = EXCLUDED.updated_at;