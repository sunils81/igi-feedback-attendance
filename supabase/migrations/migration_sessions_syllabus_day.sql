-- Adds explicit syllabus-day tracking to sessions, so "which topics are
-- already covered" is recorded as a fact on each row instead of being
-- inferred from the count of past sessions for the batch.
--
-- Why: the old logic assumed "session N covers syllabus day N" for every
-- non-cancelled session, in order. Any session with a non-syllabus topic
-- (factory visit, holiday makeup, review day, an instructor-typed custom
-- description, etc.) still consumed a slot in that count, silently pushing
-- the "next topic" pointer ahead of what was actually taught — the real
-- topic for that skipped day would then show as "(already covered)" even
-- though nobody covered it. See the 2026-07-20 report from Sneha Garodia
-- (Manual + Digital Jewelry Designing batches) for a concrete instance.
--
-- With this column: syllabus_day is set only when a session's topic is an
-- exact match for one of the course's predefined syllabus topics (i.e. the
-- instructor picked it from the dropdown, or the auto-creation cron filled
-- it in untouched). A session with a custom/off-syllabus topic leaves this
-- null and does not consume a day. "Next topic" becomes: the lowest-numbered
-- syllabus day with no non-cancelled session recording it yet — correct
-- regardless of order, holidays, or how many custom sessions happen along
-- the way.
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor) for the
-- igi-feedback-attendance project. After running it, run the one-time
-- backfill script (backfill_syllabus_day.cjs) to populate this column for
-- existing session rows — otherwise every batch's history will look "empty"
-- (nothing covered yet) until new sessions are created going forward.

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS syllabus_day integer;

COMMENT ON COLUMN public.sessions.syllabus_day IS
  'Which syllabus day (1-based, matches the course syllabus array) this session actually covered, if any. Null = custom/off-syllabus topic (factory visit, makeup review, etc.) that should not advance syllabus progression.';
