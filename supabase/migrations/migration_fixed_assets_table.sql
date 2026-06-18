-- Migration: Create fixed_assets table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS fixed_assets (
  id           BIGSERIAL PRIMARY KEY,
  centre       TEXT NOT NULL,
  asset_name   TEXT NOT NULL,
  condition    TEXT NOT NULL DEFAULT 'Good',
  notes        TEXT DEFAULT '',
  updated_at   DATE,
  updated_by   TEXT DEFAULT '',
  UNIQUE (centre, asset_name)
);

-- Enable RLS (optional but recommended)
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;

-- Allow read/write with publishable key (anon role)
CREATE POLICY IF NOT EXISTS "allow_all_fixed_assets"
  ON fixed_assets
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
