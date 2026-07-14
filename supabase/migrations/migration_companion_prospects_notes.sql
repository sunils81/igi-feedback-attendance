-- ============================================================
-- Counsellor Prospects & Notes Companion — SQL Migration
-- Independent of crm_leads / crm_followups (Meritto-parity CRM).
-- Run this in the Supabase SQL Editor for project atbexvtrcopaagcdbpqi.
-- Safe to re-run (idempotent CREATE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- ============================================================

-- 1. PROSPECTS (tentative / lukewarm leads that don't fit the crm_leads pipeline)
CREATE TABLE IF NOT EXISTS companion_prospects (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  phone               TEXT DEFAULT '',           -- normalized (digits only, no spaces/dashes)
  phone_raw           TEXT DEFAULT '',           -- as typed, for display
  email               TEXT DEFAULT '',           -- normalized (trimmed, lower-cased)
  course_interest     JSONB DEFAULT '[]',        -- array of course names
  temperature         TEXT DEFAULT 'Warm',       -- 'Hot' | 'Warm' | 'Cold'
  concern_tags        JSONB DEFAULT '[]',        -- array from fixed set (Fee, Location, Timing/Intake, Comparing Options, Parental Consent, Eligibility)
  concern_note        TEXT DEFAULT '',
  status              TEXT DEFAULT 'Active',     -- 'Active' | 'Snoozed' | 'Nurture' | 'Converted-Partial' | 'Converted-Full' | 'Lost'
  intake_cycle        TEXT DEFAULT '',           -- e.g. 'Spring 2027' — used for Nurture bucket
  next_follow_up      DATE,
  last_contacted      DATE,
  centre              TEXT DEFAULT '',
  owner_counselor     TEXT NOT NULL,             -- set on first claim; used for dedup/ownership
  fee_entries         JSONB DEFAULT '[]',        -- [{amount, date, type:'token'|'full'}] — drives auto-conversion
  archived_at         TIMESTAMPTZ,               -- soft-archive (e.g. Lost prospects after retention window)
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companion_prospects_phone ON companion_prospects(phone) WHERE phone != '';
CREATE INDEX IF NOT EXISTS idx_companion_prospects_email ON companion_prospects(email) WHERE email != '';
CREATE INDEX IF NOT EXISTS idx_companion_prospects_owner ON companion_prospects(owner_counselor, status);
CREATE INDEX IF NOT EXISTS idx_companion_prospects_followup ON companion_prospects(next_follow_up) WHERE status = 'Active';
CREATE INDEX IF NOT EXISTS idx_companion_prospects_lastcontact ON companion_prospects(last_contacted);

-- 2. NOTES (private, quick-capture, optionally linked to a prospect)
CREATE TABLE IF NOT EXISTS companion_notes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text                TEXT NOT NULL,
  linked_prospect_id  UUID REFERENCES companion_prospects(id) ON DELETE SET NULL,
  pinned              BOOLEAN DEFAULT FALSE,
  owner_counselor     TEXT NOT NULL,             -- private to this counsellor — never exposed org-wide, incl. admin
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companion_notes_owner ON companion_notes(owner_counselor, pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companion_notes_prospect ON companion_notes(linked_prospect_id);

-- 3. DUPLICATE-CLAIM CONFLICTS (feeds the admin Conflict Queue)
CREATE TABLE IF NOT EXISTS companion_conflicts (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id         UUID REFERENCES companion_prospects(id) ON DELETE CASCADE,
  existing_owner      TEXT NOT NULL,
  claimant_counselor  TEXT NOT NULL,
  match_type          TEXT DEFAULT 'phone',      -- 'phone' | 'email' | 'name'
  claimant_payload    JSONB DEFAULT '{}',        -- the record the claimant tried to add (kept for reference/merge)
  source              TEXT DEFAULT 'manual',     -- 'manual' | 'csv_import'
  resolution          TEXT DEFAULT 'pending',    -- 'pending' | 'view_only' | 'transfer_requested' | 'transferred' | 'shared' | 'dismissed'
  resolved_by         TEXT DEFAULT '',
  resolved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companion_conflicts_pending ON companion_conflicts(resolution, created_at DESC) WHERE resolution = 'pending';
CREATE INDEX IF NOT EXISTS idx_companion_conflicts_prospect ON companion_conflicts(prospect_id);

-- Triggers for automatic updated_at timestamp (reuses set_updated_at() already defined by crm_leads migration)
DROP TRIGGER IF EXISTS companion_prospects_updated_at ON companion_prospects;
CREATE TRIGGER companion_prospects_updated_at BEFORE UPDATE ON companion_prospects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS companion_notes_updated_at ON companion_notes;
CREATE TRIGGER companion_notes_updated_at BEFORE UPDATE ON companion_notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
