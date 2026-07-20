-- Audit trail for instructor-initiated corrections to a session's topic.
--
-- Context: sessions.syllabus_day (see migration_sessions_syllabus_day.sql) is
-- now the source of truth for syllabus progression, and it's derived from
-- each session's topic text. The one-time backfill of existing rows
-- (backfill_syllabus_day.cjs) surfaced real historical drift — e.g. several
-- batches had the exact same topic text saved across many different session
-- dates, left over from an older "frozen progression" bug. Instructors need
-- a way to go back and fix a past session's topic (previously only today's
-- live session could be overridden), and since that now actively changes
-- progression tracking, every correction is logged here: what it was, what
-- it became, and who made the change.
--
-- Every time h_updateSessionTopic (assets/shared.js) changes a session's
-- topic, it writes one row here. Writing to this table is best-effort and
-- never blocks or fails the actual topic update if the insert itself fails.

create table if not exists session_topic_corrections (
  id                bigint generated always as identity primary key,
  session_code      text not null,
  batch_code        text,
  old_topic         text,
  new_topic         text,
  old_syllabus_day  integer,
  new_syllabus_day  integer,
  corrected_by      text,
  corrected_at      timestamptz not null default now()
);

create index if not exists idx_session_topic_corrections_session_code
  on session_topic_corrections (session_code);
create index if not exists idx_session_topic_corrections_batch_code
  on session_topic_corrections (batch_code);

-- Same anon-all access pattern as the rest of the app's tables (see
-- supabase/enable_policies.sql) — this app writes directly from the client
-- with the publishable key, no separate backend.
alter table session_topic_corrections enable row level security;

drop policy if exists "anon_all_session_topic_corrections" on session_topic_corrections;
create policy "anon_all_session_topic_corrections" on session_topic_corrections
  for all to anon using (true) with check (true);

grant select, insert on session_topic_corrections to anon;
