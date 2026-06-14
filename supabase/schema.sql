-- ============================================================
-- IGI Portal — Supabase Schema
-- Project: https://atbexvtrcopaagcdbpqi.supabase.co
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 1. USERS  (was: User_Credentials)
-- Columns from appendRow: [role, name, centres, password_hash, salt, must_change, updated_at, active]
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role          TEXT NOT NULL,          -- 'Counselor' | 'Instructor' | 'Admin' | 'Manager'
  name          TEXT NOT NULL,
  centres       TEXT DEFAULT '',        -- comma-separated e.g. "Chennai,Mumbai"
  password_hash TEXT NOT NULL,
  salt          TEXT NOT NULL,
  must_change   BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_role ON users(role);


-- ============================================================
-- 2. BATCHES  (was: Batches)
-- Columns: [batchCode, centre, course, type, batchSlot, startDate, endDate, counselorName, createdAt, instructor]
-- ============================================================
CREATE TABLE IF NOT EXISTS batches (
  batch_code    TEXT PRIMARY KEY,       -- e.g. CHE-CSG-001
  centre        TEXT NOT NULL,
  course        TEXT NOT NULL,
  type          TEXT DEFAULT '',        -- e.g. 'Regular' | 'Weekend'
  batch_slot    TEXT DEFAULT 'Full Day', -- 'Morning' | 'Evening' | 'Full Day'
  start_date    DATE,
  end_date      DATE,
  counselor     TEXT DEFAULT '',
  instructor    TEXT DEFAULT '',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_batches_centre ON batches(centre);
CREATE INDEX idx_batches_course ON batches(course);
CREATE INDEX idx_batches_instructor ON batches(instructor);


-- ============================================================
-- 3. STUDENTS  (was: Batch_Students)
-- Columns: [studentId, batchCode, name, mobileLast4, mobile, email, status, createdAt, ...]
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  student_id    TEXT PRIMARY KEY,       -- e.g. IGI2024001
  batch_code    TEXT REFERENCES batches(batch_code),
  name          TEXT NOT NULL,
  mobile_last4  TEXT DEFAULT '',
  mobile        TEXT DEFAULT '',
  email         TEXT DEFAULT '',
  status        TEXT DEFAULT 'Active',  -- 'Active' | 'Inactive' | 'Completed'
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_students_batch ON students(batch_code);
CREATE INDEX idx_students_name ON students(name);


-- ============================================================
-- 4. ENROLLMENTS  (was: Student_Batches — student ↔ batch mapping)
-- Columns: [studentId, batchCode, status, createdAt]
-- ============================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    TEXT REFERENCES students(student_id),
  batch_code    TEXT REFERENCES batches(batch_code),
  status        TEXT DEFAULT 'Active',  -- 'Active' | 'Inactive'
  enrolled_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, batch_code)
);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_batch ON enrollments(batch_code);


-- ============================================================
-- 5. SESSIONS  (was: Sessions)
-- Columns: [sessionCode, batchCode, sessionDate, sessNo, instructor, sessionType, topic, cancelled_flag, createdAt]
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  session_code  TEXT PRIMARY KEY,       -- e.g. CHE-CSG-001-S01
  batch_code    TEXT REFERENCES batches(batch_code),
  session_date  DATE NOT NULL,
  sess_no       INTEGER DEFAULT 1,
  instructor    TEXT DEFAULT '',
  session_type  TEXT DEFAULT 'Scheduled', -- 'Scheduled' | 'Completed' | 'Cancelled'
  topic         TEXT DEFAULT '',
  is_cancelled  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sessions_batch ON sessions(batch_code);
CREATE INDEX idx_sessions_date ON sessions(session_date);


-- ============================================================
-- 6. ATTENDANCE_FEEDBACK  (was: Attendance_Feedback)
-- Columns: [sessionCode, enrollmentNo, + up to 17 cols of feedback/attendance]
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_feedback (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_code    TEXT REFERENCES sessions(session_code),
  student_id      TEXT REFERENCES students(student_id),
  batch_code      TEXT,
  attendance      TEXT DEFAULT 'Present', -- 'Present' | 'Absent' | 'Late'
  feedback_score  SMALLINT,               -- 1–5
  feedback_text   TEXT DEFAULT '',
  instructor_note TEXT DEFAULT '',
  marked_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_code, student_id)
);
CREATE INDEX idx_att_session ON attendance_feedback(session_code);
CREATE INDEX idx_att_student ON attendance_feedback(student_id);


-- ============================================================
-- 7. ATT_RECORDS  (was: ATT_Records — counselor-side attendance log)
-- ============================================================
CREATE TABLE IF NOT EXISTS att_records (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_code  TEXT,
  batch_code    TEXT REFERENCES batches(batch_code),
  student_id    TEXT REFERENCES students(student_id),
  session_date  DATE,
  status        TEXT DEFAULT 'Present',
  recorded_by   TEXT DEFAULT '',
  recorded_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_att_records_batch ON att_records(batch_code);
CREATE INDEX idx_att_records_student ON att_records(student_id);


-- ============================================================
-- 8. HOLIDAYS  (was: Holidays)
-- Columns: [date, name, centre, createdAt]
-- ============================================================
CREATE TABLE IF NOT EXISTS holidays (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  holiday_date DATE NOT NULL,
  name        TEXT DEFAULT 'Holiday',
  centre      TEXT DEFAULT 'All',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_holidays_date ON holidays(holiday_date);
CREATE INDEX idx_holidays_centre ON holidays(centre);


-- ============================================================
-- 9. ASSESSMENTS  (was: Assessments)
-- Columns: [assessmentId, batchCode, testName, testType, ...]
-- ============================================================
CREATE TABLE IF NOT EXISTS assessments (
  assessment_id TEXT PRIMARY KEY,
  batch_code    TEXT REFERENCES batches(batch_code),
  test_name     TEXT NOT NULL,
  test_type     TEXT DEFAULT '',         -- 'Weekly' | 'Final' | 'Mock'
  max_marks     NUMERIC(6,2) DEFAULT 100,
  held_on       DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_assessments_batch ON assessments(batch_code);


-- ============================================================
-- 10. ASSESSMENT_MARKS  (was: Assessment_Marks)
-- Columns: [assessmentId, enrollmentNo, studentName, marks, ...]
-- ============================================================
CREATE TABLE IF NOT EXISTS assessment_marks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id TEXT REFERENCES assessments(assessment_id),
  student_id    TEXT REFERENCES students(student_id),
  student_name  TEXT DEFAULT '',
  marks         NUMERIC(6,2),
  remarks       TEXT DEFAULT '',
  UNIQUE(assessment_id, student_id)
);
CREATE INDEX idx_marks_assessment ON assessment_marks(assessment_id);
CREATE INDEX idx_marks_student ON assessment_marks(student_id);


-- ============================================================
-- 11. STUDENT_FEES  (was: Student_Fees)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_fees (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    TEXT REFERENCES students(student_id),
  batch_code    TEXT REFERENCES batches(batch_code),
  centre        TEXT DEFAULT '',
  amount        NUMERIC(12,2) NOT NULL,
  payment_date  DATE,
  payment_mode  TEXT DEFAULT '',        -- 'Cash' | 'UPI' | 'Bank Transfer'
  receipt_no    TEXT DEFAULT '',
  course_fee    NUMERIC(12,2) DEFAULT 0,
  gst_amount    NUMERIC(12,2) DEFAULT 0,
  recorded_by   TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_fees_student ON student_fees(student_id);
CREATE INDEX idx_fees_batch ON student_fees(batch_code);
CREATE INDEX idx_fees_centre ON student_fees(centre);
CREATE INDEX idx_fees_date ON student_fees(payment_date);


-- ============================================================
-- 12. DIPLOMAS  (was: Diplomas)
-- ============================================================
CREATE TABLE IF NOT EXISTS diplomas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      TEXT REFERENCES students(student_id),
  batch_code      TEXT REFERENCES batches(batch_code),
  student_name    TEXT DEFAULT '',
  course          TEXT DEFAULT '',
  completion_date TEXT DEFAULT '',
  drive_link      TEXT DEFAULT '',
  released_by     TEXT DEFAULT '',
  released_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_diplomas_student ON diplomas(student_id);
CREATE INDEX idx_diplomas_batch ON diplomas(batch_code);


-- ============================================================
-- 13. HOD_APPROVALS
-- ============================================================
CREATE TABLE IF NOT EXISTS hod_approvals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        TEXT DEFAULT '',
  ref_code    TEXT DEFAULT '',
  centre      TEXT DEFAULT '',
  requested_by TEXT DEFAULT '',
  status      TEXT DEFAULT 'Pending',   -- 'Pending' | 'Approved' | 'Rejected'
  notes       TEXT DEFAULT '',
  actioned_by TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  actioned_at TIMESTAMPTZ
);
CREATE INDEX idx_hod_centre ON hod_approvals(centre);
CREATE INDEX idx_hod_status ON hod_approvals(status);


-- ============================================================
-- 14. REVENUE  (merges: Revenue_Targets, Revenue_Centre_Targets,
--               Revenue_Annual_Targets, Revenue_Monthly_Achieved,
--               Revenue_Target_Revisions)
-- ============================================================
CREATE TABLE IF NOT EXISTS revenue_targets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  centre          TEXT NOT NULL,
  year            SMALLINT NOT NULL,
  month           SMALLINT,             -- NULL = annual target
  target_amount   NUMERIC(14,2) DEFAULT 0,
  achieved_amount NUMERIC(14,2) DEFAULT 0,
  revised_target  NUMERIC(14,2),
  revised_by      TEXT DEFAULT '',
  reason          TEXT DEFAULT '',
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_revenue_centre ON revenue_targets(centre);
CREATE INDEX idx_revenue_year ON revenue_targets(year, month);


-- ============================================================
-- 15. INVENTORY ITEMS  (was: INV_Items)
-- ============================================================
CREATE TABLE IF NOT EXISTS inv_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_code     TEXT UNIQUE,
  item_name     TEXT NOT NULL,
  category      TEXT DEFAULT '',
  unit          TEXT DEFAULT '',
  reorder_level INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 16. INVENTORY STOCK  (was: INV_Stock)
-- ============================================================
CREATE TABLE IF NOT EXISTS inv_stock (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id     UUID REFERENCES inv_items(id),
  centre      TEXT NOT NULL,
  qty         INTEGER DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, centre)
);
CREATE INDEX idx_stock_centre ON inv_stock(centre);


-- ============================================================
-- 17. INVENTORY REQUESTS  (was: INV_Requests)
-- ============================================================
CREATE TABLE IF NOT EXISTS inv_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id       UUID REFERENCES inv_items(id),
  centre        TEXT NOT NULL,
  requested_qty INTEGER NOT NULL,
  requested_by  TEXT DEFAULT '',
  status        TEXT DEFAULT 'Pending', -- 'Pending' | 'Approved' | 'Dispatched' | 'Rejected'
  notes         TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inv_requests_centre ON inv_requests(centre);
CREATE INDEX idx_inv_requests_status ON inv_requests(status);


-- ============================================================
-- 18. INVENTORY DISPATCH  (was: INV_Dispatch)
-- ============================================================
CREATE TABLE IF NOT EXISTS inv_dispatch (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id    UUID REFERENCES inv_requests(id),
  item_id       UUID REFERENCES inv_items(id),
  from_centre   TEXT DEFAULT '',
  to_centre     TEXT NOT NULL,
  dispatched_qty INTEGER NOT NULL,
  dispatched_by  TEXT DEFAULT '',
  dispatched_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 19. INVENTORY VENDORS  (was: INV_Vendors)
-- ============================================================
CREATE TABLE IF NOT EXISTS inv_vendors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_name TEXT NOT NULL,
  contact     TEXT DEFAULT '',
  email       TEXT DEFAULT '',
  address     TEXT DEFAULT '',
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 20. ONLINE TESTS  (was: OnlineTests)
-- ============================================================
CREATE TABLE IF NOT EXISTS online_tests (
  test_id       TEXT PRIMARY KEY,
  batch_code    TEXT REFERENCES batches(batch_code),
  title         TEXT NOT NULL,
  duration_mins SMALLINT DEFAULT 60,
  starts_at     TIMESTAMPTZ,
  ends_at       TIMESTAMPTZ,
  status        TEXT DEFAULT 'Draft',   -- 'Draft' | 'Live' | 'Closed'
  created_by    TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tests_batch ON online_tests(batch_code);
CREATE INDEX idx_tests_status ON online_tests(status);


-- ============================================================
-- 21. QUESTION BANK  (was: QuestionBank + CustomQuestions)
-- ============================================================
CREATE TABLE IF NOT EXISTS question_bank (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course      TEXT DEFAULT '',
  topic       TEXT DEFAULT '',
  question    TEXT NOT NULL,
  option_a    TEXT DEFAULT '',
  option_b    TEXT DEFAULT '',
  option_c    TEXT DEFAULT '',
  option_d    TEXT DEFAULT '',
  correct_ans TEXT DEFAULT '',
  q_type      TEXT DEFAULT 'MCQ',       -- 'MCQ' | 'Descriptive'
  max_marks   NUMERIC(5,2) DEFAULT 1,
  instructor  TEXT DEFAULT '',
  source      TEXT DEFAULT 'bank',      -- 'bank' | 'custom'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_qbank_course ON question_bank(course);


-- ============================================================
-- 22. TEST QUESTIONS  (was: OT_Questions — questions per test)
-- ============================================================
CREATE TABLE IF NOT EXISTS test_questions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id     TEXT REFERENCES online_tests(test_id),
  question_id UUID REFERENCES question_bank(id),
  order_no    SMALLINT DEFAULT 1,
  UNIQUE(test_id, question_id)
);
CREATE INDEX idx_tq_test ON test_questions(test_id);


-- ============================================================
-- 23. TEST RESPONSES  (was: OT_Responses)
-- ============================================================
CREATE TABLE IF NOT EXISTS test_responses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id     TEXT REFERENCES online_tests(test_id),
  student_id  TEXT REFERENCES students(student_id),
  batch_code  TEXT DEFAULT '',
  answers     JSONB DEFAULT '{}',       -- {questionId: answer}
  score       NUMERIC(6,2) DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(test_id, student_id)
);
CREATE INDEX idx_responses_test ON test_responses(test_id);
CREATE INDEX idx_responses_student ON test_responses(student_id);


-- ============================================================
-- 24. MANUAL GRADES  (was: OT_ManualGrades)
-- ============================================================
CREATE TABLE IF NOT EXISTS manual_grades (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id     TEXT REFERENCES online_tests(test_id),
  student_id  TEXT REFERENCES students(student_id),
  question_id UUID REFERENCES question_bank(id),
  score       NUMERIC(5,2) DEFAULT 0,
  max_marks   NUMERIC(5,2) DEFAULT 5,
  feedback    TEXT DEFAULT '',
  graded_by   TEXT DEFAULT '',
  graded_at   TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 25. TEST WARNINGS  (was: OT_Warnings — tab-switch etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS test_warnings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id     TEXT REFERENCES online_tests(test_id),
  student_id  TEXT REFERENCES students(student_id),
  warning_type TEXT DEFAULT 'tab-switch',
  count       INTEGER DEFAULT 1,
  logged_at   TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 26. TEST STARTS  (was: OT_Starts — per-student start times)
-- ============================================================
CREATE TABLE IF NOT EXISTS test_starts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id     TEXT REFERENCES online_tests(test_id),
  student_id  TEXT REFERENCES students(student_id),
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(test_id, student_id)
);


-- ============================================================
-- HELPER: updated_at trigger (auto-update timestamp)
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER inv_stock_updated_at BEFORE UPDATE ON inv_stock
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER revenue_updated_at BEFORE UPDATE ON revenue_targets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- DONE — all 26 tables created
-- Next step: go to Table Editor and import your CSV exports
-- ============================================================
