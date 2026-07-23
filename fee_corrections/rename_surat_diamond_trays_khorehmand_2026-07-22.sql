-- Replace Surat's 7 generic "bulk seeded" Diamond tray records (Master Set, Regular
-- Inventory 1/2, Fancy Shapes, Imitation, Weekly Test, Final Test — the same placeholder
-- template every centre got at seed time) with instructor Khorehmand Kasad's actual 8
-- tray contents, as given directly by him.
--
-- Verified before writing this: none of the 7 tray_ids below (SUR-DM-MS, SUR-DM-RI1,
-- SUR-DM-RI2, SUR-DM-FS, SUR-DM-IM, SUR-DM-WT, SUR-DM-FT) have any rows in tray_bookings
-- or tray_history, so deleting and replacing them is safe — nothing references these IDs.
--
-- New tray_ids follow the same sequential "<CENTRE>-DM-T##" convention already used at
-- Mumbai (MUM-DM-T01..T15), instead of reusing the old MS/RI1/RI2/... codes, since the
-- content no longer matches those labels.
--
-- Run once in the Supabase SQL Editor (or via `psql`) for this project.

BEGIN;

DELETE FROM tray_registry
WHERE home_centre = 'Surat'
  AND category = 'DM'
  AND tray_id IN ('SUR-DM-MS', 'SUR-DM-RI1', 'SUR-DM-RI2', 'SUR-DM-FS', 'SUR-DM-IM', 'SUR-DM-WT', 'SUR-DM-FT');

INSERT INTO tray_registry
  (tray_id, category, topic_code, topic_name, home_centre, home_instructor, stone_count, week_usage, location_status, current_centre, registered_at, notes)
VALUES
  ('SUR-DM-T01', 'DM', 'RBC1',   'RBC Stones No. SA-01 to SA-10',                      'Surat', 'Khorehmand Kasad', 10, NULL, 'UNCONFIRMED', 'Surat', now(), 'Set by instructor Khorehmand Kasad, 2026-07-22'),
  ('SUR-DM-T02', 'DM', 'RBC2',   'RBC Stones No. SA-11 to SA-20',                      'Surat', 'Khorehmand Kasad', 10, NULL, 'UNCONFIRMED', 'Surat', now(), 'Set by instructor Khorehmand Kasad, 2026-07-22'),
  ('SUR-DM-T03', 'DM', 'RBC3',   'RBC Stones No. SA-21 to SA-30',                      'Surat', 'Khorehmand Kasad', 10, NULL, 'UNCONFIRMED', 'Surat', now(), 'Set by instructor Khorehmand Kasad, 2026-07-22'),
  ('SUR-DM-T04', 'DM', 'RBC4',   'RBC Stones No. SA-31 to SA-40',                      'Surat', 'Khorehmand Kasad', 10, NULL, 'UNCONFIRMED', 'Surat', now(), 'Set by instructor Khorehmand Kasad, 2026-07-22'),
  ('SUR-DM-T05', 'DM', 'CM',     'Color Masters SA-E to SA-L',                         'Surat', 'Khorehmand Kasad', 8,  NULL, 'UNCONFIRMED', 'Surat', now(), 'Set by instructor Khorehmand Kasad, 2026-07-22'),
  ('SUR-DM-T06', 'DM', 'RBCEX',  'RBC Exam Stones No. SA-41 to SA-44, 6 Imitations',   'Surat', 'Khorehmand Kasad', 10, NULL, 'UNCONFIRMED', 'Surat', now(), 'Set by instructor Khorehmand Kasad, 2026-07-22'),
  ('SUR-DM-T07', 'DM', 'FSS',    'Fancy Shape Stones No. SA-F1 to SA-F8, I3 & FF',     'Surat', 'Khorehmand Kasad', 10, NULL, 'UNCONFIRMED', 'Surat', now(), 'Set by instructor Khorehmand Kasad, 2026-07-22'),
  ('SUR-DM-T08', 'DM', 'ASB',    'Assortment Stones Box No. SS-01 to SS-10',           'Surat', 'Khorehmand Kasad', 10, NULL, 'UNCONFIRMED', 'Surat', now(), 'Set by instructor Khorehmand Kasad, 2026-07-22');

COMMIT;
