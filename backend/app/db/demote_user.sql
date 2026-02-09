-- 🚨 USER DEMOTION SCRIPT
-- Run this in your Supabase SQL Editor to remove Admin access from 9876543210

-- 1. Set role back to GENERAL and status back to PENDING
UPDATE users 
SET role = 'GENERAL', 
    status = 'PENDING',
    member_id = NULL
WHERE identifier = '9876543210';

-- 2. Verify the change
SELECT identifier, role, status FROM users WHERE identifier = '9876543210';
