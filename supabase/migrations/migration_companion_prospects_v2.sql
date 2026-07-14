-- ============================================================
-- Counsellor Prospects & Notes Companion — v2 additions
-- Run AFTER migration_companion_prospects_notes.sql.
-- Adds: country code on phone, course delivery mode, and a reminder toggle
-- for the Add/Edit Prospect form redesign. Purely additive — safe to re-run.
-- ============================================================

ALTER TABLE companion_prospects ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT '+91';
ALTER TABLE companion_prospects ADD COLUMN IF NOT EXISTS course_mode TEXT DEFAULT '';        -- 'Online' | 'Offline' | 'Hybrid'
ALTER TABLE companion_prospects ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_companion_prospects_reminder ON companion_prospects(next_follow_up, reminder_enabled) WHERE reminder_enabled = TRUE;
