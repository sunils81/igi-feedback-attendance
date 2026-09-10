-- Push notification subscriptions for the Android app (and any future PWA installs).
-- One row per browser/device subscription. A user can have multiple rows if they
-- install on more than one device; we keep them all and prune dead ones when a
-- send comes back 404/410 from the push service.

create table if not exists push_subscriptions (
  id bigint generated always as identity primary key,
  portal text not null check (portal in ('student', 'counselor', 'instructor', 'admin'))  -- 'admin' added 2026-09-10 (Work dashboard),
  user_key text not null,          -- studentId (enrollment no.) / counselorName / instructorName
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_portal_user
  on push_subscriptions (portal, user_key);

alter table push_subscriptions enable row level security;
grant select, insert, update, delete on public.push_subscriptions to service_role;
-- Applied to Supabase via MCP on 2026-09-10 (the table had never actually been created;
-- VAPID_* env vars were added to Vercel the same day and the public key rotated in
-- assets/push-subscribe.js).
-- Intentionally no public policies. This table is only ever read/written by
-- server-side API routes using the Supabase service-role key, same pattern
-- as the rest of this codebase (see api/auth/verify-pin.js).
