-- Add template support to online_tests
-- Instructors can create reusable test templates (is_template=true, no batch assigned)
-- and deploy them to specific batches via the "Use for Batch" flow.

ALTER TABLE online_tests
  ADD COLUMN IF NOT EXISTS is_template    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS template_name  TEXT    DEFAULT NULL;

-- Index for fast template listing
CREATE INDEX IF NOT EXISTS idx_online_tests_is_template ON online_tests(is_template) WHERE is_template = true;
