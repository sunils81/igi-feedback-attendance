-- One-time setup for the "upload receipt/invoice" feature on the Fee Setup form.
-- counselor.html uploads directly to this bucket using the same anon key already used
-- everywhere else in the app (no new credentials needed).
--
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql

-- 1. Create the bucket (public read, so counsellors/admins can open a receipt link
--    directly — same visibility level as everything else in this app, which has no
--    per-user access control beyond the counsellor login itself).
insert into storage.buckets (id, name, public)
values ('fee-receipts', 'fee-receipts', true)
on conflict (id) do nothing;

-- 2. Allow the anon key to upload (INSERT) and read (SELECT) files in this bucket.
--    Matches the same trust model as every other table in this app, which the anon key
--    already reads/writes freely — this is not introducing a new security posture, just
--    extending the existing one to Storage.
--    Postgres has no "CREATE POLICY IF NOT EXISTS" — dropping first makes this safe to
--    re-run (the earlier version of this script used syntax that doesn't exist; this is
--    the corrected version).
drop policy if exists "fee-receipts anon upload" on storage.objects;
create policy "fee-receipts anon upload"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'fee-receipts');

drop policy if exists "fee-receipts anon read" on storage.objects;
create policy "fee-receipts anon read"
  on storage.objects for select
  to anon
  using (bucket_id = 'fee-receipts');
