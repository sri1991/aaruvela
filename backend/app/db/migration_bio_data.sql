-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS father_guardian_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tob TIME;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gotram TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sub_sect TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS annual_income DECIMAL(15, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS star_pada TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cell_no TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS requirement TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS particulars TEXT;

-- Update constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('HEAD', 'PERMANENT', 'NORMAL', 'ASSOCIATED', 'GENERAL'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('PENDING', 'PAID', 'ACTIVE', 'BLOCKED'));

-- Update membership_requests table
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS application_data JSONB;
ALTER TABLE membership_requests ADD COLUMN IF NOT EXISTS admin_notes TEXT;

ALTER TABLE membership_requests DROP CONSTRAINT IF EXISTS membership_requests_requested_role_check;
ALTER TABLE membership_requests ADD CONSTRAINT membership_requests_requested_role_check CHECK (requested_role IN ('PERMANENT', 'NORMAL', 'ASSOCIATED'));

ALTER TABLE membership_requests DROP CONSTRAINT IF EXISTS membership_requests_payment_status_check;
ALTER TABLE membership_requests ADD CONSTRAINT membership_requests_payment_status_check CHECK (payment_status IN ('PENDING', 'PAID', 'EXEMPT'));
