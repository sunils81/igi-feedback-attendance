-- One-time cleanup: "Arpitta" → "Arpita"
--
-- The real counsellor is registered everywhere as "Arpita" (one t), but the
-- Kolkata CRM routing rule was seeded with "Arpitta" (two t's) back in
-- migrations/003_fb_leadgen_rr.sql (now corrected in that file for any future
-- fresh install). If that migration already ran against this database, the
-- live crm_routing_rules row still has the typo and needs fixing here, and
-- any leads that were already routed under the wrong name should be
-- reassigned so they actually show up in Arpita's queue.
--
-- Safe to run more than once — every statement is a no-op if there's nothing
-- left to fix. Run this once in Supabase Dashboard → SQL Editor.
-- See: IGI Portal Suite — Data Integrity & Cross-Portal Audit, Finding 3.

-- 1. Fix the routing rule itself.
UPDATE public.crm_routing_rules
SET counselor = 'Arpita'
WHERE counselor = 'Arpitta';

-- 2. Find out how many leads (if any) were already misrouted under the typo'd
--    name, before deciding how to reassign them. Run this SELECT first and
--    review the results.
SELECT id, first_name, last_name, mobile, centre, lead_owner, created_at
FROM public.crm_leads
WHERE lead_owner = 'Arpitta'
ORDER BY created_at DESC;

-- 3. Once you've reviewed the list above, reassign them to the real account.
--    Uncomment and run:
-- UPDATE public.crm_leads SET lead_owner = 'Arpita' WHERE lead_owner = 'Arpitta';
