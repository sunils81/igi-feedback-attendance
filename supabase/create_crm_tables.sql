-- ============================================================
-- IGI CRM Schema — SQL Migrations
-- Project: https://atbexvtrcopaagcdbpqi.supabase.co
-- Run this script in the Supabase SQL Editor
-- ============================================================

-- 1. CRM LEADS
CREATE TABLE IF NOT EXISTS crm_leads (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name     TEXT NOT NULL,
  last_name      TEXT DEFAULT '',
  email          TEXT,
  mobile         TEXT,
  course         TEXT NOT NULL,              -- e.g. 'Diamond Graduate'
  centre         TEXT NOT NULL,              -- e.g. 'Mumbai'
  lead_stage     TEXT DEFAULT 'New',         -- 'New' | 'Contacted' | 'Demo' | 'Interested' | 'Enrolled' | 'Lost'
  lead_sub_stage TEXT DEFAULT 'Unassigned',  -- Holds course name on enrollment (e.g. 'Enrolled (DG)')
  lead_owner     TEXT DEFAULT '',            -- Active Counselor Name (Primary Owner)
  lead_co_owner  TEXT DEFAULT '',            -- Originating Counselor (for cross-centre/upsell tracking)
  source         TEXT DEFAULT 'Direct',      -- 'Facebook Lead Ads' | 'Website' | 'Walk-In'
  fb_lead_id     TEXT UNIQUE,                -- Unique Facebook form identifier
  student_id     TEXT REFERENCES students(student_id), -- Linked student profile
  lead_score     INTEGER DEFAULT 0,          -- Calculated interest score
  
  -- Flexible JSONB for website fields (vat_gst_number, gemology_location, reference_id, product_name, etc.)
  web_meta       JSONB DEFAULT '{}',
  
  notes          TEXT DEFAULT '',
  lead_remark    TEXT DEFAULT '',            -- Short last-remark visible in table (< 120 chars)
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ALTER TABLE for existing deployments (idempotent)
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS lead_remark TEXT DEFAULT '';

-- Strict deduplication indices
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_leads_email ON crm_leads(email) WHERE email IS NOT NULL AND email != '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_leads_mobile ON crm_leads(mobile) WHERE mobile IS NOT NULL AND mobile != '';
CREATE INDEX IF NOT EXISTS idx_crm_leads_score ON crm_leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_stage ON crm_leads(lead_owner, lead_stage);

-- 2. LEAD FOLLOW-UPS (CALL REMINDERS)
CREATE TABLE IF NOT EXISTS crm_followups (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id        UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  reminder_date  TIMESTAMPTZ NOT NULL,
  note           TEXT,
  status         TEXT DEFAULT 'Pending',     -- 'Pending' | 'Completed' | 'Snoozed'
  snoozed_until  TIMESTAMPTZ,               -- When snoozed, the new wake-up time
  created_by     TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ALTER TABLE for existing deployments (idempotent)
ALTER TABLE crm_followups ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_crm_followups_lead ON crm_followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_followups_pending ON crm_followups(reminder_date) WHERE status = 'Pending';
CREATE INDEX IF NOT EXISTS idx_crm_followups_snoozed ON crm_followups(snoozed_until) WHERE status = 'Snoozed';
CREATE INDEX IF NOT EXISTS idx_crm_leads_remark ON crm_leads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_owner_stage ON crm_leads(lead_owner, lead_stage, updated_at DESC);

-- 3. COUNSELOR WEIGHTS FOR ROUND-ROBIN
CREATE TABLE IF NOT EXISTS crm_assignment_rules (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  counselor_name TEXT NOT NULL UNIQUE,       -- Match name in users table
  centre         TEXT NOT NULL,
  crm_weight     INTEGER DEFAULT 100,        -- 100 = 1x, 200 = 2x, 0 = Disabled
  is_active      BOOLEAN DEFAULT TRUE,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers for automatic updated_at timestamp
CREATE TRIGGER crm_leads_updated_at BEFORE UPDATE ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER crm_assignment_rules_updated_at BEFORE UPDATE ON crm_assignment_rules
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Add default rules for active counselors based on current users
-- (Admin can modify these weights in the admin portal settings)
INSERT INTO crm_assignment_rules (counselor_name, centre, crm_weight, is_active)
VALUES 
  ('Anuradha', 'Mumbai', 100, true),
  ('Bianca', 'Mumbai', 100, true),
  ('Omkar Kadam', 'Mumbai', 100, true),
  ('Sunita', 'Delhi', 100, true),
  ('Arpita', 'Kolkata', 100, true),
  ('Rohit', 'Surat', 100, true),
  ('Preethy', 'Chennai', 100, true),
  ('Nadiya', 'Bangalore', 100, true),
  ('Rajini', 'Hyderabad', 100, true),
  ('Kripa', 'Jaipur', 100, true)
ON CONFLICT (counselor_name) DO UPDATE 
SET centre = EXCLUDED.centre,
    crm_weight = COALESCE(crm_assignment_rules.crm_weight, EXCLUDED.crm_weight),
    is_active = COALESCE(crm_assignment_rules.is_active, EXCLUDED.is_active);

-- Extra lead fields added for Meritto-parity (idempotent)
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS alt_mobile TEXT DEFAULT '';
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS book_my_slot TEXT DEFAULT '';        -- e.g. 'Morning (9 AM – 12 PM)'
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS when_to_join TEXT DEFAULT '';        -- e.g. 'Within 1 Month'
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS current_profession TEXT DEFAULT '';  -- e.g. 'Diamond Trader'

CREATE INDEX IF NOT EXISTS idx_crm_leads_jointime ON crm_leads(when_to_join) WHERE when_to_join != '';
