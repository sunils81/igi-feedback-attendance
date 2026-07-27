-- Fix: cross-centre ("Other Centre Revenue") sales silently disappearing from the
-- counsellor portal — reported live for Anuradha on 2026-07-27 (entered a cross-sell
-- enrollment at another centre, Revenue tab still said "No cross-centre enrollments yet
-- this month").
--
-- Root cause (code bug, fixed alongside this script in assets/shared.js
-- syncStudentRevenue): assigned_centre was computed as "the delivery centre, unless it's
-- outside the counsellor's home centre(s), in which case fall back to their first home
-- centre" — where "home centre(s)" meant `users.centres`, the ACCESS list (which centres
-- they're allowed to create batches/see data for). But `centres` also includes centres
-- granted purely so a counsellor CAN cross-sell there — see grant_pune_access_2026-07-14.sql,
-- which added Pune to Anuradha's (and Bianca's, Omkar Kadam's) `centres` alongside their
-- real home centre. Once Pune was in that list, a genuine Pune sale by one of them got
-- written with assigned_centre='Pune' instead of their real designated centre — and since
-- the portal only ever renders ONE own-centre card per counsellor, keyed to
-- designatedCentre = allowedCentres[0] (their FIRST centre), that row matched neither the
-- Own nor the Other Centre section of their real card. It just vanished from the UI,
-- even though the underlying student_fees / fee record was saved correctly.
--
-- The code fix changes assigned_centre to always be the counsellor's first/designated
-- centre (matching the portal's own designatedCentre logic), regardless of what else is in
-- their access list. This script corrects the auto-derived revenue_monthly_achieved rows
-- that were already written under the old, buggy logic, so they show up immediately
-- instead of waiting for the next fee record save/delete to re-trigger syncStudentRevenue.
--
-- Safe to run: only touches rows with notes LIKE 'auto-derived%' (never hand-entered/
-- Legacy Manual rows), and only updates assigned_centre — business_centre, fees, and
-- student_count are untouched. assigned_centre isn't part of the
-- (month,period,counsellor,business_centre,business_type) uniqueness key used elsewhere,
-- so this is a plain UPDATE with no collision risk.
--
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql

-- 1. Read-only: every auto-derived row currently misattributed as "Own Centre" for a
--    counsellor with 2+ centres in their access list, where the delivery centre (business_
--    centre) isn't actually their FIRST/designated centre. These are the orphaned rows —
--    they won't appear anywhere in the portal today.
SELECT rma.month, rma.counsellor, rma.assigned_centre AS current_assigned_centre,
       rma.business_centre, u.centres AS access_centres,
       trim(split_part(u.centres, ',', 1)) AS designated_centre,
       rma.student_count, rma.achieved_course_fee, rma.notes
FROM revenue_monthly_achieved rma
JOIN users u ON u.name = rma.counsellor
WHERE rma.business_type = 'Centre Revenue'
  AND rma.notes LIKE 'auto-derived%'
  AND position(',' in u.centres) > 0                              -- only multi-centre-access counsellors can hit this bug
  AND rma.assigned_centre = rma.business_centre                    -- currently filed as "own centre"
  AND rma.business_centre <> trim(split_part(u.centres, ',', 1))   -- but delivery centre isn't actually their designated centre
ORDER BY rma.counsellor, rma.month;

-- 2. The fix — re-point assigned_centre to each counsellor's designated (first) centre for
--    exactly the rows identified above, so they immediately reappear as "Other Centre
--    Revenue" on the right month card.
UPDATE revenue_monthly_achieved rma
SET assigned_centre = trim(split_part(u.centres, ',', 1)),
    updated_at = now()
FROM users u
WHERE u.name = rma.counsellor
  AND rma.business_type = 'Centre Revenue'
  AND rma.notes LIKE 'auto-derived%'
  AND position(',' in u.centres) > 0
  AND rma.assigned_centre = rma.business_centre
  AND rma.business_centre <> trim(split_part(u.centres, ',', 1));

-- 3. Verify — re-run query 1's SELECT; it should now return zero rows.
