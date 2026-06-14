-- ============================================================
-- MIGRATION: Inventory unit_cost, notes, cost_locked + multi-vendor
-- Run this in Supabase → SQL Editor
-- ============================================================

-- 1. Add missing columns to inv_items
ALTER TABLE inv_items
  ADD COLUMN IF NOT EXISTS unit_cost   NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS notes       TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cost_locked BOOLEAN DEFAULT FALSE;

-- 2. Add phone column to inv_vendors (schema was missing it)
ALTER TABLE inv_vendors
  ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';

-- 3. Create multi-vendor junction table
CREATE TABLE IF NOT EXISTS inv_item_vendors (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id      UUID NOT NULL REFERENCES inv_items(id) ON DELETE CASCADE,
  vendor_id    UUID NOT NULL REFERENCES inv_vendors(id) ON DELETE CASCADE,
  unit_cost    NUMERIC(12,2),
  is_preferred BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_item_vendors_item   ON inv_item_vendors(item_id);
CREATE INDEX IF NOT EXISTS idx_item_vendors_vendor ON inv_item_vendors(vendor_id);

-- 4. Enable RLS (match pattern of other tables)
ALTER TABLE inv_item_vendors ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inv_item_vendors' AND policyname = 'anon_all_inv_item_vendors'
  ) THEN
    EXECUTE 'CREATE POLICY anon_all_inv_item_vendors ON inv_item_vendors FOR ALL TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;
