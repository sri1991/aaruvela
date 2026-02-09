-- Run this in Supabase SQL Editor to make yourself an admin
-- Replace 'YOUR_USER_ID' with your actual user ID from the Supabase Auth table
UPDATE users 
SET role = 'HEAD', status = 'ACTIVE' 
WHERE id = 'YOUR_USER_ID';
-- OR if you know your email
-- UPDATE users SET role = 'HEAD', status = 'ACTIVE' WHERE identifier = 'your-email@example.com';
