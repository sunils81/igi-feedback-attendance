-- ============================================================
-- MIGRATION: Operational Invoices — item_name + quantity columns
-- Run this in Supabase → SQL Editor
--
-- Adds dynamic item-level detail to operational_invoices: an item name (either picked
-- from the existing inv_items list for inventory-linked categories, or free-typed for
-- Office/Daily Use, Other, or anything not yet in the inventory master) and a quantity.
-- ============================================================

ALTER TABLE operational_invoices
  ADD COLUMN IF NOT EXISTS item_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS quantity  NUMERIC(10,2);

-- No RLS/grant changes needed — this just widens an existing table already covered by
-- migration_operational_invoices.sql's anon_all_operational_invoices policy and GRANT.
