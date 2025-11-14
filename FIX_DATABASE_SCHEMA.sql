-- ========================================
-- FIX: Add missing 'duration' column to bookings table
-- ========================================
-- Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run

-- 1. Add duration column
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60;

-- 2. Update existing records
UPDATE bookings 
SET duration = 60 
WHERE duration IS NULL;

-- 3. Add constraint
ALTER TABLE bookings 
ADD CONSTRAINT IF NOT EXISTS bookings_duration_positive 
CHECK (duration > 0);

-- 4. Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'duration';

-- Expected result:
-- column_name | data_type | column_default
-- duration    | integer   | 60

-- ========================================
-- SUCCESS! The duration column is now added.
-- ========================================
