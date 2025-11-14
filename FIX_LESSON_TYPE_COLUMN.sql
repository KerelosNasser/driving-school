-- ========================================
-- FIX: Add missing 'lesson_type' column to bookings table
-- ========================================
-- Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run

-- 1. Add lesson_type column
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS lesson_type VARCHAR(50) DEFAULT 'Standard';

-- 2. Update existing records
UPDATE bookings 
SET lesson_type = 'Standard' 
WHERE lesson_type IS NULL;

-- 3. Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('duration', 'lesson_type');

-- Expected result:
-- column_name  | data_type         | column_default
-- duration     | integer           | 60
-- lesson_type  | character varying | 'Standard'::character varying

-- ========================================
-- SUCCESS! Both columns are now added.
-- ========================================
