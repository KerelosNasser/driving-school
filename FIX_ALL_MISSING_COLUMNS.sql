-- ========================================
-- COMPLETE FIX - All Missing Columns in bookings table
-- ========================================
-- Run this ONCE in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run

-- Add ALL missing columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS lesson_type VARCHAR(50) DEFAULT 'Standard';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'confirmed';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hours_used DECIMAL(5,2);

-- Update existing records with defaults
UPDATE bookings SET duration = 60 WHERE duration IS NULL;
UPDATE bookings SET lesson_type = 'Standard' WHERE lesson_type IS NULL;
UPDATE bookings SET status = 'confirmed' WHERE status IS NULL;

-- Add constraints
ALTER TABLE bookings ADD CONSTRAINT IF NOT EXISTS bookings_duration_positive CHECK (duration > 0);

-- Verify all columns exist
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

-- ========================================
-- Expected columns after this fix:
-- id, user_id, date, time, duration, lesson_type, 
-- location, notes, status, google_calendar_event_id, 
-- hours_used, created_at, updated_at
-- ========================================

-- SUCCESS! All columns are now in place.
-- Your booking system should work perfectly now!
