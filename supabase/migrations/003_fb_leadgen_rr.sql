-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 003 — Run ALL of this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- STEP 1: Fix 401 errors — grant anon key access
GRANT SELECT, INSERT, UPDATE ON public.crm_leads     TO anon;
GRANT SELECT, INSERT, UPDATE ON public.crm_followups TO anon;
ALTER TABLE public.crm_leads     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_followups DISABLE ROW LEVEL SECURITY;

-- STEP 2: Add Facebook tracking columns
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS fb_leadgen_id TEXT,
  ADD COLUMN IF NOT EXISTS fb_ad_id      TEXT,
  ADD COLUMN IF NOT EXISTS fb_form_id    TEXT;

-- STEP 3: Performance indexes
CREATE INDEX IF NOT EXISTS idx_crm_leads_mobile     ON public.crm_leads(mobile);
CREATE INDEX IF NOT EXISTS idx_crm_leads_owner      ON public.crm_leads(lead_owner);
CREATE INDEX IF NOT EXISTS idx_crm_leads_stage      ON public.crm_leads(lead_stage);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created    ON public.crm_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_fb         ON public.crm_leads(fb_leadgen_id);

-- STEP 4: Round Robin state table
CREATE TABLE IF NOT EXISTS public.crm_rr_state (
  key        TEXT PRIMARY KEY,
  pointer    INT  NOT NULL DEFAULT 0,
  counselors TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.crm_rr_state TO anon;
ALTER TABLE public.crm_rr_state DISABLE ROW LEVEL SECURITY;

INSERT INTO public.crm_rr_state (key, pointer, counselors)
VALUES ('rr_mumbai', 0, '["Anuradha","Bianca","Omkar"]')
ON CONFLICT (key) DO UPDATE SET counselors = '["Anuradha","Bianca","Omkar"]';

-- STEP 5: Admin-editable routing rules table
CREATE TABLE IF NOT EXISTS public.crm_routing_rules (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location    TEXT NOT NULL UNIQUE,
  rule_type   TEXT NOT NULL DEFAULT 'direct',     -- 'direct' or 'round-robin'
  counselor   TEXT,                                -- for direct type
  counselors  TEXT,                                -- JSON array for round-robin
  is_active   BOOLEAN NOT NULL DEFAULT true,
  priority    INT NOT NULL DEFAULT 100,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_routing_rules TO anon;
ALTER TABLE public.crm_routing_rules DISABLE ROW LEVEL SECURITY;

-- Insert default routing rules
INSERT INTO public.crm_routing_rules (location, rule_type, counselor, counselors, priority) VALUES
  ('Mumbai',     'round-robin', NULL,        '["Anuradha","Bianca","Omkar"]', 10),
  ('Bangalore',  'direct',      'Nadiya',    NULL,                           20),
  ('Bengaluru',  'direct',      'Nadiya',    NULL,                           20),
  ('Kolkata',    'direct',      'Arpita',    NULL,                           20),
  ('Chennai',    'direct',      'Preethy',   NULL,                           20),
  ('Pune',       'direct',      'Bianca',    NULL,                           20),
  ('Ahmedabad',  'direct',      'Anuradha',  NULL,                           20),
  ('Lucknow',    'direct',      'Anuradha',  NULL,                           20),
  ('Jaipur',     'direct',      'Kripa',     NULL,                           20),
  ('Hyderabad',  'direct',      'Rajini',    NULL,                           20),
  ('Delhi',      'direct',      'Bianca',    NULL,                           20),
  ('_default',   'direct',      'Bianca',    NULL,                           999)
ON CONFLICT (location) DO UPDATE SET
  rule_type  = EXCLUDED.rule_type,
  counselor  = EXCLUDED.counselor,
  counselors = EXCLUDED.counselors,
  priority   = EXCLUDED.priority,
  updated_at = now();

-- STEP 6: Assignment audit log
CREATE TABLE IF NOT EXISTS public.crm_assignment_log (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id     UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  assigned_to TEXT NOT NULL,
  assigned_by TEXT NOT NULL DEFAULT 'System',
  method      TEXT NOT NULL DEFAULT 'manual',
  location    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT ON public.crm_assignment_log TO anon;
ALTER TABLE public.crm_assignment_log DISABLE ROW LEVEL SECURITY;

-- STEP 7: Activity Timeline table (notes, calls, stage changes, etc.)
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id       UUID NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL DEFAULT 'note',  -- note, call, whatsapp, email, meeting, stage_change, followup, system
  body          TEXT NOT NULL,
  actor         TEXT NOT NULL DEFAULT 'System',
  metadata      JSONB,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_crm_activities_lead ON public.crm_activities(lead_id, created_at DESC);
GRANT SELECT, INSERT ON public.crm_activities TO anon;
ALTER TABLE public.crm_activities DISABLE ROW LEVEL SECURITY;

-- STEP 8: System settings table (admin automation toggles, etc.)
CREATE TABLE IF NOT EXISTS public.crm_system_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '1',
  updated_at TIMESTAMPTZ DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.crm_system_settings TO anon;
ALTER TABLE public.crm_system_settings DISABLE ROW LEVEL SECURITY;

INSERT INTO public.crm_system_settings (key, value) VALUES
  ('fb_auto_assign',   '1'),
  ('fb_auto_followup', '1'),
  ('dedup_check',      '1')
ON CONFLICT (key) DO NOTHING;
