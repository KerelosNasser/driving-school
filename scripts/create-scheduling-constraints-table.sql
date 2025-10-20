-- Create scheduling_constraints table for storing admin-configurable scheduling rules
-- This table stores the constraints that govern lesson booking and scheduling

CREATE TABLE IF NOT EXISTS scheduling_constraints (
    id SERIAL PRIMARY KEY,
    
    -- Weekly limits
    max_hours_per_week INTEGER NOT NULL DEFAULT 20,
    max_lessons_per_week INTEGER NOT NULL DEFAULT 15,
    max_consecutive_lessons INTEGER NOT NULL DEFAULT 3,
    
    -- Daily limits
    max_hours_per_day INTEGER NOT NULL DEFAULT 6,
    max_lessons_per_day INTEGER NOT NULL DEFAULT 8,
    
    -- Time constraints
    earliest_start_time TIME NOT NULL DEFAULT '07:00:00',
    latest_end_time TIME NOT NULL DEFAULT '19:00:00',
    
    -- Buffer requirements (in minutes)
    min_buffer_between_lessons INTEGER NOT NULL DEFAULT 15,
    max_buffer_between_lessons INTEGER NOT NULL DEFAULT 60,
    
    -- Lesson duration constraints (in minutes)
    min_lesson_duration INTEGER NOT NULL DEFAULT 60,
    max_lesson_duration INTEGER NOT NULL DEFAULT 180,
    allowed_durations INTEGER[] NOT NULL DEFAULT '{60,90,120,180}',
    
    -- Booking constraints
    max_advance_booking_days INTEGER NOT NULL DEFAULT 30,
    min_advance_booking_hours INTEGER NOT NULL DEFAULT 24,
    
    -- Instructor constraints
    max_instructor_hours_per_day INTEGER NOT NULL DEFAULT 8,
    required_break_after_hours INTEGER NOT NULL DEFAULT 4,
    min_break_duration INTEGER NOT NULL DEFAULT 30,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Add RLS (Row Level Security)
ALTER TABLE scheduling_constraints ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read constraints
CREATE POLICY "Admins can read scheduling constraints" ON scheduling_constraints
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy: Only admins can insert constraints
CREATE POLICY "Admins can insert scheduling constraints" ON scheduling_constraints
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy: Only admins can update constraints
CREATE POLICY "Admins can update scheduling constraints" ON scheduling_constraints
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy: Only admins can delete constraints
CREATE POLICY "Admins can delete scheduling constraints" ON scheduling_constraints
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_scheduling_constraints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scheduling_constraints_updated_at
    BEFORE UPDATE ON scheduling_constraints
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduling_constraints_updated_at();

-- Insert default constraints (only if table is empty)
INSERT INTO scheduling_constraints (
    max_hours_per_week,
    max_lessons_per_week,
    max_consecutive_lessons,
    max_hours_per_day,
    max_lessons_per_day,
    earliest_start_time,
    latest_end_time,
    min_buffer_between_lessons,
    max_buffer_between_lessons,
    min_lesson_duration,
    max_lesson_duration,
    allowed_durations,
    max_advance_booking_days,
    min_advance_booking_hours,
    max_instructor_hours_per_day,
    required_break_after_hours,
    min_break_duration
) 
SELECT 
    20,  -- max_hours_per_week
    15,  -- max_lessons_per_week
    3,   -- max_consecutive_lessons
    6,   -- max_hours_per_day
    8,   -- max_lessons_per_day
    '07:00:00',  -- earliest_start_time
    '19:00:00',  -- latest_end_time
    15,  -- min_buffer_between_lessons
    60,  -- max_buffer_between_lessons
    60,  -- min_lesson_duration
    180, -- max_lesson_duration
    '{60,90,120,180}',  -- allowed_durations
    30,  -- max_advance_booking_days
    24,  -- min_advance_booking_hours
    8,   -- max_instructor_hours_per_day
    4,   -- required_break_after_hours
    30   -- min_break_duration
WHERE NOT EXISTS (SELECT 1 FROM scheduling_constraints);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scheduling_constraints_updated_at ON scheduling_constraints(updated_at);

-- Add comments for documentation
COMMENT ON TABLE scheduling_constraints IS 'Stores admin-configurable scheduling constraints and limits for lesson bookings';
COMMENT ON COLUMN scheduling_constraints.max_hours_per_week IS 'Maximum hours a student can book per week';
COMMENT ON COLUMN scheduling_constraints.max_lessons_per_week IS 'Maximum number of lessons a student can book per week';
COMMENT ON COLUMN scheduling_constraints.max_consecutive_lessons IS 'Maximum number of consecutive lessons allowed';
COMMENT ON COLUMN scheduling_constraints.max_hours_per_day IS 'Maximum hours a student can book per day';
COMMENT ON COLUMN scheduling_constraints.max_lessons_per_day IS 'Maximum number of lessons a student can book per day';
COMMENT ON COLUMN scheduling_constraints.earliest_start_time IS 'Earliest time lessons can start';
COMMENT ON COLUMN scheduling_constraints.latest_end_time IS 'Latest time lessons can end';
COMMENT ON COLUMN scheduling_constraints.min_buffer_between_lessons IS 'Minimum buffer time between lessons in minutes';
COMMENT ON COLUMN scheduling_constraints.max_buffer_between_lessons IS 'Maximum buffer time between lessons in minutes';
COMMENT ON COLUMN scheduling_constraints.min_lesson_duration IS 'Minimum lesson duration in minutes';
COMMENT ON COLUMN scheduling_constraints.max_lesson_duration IS 'Maximum lesson duration in minutes';
COMMENT ON COLUMN scheduling_constraints.allowed_durations IS 'Array of allowed lesson durations in minutes';
COMMENT ON COLUMN scheduling_constraints.max_advance_booking_days IS 'Maximum days in advance students can book';
COMMENT ON COLUMN scheduling_constraints.min_advance_booking_hours IS 'Minimum hours in advance students must book';
COMMENT ON COLUMN scheduling_constraints.max_instructor_hours_per_day IS 'Maximum hours an instructor can work per day';
COMMENT ON COLUMN scheduling_constraints.required_break_after_hours IS 'Hours after which instructor break is required';
COMMENT ON COLUMN scheduling_constraints.min_break_duration IS 'Minimum instructor break duration in minutes';