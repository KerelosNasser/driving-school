-- ========================================
-- COMPLETE DATABASE FIX - All Missing Columns
-- ========================================
-- Run this ONCE in Supabase SQL Editor to fix all schema issues
-- Dashboard → SQL Editor → New Query → Paste & Run

-- 1. Add duration column (if missing)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60;

-- 2. Add lesson_type column (if missing)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS lesson_type VARCHAR(50) DEFAULT 'Standard';

-- 3. Update existing records
UPDATE bookings 
SET duration = 60 
WHERE duration IS NULL;

UPDATE bookings 
SET lesson_type = 'Standard' 
WHERE lesson_type IS NULL;

-- 4. Add constraints
ALTER TABLE bookings 
ADD CONSTRAINT IF NOT EXISTS bookings_duration_positive 
CHECK (duration > 0);

-- 5. Verify all columns exist
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('id', 'user_id', 'date', 'time', 'duration', 'lesson_type', 'location', 'notes', 'status', 'google_calendar_event_id', 'hours_used', 'created_at', 'updated_at')
ORDER BY ordinal_position;

-- Expected columns:
-- id, user_id, date, time, duration, lesson_type, location, notes, 
-- status, google_calendar_event_id, hours_used, created_at, updated_at

-- ========================================
-- SUCCESS! All required columns are now in place.
-- Your booking system should work perfectly now!
-- ========================================
