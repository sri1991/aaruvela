-- 🚨 MASTER ADMIN SETUP SCRIPT
-- Run this in your Supabase SQL Editor to create a permanent Admin account for your "Sir"

-- 1. Create the Admin User
-- Phone: 1112223333
-- PIN: 1234 (Pre-hashed for convenience)
INSERT INTO users (
    id, 
    identifier, 
    full_name, 
    phone, 
    pin_hash, 
    role, 
    status
) VALUES (
    uuid_generate_v4(),
    '1112223333',
    'Master Administrator',
    '1112223333',
     -- This is the hash for PIN "1234"
    '$2b$12$eAI4bGdWC4CSjifWyGtN/.m1/SD0NkvSDy11779Es5Sx2m4jU7AtC',
    'HEAD',
    'ACTIVE'
) ON CONFLICT (identifier) DO UPDATE 
SET role = 'HEAD', status = 'ACTIVE', pin_hash = EXCLUDED.pin_hash;

-- 2. Verify the Admin exists
SELECT identifier, role, status FROM users WHERE identifier = '1112223333';
