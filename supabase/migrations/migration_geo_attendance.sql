-- Geo-based attendance columns (Mumbai pilot)
-- Run in Supabase SQL editor

ALTER TABLE attendance_feedback
  ADD COLUMN IF NOT EXISTS geo_status      TEXT,        -- 'at_centre' | 'outside_range' | 'not_shared'
  ADD COLUMN IF NOT EXISTS geo_distance_m  NUMERIC,     -- distance to nearest centre in metres
  ADD COLUMN IF NOT EXISTS geo_accuracy_m  NUMERIC;     -- GPS accuracy radius reported by device

-- Optional index for reporting queries filtering by geo_status
CREATE INDEX IF NOT EXISTS idx_att_geo_status ON attendance_feedback (geo_status);
