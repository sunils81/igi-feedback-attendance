-- ============================================================
-- MIGRATION: Add Order ID to students
-- Run in: https://supabase.com/dashboard/project/atbexvtrcopaagcdbpqi/sql
--
-- Context: Counsellors were mistakenly typing the 5+ digit payment/order ID
-- into the 4-digit Student ID field. This adds a dedicated Order ID column
-- so the two can't be confused, and the portal now flags entries where the
-- Student ID field itself looks like an order number (5+ digits).
-- ============================================================

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS order_id TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_students_order_id ON public.students(order_id) WHERE order_id <> '';

-- Verify:
-- SELECT student_id, name, order_id FROM public.students ORDER BY created_at DESC LIMIT 20;
