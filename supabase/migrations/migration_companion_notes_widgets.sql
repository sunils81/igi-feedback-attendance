-- ============================================================
-- My Notebook — Today's Focus widgets (5 Things To Do Today,
-- Weekly Goal, Monthly Goal)
-- Reuses companion_notes instead of new tables: each widget is just a note
-- tagged with a note_type + period_key, one row per counsellor per period.
-- Safe to re-run (idempotent ADD COLUMN IF NOT EXISTS).
-- ============================================================

ALTER TABLE companion_notes ADD COLUMN IF NOT EXISTS note_type TEXT NOT NULL DEFAULT 'note';
ALTER TABLE companion_notes ADD COLUMN IF NOT EXISTS period_key TEXT;

-- note_type: 'note' (regular notebook entry, the default — untouched by this feature)
--          | 'daily_todo'    period_key = 'YYYY-MM-DD'  (5 Things To Do Today)
--          | 'weekly_goal'   period_key = 'YYYY-Www'     (Weekly Goal checklist)
--          | 'monthly_goal'  period_key = 'YYYY-MM'      (Monthly Goal checklist)

-- Exactly one widget row per counsellor per type per period.
CREATE UNIQUE INDEX IF NOT EXISTS idx_companion_notes_widget_unique
  ON companion_notes(owner_counselor, note_type, period_key)
  WHERE note_type <> 'note';

CREATE INDEX IF NOT EXISTS idx_companion_notes_type
  ON companion_notes(owner_counselor, note_type, period_key);
