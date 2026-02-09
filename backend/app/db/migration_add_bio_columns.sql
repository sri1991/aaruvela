-- SQL Migration to fix ALL Phase 3 Constraints & Columns
-- Run this in your Supabase SQL Editor

-- 1. Ensure users table has all bio-data columns AND member_id
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS member_id TEXT,
ADD COLUMN IF NOT EXISTS father_guardian_name TEXT,
ADD COLUMN IF NOT EXISTS age INT,
ADD COLUMN IF NOT EXISTS dob DATE,
ADD COLUMN IF NOT EXISTS tob TIME,
ADD COLUMN IF NOT EXISTS gotram TEXT,
ADD COLUMN IF NOT EXISTS sub_sect TEXT,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS annual_income DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS star_pada TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS cell_no TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS requirement TEXT,
ADD COLUMN IF NOT EXISTS particulars TEXT;

-- 2. Ensure membership_requests table is synced
ALTER TABLE membership_requests
ADD COLUMN IF NOT EXISTS application_data JSONB,
ADD COLUMN IF NOT EXISTS admin_notes TEXT; -- The missing piece for approval feedback

-- 3. FIX: Update the payment_status check constraint to allow 'EXEMPT'
DO $$
BEGIN
    ALTER TABLE membership_requests DROP CONSTRAINT IF EXISTS membership_requests_payment_status_check;
    ALTER TABLE membership_requests ADD CONSTRAINT membership_requests_payment_status_check 
        CHECK (payment_status IN ('PENDING', 'PAID', 'EXEMPT'));
END $$;

-- 4. FIX: Update requested_role check constraint to allow uppercase roles
DO $$
BEGIN
    ALTER TABLE membership_requests DROP CONSTRAINT IF EXISTS membership_requests_requested_role_check;
    ALTER TABLE membership_requests ADD CONSTRAINT membership_requests_requested_role_check 
        CHECK (requested_role IN ('PERMANENT', 'NORMAL', 'ASSOCIATED'));
END $$;

-- 5. FIX: Update users table role check constraint
DO $$
BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('HEAD', 'PERMANENT', 'NORMAL', 'ASSOCIATED', 'GENERAL'));
END $$;

-- 6. FIX: Update users table status check constraint (safety)
DO $$
BEGIN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
    ALTER TABLE users ADD CONSTRAINT users_status_check 
        CHECK (status IN ('PENDING', 'PAID', 'ACTIVE', 'BLOCKED'));
END $$;

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';
