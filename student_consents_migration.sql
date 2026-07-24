-- =========================================================
-- Student Consents — DPDP Act (Digital Personal Data Protection Act, 2023)
-- consent log for the student portal (student.html). Append-only: every
-- grant and every withdrawal is its own row, so there's a durable,
-- timestamped record of exactly what a student consented to and when —
-- not just a single "consented: true/false" flag that could be silently
-- overwritten with no history. "Current status" for a student is the
-- most recent row by created_at (see h_getConsentStatus in shared.js).
--
-- consent_version exists so that if the notice text is ever updated,
-- bumping the version string on the client re-prompts every student —
-- a consent given to an old version of the notice doesn't silently
-- carry over to a materially different one.
--
-- Run this once in Supabase SQL Editor.
-- =========================================================

CREATE TABLE IF NOT EXISTS student_consents (
  id                BIGSERIAL PRIMARY KEY,
  student_id        TEXT        NOT NULL,
  consent_version   TEXT        NOT NULL,             -- e.g. 'dpdp-v1-2026-07'
  action            TEXT        NOT NULL DEFAULT 'granted',  -- 'granted' | 'withdrawn'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_consents_student
  ON student_consents (student_id, created_at DESC);

-- Row-level security: same permissive pattern as every other migration in this
-- app (this app calls Supabase directly from the browser with a publishable
-- key, no server-side auth layer) — read allowed for anyone, insert allowed
-- for anyone. No update/delete policy at all, on purpose — this is meant to
-- be an append-only audit log; "changing your mind" is recorded as a new
-- 'withdrawn' row, never as editing or deleting a past 'granted' row, so the
-- history itself can't be quietly rewritten later.
ALTER TABLE student_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_anon_read_student_consents" ON student_consents
  FOR SELECT USING (true);

CREATE POLICY "allow_anon_insert_student_consents" ON student_consents
  FOR INSERT WITH CHECK (true);
