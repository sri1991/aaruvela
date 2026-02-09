-- SQL to elevate yourself to ADMIN (HEAD) for testing
-- Run this in your Supabase SQL Editor

-- Use the phone number or identifier you used to sign up
UPDATE users 
SET role = 'HEAD', 
    status = 'ACTIVE' 
WHERE identifier = '9876543210'; -- Replace with your actual phone number if different

-- Verify the change
SELECT id, identifier, role, status FROM users WHERE identifier = '9876543210';
