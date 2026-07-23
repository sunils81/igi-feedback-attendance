-- =========================================================
-- Referral Nudge Actions — persists "already asked" / "dismissed" for the
-- alumni referral nudge banner (counselor.html), so it stops reappearing
-- across devices/browsers instead of just being remembered in one
-- browser's localStorage.
-- Run this once in Supabase SQL Editor.
-- =========================================================

CREATE TABLE IF NOT EXISTS referral_nudge_actions (
  id            BIGSERIAL PRIMARY KEY,
  student_id    TEXT        NOT NULL,
  milestone     INT         NOT NULL,             -- 15 | 45 | 60
  counsellor    TEXT        NOT NULL DEFAULT '',   -- who actioned it
  action        TEXT        NOT NULL DEFAULT 'dismissed',  -- 'dismissed' | 'whatsapp_sent'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One outcome per (student, milestone) — whichever counsellor acts on it
  -- first "uses up" that milestone for everyone, same reasoning as the
  -- centre-scoping on h_getReferralNudges itself (any counsellor at that
  -- centre can reasonably act on it).
  UNIQUE (student_id, milestone)
);

CREATE INDEX IF NOT EXISTS idx_referral_nudge_actions_student
  ON referral_nudge_actions (student_id, milestone);

-- Row-level security: same permissive pattern as revenue_audit_log_migration.sql
-- (this app calls Supabase directly from the browser with a publishable key,
-- no server-side auth layer) — read allowed for anyone, insert allowed for anyone.
ALTER TABLE referral_nudge_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_anon_read_referral_nudge_actions" ON referral_nudge_actions
  FOR SELECT USING (true);

CREATE POLICY "allow_anon_insert_referral_nudge_actions" ON referral_nudge_actions
  FOR INSERT WITH CHECK (true);
