-- ============================================================
-- MIGRATION: Discount Approval Requests
-- 2026-08-07, per instruction: "create a system in counselor portal where counselor
-- request for the discount approval, and it comes in admin portal for the approval.
-- And post that the counselor can give the discount."
--
-- Design confirmed with Sunil: ALL nonzero discounts require approval (not just Custom),
-- hard-blocked at save time (h_saveFee rejects any nonzero discount without a matching
-- approved+unused request), reviewed in a new admin.html tab.
-- Run this in Supabase -> SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS discount_requests (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        TEXT NOT NULL,
  student_name      TEXT NOT NULL,
  batch_code        TEXT NOT NULL,
  centre            TEXT NOT NULL,
  course            TEXT DEFAULT '',
  course_fee        NUMERIC(12,2) NOT NULL DEFAULT 0,   -- base fee at time of request, for the admin's context
  discount_pct      NUMERIC(6,2) NOT NULL,
  discount_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,   -- computed at request time (course_fee * discount_pct / 100), for display only -- h_saveFee always recomputes its own at save time
  discount_reason   TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',    -- 'pending' | 'approved' | 'rejected'
  requested_by      TEXT NOT NULL,
  requested_at      TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by       TEXT DEFAULT '',
  reviewed_at       TIMESTAMPTZ,
  review_note       TEXT DEFAULT '',
  -- Marks an approved request as already spent once it's actually been used to save a fee
  -- record with that exact discount -- prevents the same approval being reused indefinitely
  -- across unrelated future edits, and is also what h_saveFee's hard-block check looks for.
  used              BOOLEAN NOT NULL DEFAULT FALSE,
  used_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discount_req_status ON discount_requests(status);
CREATE INDEX IF NOT EXISTS idx_discount_req_lookup ON discount_requests(student_id, batch_code, discount_pct, status, used);
CREATE INDEX IF NOT EXISTS idx_discount_req_requester ON discount_requests(requested_by);

ALTER TABLE discount_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'discount_requests' AND policyname = 'anon_all_discount_requests') THEN
    EXECUTE 'CREATE POLICY anon_all_discount_requests ON discount_requests FOR ALL TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- RLS policy alone is not enough -- base table-level GRANT is required before RLS is even
-- evaluated (learned this repeatedly on this project). Deliberately NOT granting DELETE --
-- a discount request is an approval-decision audit trail and should never be erasable from
-- the client, matching the same restriction already in place on revenue_monthly_achieved.
GRANT SELECT, INSERT, UPDATE ON public.discount_requests TO anon;
