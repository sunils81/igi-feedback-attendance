-- ============================================================
-- Tray Hub — complete the Supabase migration
-- tray_registry, tray_history, tray_notifications already exist
-- (created by create_tables.sql). This adds the two tables that
-- were missing (tray_bookings, tray_weekly_needs) plus one column
-- that was missing from tray_registry (borrower_instructor).
--
-- Safe to run multiple times — every statement is idempotent.
-- Run in Supabase SQL Editor.
-- ============================================================

-- ── Missing column on the existing tray_registry table ───────────────────────
ALTER TABLE public.tray_registry
  ADD COLUMN IF NOT EXISTS borrower_instructor TEXT;

-- ── Tray Bookings (a centre's request to borrow another centre's tray) ───────
CREATE TABLE IF NOT EXISTS public.tray_bookings (
  booking_id             TEXT PRIMARY KEY,
  tray_id                TEXT,
  home_centre            TEXT,
  requesting_instructor  TEXT,
  requesting_centre      TEXT,
  weeks_booked           INTEGER,
  start_date             DATE,
  deadline_date          DATE,
  status                 TEXT,        -- pending | active | returning | returned | rejected | overdue
  stone_count_on_return  INTEGER,
  reject_reason          TEXT,
  created_at             TIMESTAMPTZ,
  updated_at             TIMESTAMPTZ,
  batch_code             TEXT
);
CREATE INDEX IF NOT EXISTS idx_tray_bookings_tray_id ON public.tray_bookings (tray_id);
CREATE INDEX IF NOT EXISTS idx_tray_bookings_status  ON public.tray_bookings (status);

-- ── Tray Weekly Needs (one row per instructor — their weekly tray target) ────
CREATE TABLE IF NOT EXISTS public.tray_weekly_needs (
  instructor              TEXT PRIMARY KEY,
  centre                  TEXT,
  trays_needed_per_week   INTEGER,
  updated_at              TIMESTAMPTZ
);

-- ── RLS: enable + allow anon full access (same pattern as create_tables.sql) ──
ALTER TABLE public.tray_bookings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tray_weekly_needs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['tray_bookings','tray_weekly_needs'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "anon_all_%s" ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY "anon_all_%s" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- OPTIONAL — clean slate re-seed
-- If tray_registry / tray_history / tray_notifications already have stale or
-- test rows from before this cutover and you'd rather start fresh (per your
-- call to skip migrating the old Google Sheet data), uncomment and run this
-- block ONCE, then re-seed via the Admin Portal → Tray Hub → "Seed All Trays"
-- button (calls the trayBulkSeed action, now Supabase-backed).
-- ============================================================
-- TRUNCATE public.tray_history, public.tray_notifications, public.tray_bookings;
-- DELETE FROM public.tray_registry;
