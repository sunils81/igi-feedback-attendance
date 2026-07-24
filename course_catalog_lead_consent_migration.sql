-- =========================================================
-- Course Catalog lead consent — DPDP Act (Digital Personal Data Protection
-- Act, 2023) consent capture for the public enquiry form on
-- course-catalog-site/index.html (igi-course-catalog.vercel.app).
--
-- Unlike student_consents (a separate append-only log for enrolled
-- students), this piggybacks directly on crm_leads: a lead is created
-- exactly once per enquiry event (see submit-course-lead/index.ts), and the
-- consent given at that moment is part of that same event — there's no
-- ongoing "current status" to track separately the way there is for a
-- student who logs in repeatedly. If a prospect re-enquires later without
-- having consented before, submit-course-lead updates these same columns
-- on their existing row (see the Edge Function change).
--
-- consent_version mirrors the same idea as student_consents: bump the
-- version string on the client if the notice text materially changes, so
-- a consent given to old wording doesn't silently count for new wording.
-- (Deliberately a different version string/namespace than the student
-- portal's CONSENT_VERSION — different text, different context.)
--
-- Run this once in Supabase SQL Editor.
-- =========================================================

ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS consent_given   BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_version TEXT,
  ADD COLUMN IF NOT EXISTS consent_at      TIMESTAMPTZ;
