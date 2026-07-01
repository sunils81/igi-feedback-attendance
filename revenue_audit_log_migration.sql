-- =========================================================
-- Option C: Revenue Audit Log
-- Run this once in Supabase SQL Editor
-- =========================================================

CREATE TABLE IF NOT EXISTS revenue_audit_log (
  id                  BIGSERIAL PRIMARY KEY,
  changed_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_by          TEXT        NOT NULL DEFAULT '',

  -- Which row was touched
  month               TEXT        NOT NULL,
  period              TEXT        NOT NULL DEFAULT '2026-27',
  counsellor          TEXT        NOT NULL,
  business_centre     TEXT        NOT NULL,
  business_type       TEXT        NOT NULL,

  action              TEXT        NOT NULL DEFAULT 'upsert',  -- 'upsert' | 'lock' | 'delete'

  -- Before values (NULL on first insert)
  old_fee             NUMERIC,
  old_fee_gst         NUMERIC,
  old_student_count   INT,
  old_notes           TEXT,
  old_locked          BOOLEAN,

  -- After values
  new_fee             NUMERIC,
  new_fee_gst         NUMERIC,
  new_student_count   INT,
  new_notes           TEXT,
  new_locked          BOOLEAN
);

-- Fast lookups by time (used in getRecentActivity)
CREATE INDEX IF NOT EXISTS idx_revenue_audit_log_changed_at
  ON revenue_audit_log (changed_at DESC);

-- Fast lookups by counsellor
CREATE INDEX IF NOT EXISTS idx_revenue_audit_log_counsellor
  ON revenue_audit_log (counsellor, changed_at DESC);

-- Row-level security: read allowed for authenticated users, write via service key only
-- (Adjust to your Supabase RLS policy pattern)
ALTER TABLE revenue_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_anon_read_audit" ON revenue_audit_log
  FOR SELECT USING (true);

CREATE POLICY "allow_anon_insert_audit" ON revenue_audit_log
  FOR INSERT WITH CHECK (true);
