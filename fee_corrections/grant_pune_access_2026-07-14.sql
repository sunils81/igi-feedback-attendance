-- Grant Anuradha, Bianca, and Omkar Kadam access to create/manage batches for Pune.
--
-- WHY this is a data change, not a code change: the "Create Batch" form's centre dropdown
-- already lists every centre (including Pune) for every counsellor with no restriction —
-- so nothing in the UI blocks them from picking Pune today. The actual gate is the `centres`
-- column on their `users` row: h_getBatches (called right after login) only returns batches
-- whose centre is in that list, and the Invoices/Students/Fees tabs filter the same way. So
-- without Pune in `centres`, a Pune batch they create would be invisible to them everywhere
-- else in their own portal right after creating it.
--
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql

-- 1. Check current values first — confirms exact names and current centres before changing
--    anything (e.g. rules out "Omkar" vs "Omkar Kadam" mismatches).
SELECT name, role, centres
FROM users
WHERE name IN ('Anuradha', 'Bianca', 'Omkar Kadam');

-- 2. Append 'Pune' to each of their centres lists — preserves whatever they already have
--    (e.g. 'Mumbai') and is safe to re-run (skips rows that already contain Pune).
UPDATE users
SET centres = CASE
    WHEN centres IS NULL OR TRIM(centres) = '' THEN 'Pune'
    ELSE TRIM(TRAILING ', ' FROM TRIM(centres)) || ', Pune'
  END
WHERE name IN ('Anuradha', 'Bianca', 'Omkar Kadam')
  AND (centres IS NULL OR position('Pune' in centres) = 0);

-- 3. Verify — each of the three should now show Pune alongside their existing centre(s).
SELECT name, role, centres
FROM users
WHERE name IN ('Anuradha', 'Bianca', 'Omkar Kadam');

-- Note: they'll need to log out and back in (or refresh) for the new centres list to take
-- effect, since it's loaded once at login into the allowedCentres session variable.
