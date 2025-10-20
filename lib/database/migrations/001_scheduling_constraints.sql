-- Migration: 001_scheduling_constraints.sql
-- Description: Create tables for scheduling constraints, booking rules, and working hours

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create scheduling_constraints table
CREATE TABLE IF NOT EXISTS scheduling_constraints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    constraint_type VARCHAR(20) NOT NULL CHECK (constraint_type IN ('break', 'unavailable', 'maintenance', 'holiday')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    reason TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(10) CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_recurrence CHECK (
        (is_recurring = FALSE AND recurrence_pattern IS NULL) OR
        (is_recurring = TRUE AND recurrence_pattern IS NOT NULL)
    )
);

-- Create booking_rules table
CREATE TABLE IF NOT EXISTS booking_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_type VARCHAR(30) NOT NULL CHECK (rule_type IN (
        'min_advance_booking', 
        'max_advance_booking', 
        'min_lesson_duration', 
        'max_lesson_duration', 
        'buffer_time'
    )),
    value INTEGER NOT NULL CHECK (value > 0), -- in minutes
    applies_to VARCHAR(10) NOT NULL CHECK (applies_to IN ('all', 'student', 'instructor')),
    target_id UUID, -- specific student or instructor ID
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_target CHECK (
        (applies_to = 'all' AND target_id IS NULL) OR
        (applies_to IN ('student', 'instructor') AND target_id IS NOT NULL)
    )
);

-- Create working_hours table
CREATE TABLE IF NOT EXISTS working_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_time_range_working_hours CHECK (end_time > start_time),
    CONSTRAINT unique_instructor_day UNIQUE (instructor_id, day_of_week)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scheduling_constraints_instructor_time 
ON scheduling_constraints (instructor_id, start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_scheduling_constraints_time_range 
ON scheduling_constraints USING GIST (tstzrange(start_time, end_time));

CREATE INDEX IF NOT EXISTS idx_booking_rules_active 
ON booking_rules (is_active, applies_to);

CREATE INDEX IF NOT EXISTS idx_working_hours_instructor 
ON working_hours (instructor_id, is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_scheduling_constraints_updated_at 
    BEFORE UPDATE ON scheduling_constraints 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_rules_updated_at 
    BEFORE UPDATE ON booking_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_working_hours_updated_at 
    BEFORE UPDATE ON working_hours 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE scheduling_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;

-- Scheduling constraints policies
CREATE POLICY "Instructors can manage their own constraints" ON scheduling_constraints
    FOR ALL USING (auth.uid() = instructor_id);

CREATE POLICY "Admins can manage all constraints" ON scheduling_constraints
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Students can view instructor constraints" ON scheduling_constraints
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('student', 'instructor', 'admin')
        )
    );

-- Booking rules policies
CREATE POLICY "Admins can manage booking rules" ON booking_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "All authenticated users can view active booking rules" ON booking_rules
    FOR SELECT USING (
        is_active = TRUE AND 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Working hours policies
CREATE POLICY "Instructors can manage their own working hours" ON working_hours
    FOR ALL USING (auth.uid() = instructor_id);

CREATE POLICY "Admins can manage all working hours" ON working_hours
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Students can view instructor working hours" ON working_hours
    FOR SELECT USING (
        is_active = TRUE AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('student', 'instructor', 'admin')
        )
    );

-- Insert default booking rules
INSERT INTO booking_rules (rule_type, value, applies_to, is_active) VALUES
    ('min_advance_booking', 60, 'all', TRUE), -- 1 hour minimum advance booking
    ('max_advance_booking', 10080, 'all', TRUE), -- 1 week maximum advance booking
    ('min_lesson_duration', 30, 'all', TRUE), -- 30 minutes minimum lesson
    ('max_lesson_duration', 240, 'all', TRUE), -- 4 hours maximum lesson
    ('buffer_time', 15, 'all', TRUE) -- 15 minutes buffer between lessons
ON CONFLICT DO NOTHING;

-- Create function to check time slot availability
CREATE OR REPLACE FUNCTION check_time_slot_availability(
    p_instructor_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS TABLE(
    available BOOLEAN,
    conflicts TEXT[]
) AS $$
DECLARE
    conflict_list TEXT[] := '{}';
    working_hours_record RECORD;
    constraint_record RECORD;
    booking_record RECORD;
    rule_record RECORD;
    day_of_week INTEGER;
    start_time_only TIME;
    end_time_only TIME;
BEGIN
    -- Check working hours
    day_of_week := EXTRACT(DOW FROM p_start_time);
    start_time_only := p_start_time::TIME;
    end_time_only := p_end_time::TIME;
    
    SELECT * INTO working_hours_record
    FROM working_hours 
    WHERE instructor_id = p_instructor_id 
      AND day_of_week = EXTRACT(DOW FROM p_start_time)
      AND is_active = TRUE;
    
    IF NOT FOUND THEN
        conflict_list := array_append(conflict_list, 'Instructor not available on this day');
    ELSIF start_time_only < working_hours_record.start_time OR end_time_only > working_hours_record.end_time THEN
        conflict_list := array_append(conflict_list, 'Time slot outside working hours');
    END IF;
    
    -- Check scheduling constraints
    FOR constraint_record IN
        SELECT * FROM scheduling_constraints
        WHERE instructor_id = p_instructor_id
          AND start_time < p_end_time
          AND end_time > p_start_time
    LOOP
        conflict_list := array_append(conflict_list, 
            'Conflict with ' || constraint_record.constraint_type || 
            COALESCE(': ' || constraint_record.reason, ''));
    END LOOP;
    
    -- Check existing bookings
    FOR booking_record IN
        SELECT * FROM bookings
        WHERE instructor_id = p_instructor_id
          AND status IN ('scheduled', 'confirmed')
          AND start_time < p_end_time
          AND end_time > p_start_time
          AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
    LOOP
        conflict_list := array_append(conflict_list, 'Time slot conflicts with existing booking');
    END LOOP;
    
    -- Check booking rules
    FOR rule_record IN
        SELECT * FROM booking_rules
        WHERE is_active = TRUE
          AND (applies_to = 'all' OR 
               (applies_to = 'instructor' AND target_id = p_instructor_id))
    LOOP
        CASE rule_record.rule_type
            WHEN 'min_advance_booking' THEN
                IF p_start_time < NOW() + (rule_record.value || ' minutes')::INTERVAL THEN
                    conflict_list := array_append(conflict_list, 
                        'Minimum advance booking time is ' || rule_record.value || ' minutes');
                END IF;
            WHEN 'max_advance_booking' THEN
                IF p_start_time > NOW() + (rule_record.value || ' minutes')::INTERVAL THEN
                    conflict_list := array_append(conflict_list, 
                        'Maximum advance booking time is ' || rule_record.value || ' minutes');
                END IF;
            WHEN 'min_lesson_duration' THEN
                IF p_end_time - p_start_time < (rule_record.value || ' minutes')::INTERVAL THEN
                    conflict_list := array_append(conflict_list, 
                        'Minimum lesson duration is ' || rule_record.value || ' minutes');
                END IF;
            WHEN 'max_lesson_duration' THEN
                IF p_end_time - p_start_time > (rule_record.value || ' minutes')::INTERVAL THEN
                    conflict_list := array_append(conflict_list, 
                        'Maximum lesson duration is ' || rule_record.value || ' minutes');
                END IF;
        END CASE;
    END LOOP;
    
    RETURN QUERY SELECT (array_length(conflict_list, 1) IS NULL OR array_length(conflict_list, 1) = 0), conflict_list;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;