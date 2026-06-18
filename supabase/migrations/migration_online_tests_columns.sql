-- Migration: Add missing columns to online_tests table
-- Run this in Supabase SQL Editor

ALTER TABLE online_tests
  ADD COLUMN IF NOT EXISTS batch_codes       TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS test_type         TEXT DEFAULT 'Weekly',
  ADD COLUMN IF NOT EXISTS neg_marking       TEXT DEFAULT 'No',
  ADD COLUMN IF NOT EXISTS neg_mark_value    NUMERIC(4,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS passing_score     NUMERIC(5,2) DEFAULT 60,
  ADD COLUMN IF NOT EXISTS instructions      TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS results_released  TEXT DEFAULT 'No',
  ADD COLUMN IF NOT EXISTS results_mode      TEXT DEFAULT 'summary',
  ADD COLUMN IF NOT EXISTS target_students   TEXT DEFAULT 'ALL',
  ADD COLUMN IF NOT EXISTS shuffle_questions TEXT DEFAULT 'No',
  ADD COLUMN IF NOT EXISTS allow_retake      TEXT DEFAULT 'No',
  ADD COLUMN IF NOT EXISTS expiry_mode       TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS expiry_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_at      TIMESTAMPTZ;

-- Backfill batch_codes from batch_code for existing rows
UPDATE online_tests SET batch_codes = batch_code WHERE batch_codes = '' AND batch_code IS NOT NULL AND batch_code != '';
