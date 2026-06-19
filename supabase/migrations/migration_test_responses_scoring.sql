-- Add scoring columns to test_responses so h_submitTestResponse can store computed results
ALTER TABLE test_responses
  ADD COLUMN IF NOT EXISTS total_marks   NUMERIC(6,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS percentage    NUMERIC(5,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS result        TEXT         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS submit_type   TEXT         DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS attempt_no    SMALLINT     DEFAULT 1;
