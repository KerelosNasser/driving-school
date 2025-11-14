-- Add duration column to bookings table
-- This column stores the lesson duration in minutes

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60;

-- Add comment for documentation
COMMENT ON COLUMN bookings.duration IS 'Lesson duration in minutes (default: 60)';

-- Update existing records to have default duration if NULL
UPDATE bookings 
SET duration = 60 
WHERE duration IS NULL;

-- Add check constraint to ensure duration is positive
ALTER TABLE bookings 
ADD CONSTRAINT bookings_duration_positive 
CHECK (duration > 0);
