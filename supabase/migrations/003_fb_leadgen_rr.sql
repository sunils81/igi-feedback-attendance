-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 003 — Facebook Lead Ads + Round Robin State
-- Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Fix permissions (anon key access for existing CRM tables)
GRANT SELECT, INSERT, UPDATE ON public.crm_leads TO anon;
GRANT SELECT, INSERT, UPDATE ON public.crm_followups TO anon;

-- 2. Add Facebook lead tracking columns to crm_leads
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS fb_leadgen_id TEXT,
  ADD COLUMN IF NOT EXISTS fb_ad_id      TEXT,
  ADD COLUMN IF NOT EXISTS fb_form_id    TEXT;

-- Index for dedup checks
CREATE INDEX IF NOT EXISTS idx_crm_leads_mobile     ON public.crm_leads(mobile);
CREATE INDEX IF NOT EXISTS idx_crm_leads_fb_leadgen ON public.crm_leads(fb_leadgen_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_owner      ON public.crm_leads(lead_owner);
CREATE INDEX IF NOT EXISTS idx_crm_leads_stage      ON public.crm_leads(lead_stage);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created    ON public.crm_leads(created_at DESC);

-- 3. Round Robin state table
CREATE TABLE IF NOT EXISTS public.crm_rr_state (
  key         TEXT PRIMARY KEY,      -- e.g. "rr_mumbai"
  pointer     INT  NOT NULL DEFAULT 0,
  counselors  TEXT NOT NULL,         -- JSON array of counselor names
  updated_at  TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.crm_rr_state TO anon;

-- Insert initial Mumbai round-robin state
INSERT INTO public.crm_rr_state (key, pointer, counselors)
VALUES ('rr_mumbai', 0, '["Bianca","Nadiya","Rajini"]')
ON CONFLICT (key) DO NOTHING;

-- 4. Assignment log (audit trail)
CREATE TABLE IF NOT EXISTS public.crm_assignment_log (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id      UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  assigned_to  TEXT NOT NULL,
  assigned_by  TEXT NOT NULL DEFAULT 'System',
  method       TEXT NOT NULL DEFAULT 'manual',  -- 'fb-auto', 'round-robin', 'manual', 'bulk'
  location     TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT ON public.crm_assignment_log TO anon;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERCEL ENV VARS — add these in Vercel Dashboard → Settings → Environment Variables
-- ═══════════════════════════════════════════════════════════════════════════
-- FB_VERIFY_TOKEN       = "igi-crm-webhook"        (any secret string you choose)
-- FB_PAGE_ACCESS_TOKEN  = <your FB Page long-lived token from Meta Business Suite>
-- FB_APP_SECRET         = <your FB App Secret from Meta Developers → App Settings>
-- SUPABASE_URL          = https://atbexvtrcopaagcdbpqi.supabase.co
-- SUPABASE_SERVICE_ROLE_KEY = <service role key from Supabase → Settings → API>

-- ═══════════════════════════════════════════════════════════════════════════
-- FACEBOOK WEBHOOK SETUP STEPS
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Go to Meta Business Suite (business.facebook.com)
-- 2. Settings → Leads Access → Lead Ads → Webhooks
-- 3. Add webhook:
--    Callback URL: https://igi-feedback-attendance.vercel.app/api/crm/fb-webhook
--    Verify Token: igi-crm-webhook
--    Subscriptions: leadgen
-- 4. Select your IGI Facebook Page and subscribe to lead events
-- ═══════════════════════════════════════════════════════════════════════════
