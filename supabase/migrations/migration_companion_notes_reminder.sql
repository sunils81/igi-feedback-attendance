-- ============================================================
-- My Notebook — one-time note reminders
-- Adds an optional reminder timestamp to companion_notes so a note in the
-- counsellor's private notebook (My Notebook tab) can pop a reminder at a
-- chosen date/time. Safe to re-run (idempotent ADD COLUMN IF NOT EXISTS).
-- ============================================================

ALTER TABLE companion_notes ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_companion_notes_reminder
  ON companion_notes(reminder_at)
  WHERE reminder_at IS NOT NULL;
