-- Audit trail for break-glass "master pin" logins.
--
-- Context: assets/shared.js used to contain a hardcoded literal
-- ('IGIMaster2026') that let anyone who read the client-side JS log in as any
-- registered user. That check now lives server-side in api/auth/verify-pin.js
-- and reads the real secret from a Vercel environment variable
-- (MASTER_BREAKGLASS_PIN) instead. This table gives visibility into how often
-- that override is actually used, and by/as whom, after the fact.
--
-- Every time someone successfully logs in using the master override pin
-- (instead of a real per-user password), api/auth/verify-pin.js writes one row
-- here: the name they were accessing, when, and from where. Writing to this
-- table is best-effort from the server (service-role key) and never blocks or
-- fails a legitimate login if the insert itself fails.
--
-- See: IGI Portal Suite — Data Integrity & Cross-Portal Audit, Finding 1.

create table if not exists admin_override_log (
  id           bigint generated always as identity primary key,
  accessed_name text,        -- the name that was logged into via the master pin
  ip           text,
  user_agent   text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_admin_override_log_created_at
  on admin_override_log (created_at desc);

-- No anon/public access whatsoever. This table is only ever written by the
-- service-role key from api/auth/verify-pin.js (which bypasses RLS), and is
-- only meant to be read by an admin querying Supabase directly (SQL editor or
-- table view) — not by any client-side portal code.
alter table admin_override_log enable row level security;
