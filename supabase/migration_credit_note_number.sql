-- ============================================================
-- MIGRATION: Add credit_note_number to credit_notes
-- 2026-08-07, per instruction: "counsellors have requested to add a text field called
-- Credit Note Number... so they can write the credit note number against each credit
-- note issued." Distinct from original_invoice_number (which references the invoice
-- being credited) -- this is the credit note document's OWN reference number.
-- Run this in Supabase -> SQL Editor
-- ============================================================

ALTER TABLE credit_notes ADD COLUMN IF NOT EXISTS credit_note_number TEXT DEFAULT '';
