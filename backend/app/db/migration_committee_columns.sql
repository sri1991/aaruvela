-- SQL Migration to add missing committee columns to the users table
-- Run this in your Supabase SQL Editor

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS zonal_committee TEXT,
ADD COLUMN IF NOT EXISTS regional_committee TEXT;

-- Force schema cache refresh so the API picks up the new columns immediately
NOTIFY pgrst, 'reload schema';
