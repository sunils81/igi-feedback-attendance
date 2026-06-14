-- ============================================================
-- MIGRATION: Forgot Password — OTP flow
-- Run in Supabase → SQL Editor
-- ============================================================

-- 1. Add email column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';

-- 2. Create OTP tokens table
CREATE TABLE IF NOT EXISTS otp_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT NOT NULL,
  otp_code    TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_tokens(email);
CREATE INDEX IF NOT EXISTS idx_otp_email_code ON otp_tokens(email, otp_code);

-- 4. Enable RLS
ALTER TABLE otp_tokens ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'otp_tokens' AND policyname = 'anon_all_otp_tokens'
  ) THEN
    EXECUTE 'CREATE POLICY anon_all_otp_tokens ON otp_tokens FOR ALL TO anon USING (true) WITH CHECK (true)';
  END IF;
END $$;

-- 5. Populate email addresses for each user (match by name)
UPDATE users SET email = 'amit@igi.org'                 WHERE name = 'Amit Sidpura';
UPDATE users SET email = 'bhavin.patel@igi.org'         WHERE name = 'Bhavin Patel';
UPDATE users SET email = 'sayan.banerjee@igi.org'       WHERE name = 'Sayan Banerjee';
UPDATE users SET email = 'khorehmand.kasad@igi.org'     WHERE name = 'Khorehmand Kasad';
UPDATE users SET email = 'preeti.agarwala@igi.org'      WHERE name = 'Preeti Agarwala';
UPDATE users SET email = 'nishchay.kapoor@igi.org'      WHERE name = 'Nishchay Kapoor';
UPDATE users SET email = 'piyush.ahuja@igi.org'         WHERE name = 'Piyush Ahuja';
UPDATE users SET email = 'arjun@igi.org'                WHERE name = 'Arjun Mistry';
UPDATE users SET email = 'asmita.saroday@igi.org'       WHERE name = 'Asmita Saroday';
UPDATE users SET email = 'sneha.garodia@igi.org'        WHERE name = 'Sneha Garodia';
UPDATE users SET email = 'deepak.nachankar@igi.org'     WHERE name = 'Deepak Nachankar';
UPDATE users SET email = 'seema.athavale@igi.org'       WHERE name = 'Seema Athavale';
UPDATE users SET email = 'sharoon.joy@igi.org'          WHERE name = 'Sharoon Joy';

-- Verify
SELECT name, email, role FROM users ORDER BY name;
