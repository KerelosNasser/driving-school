-- Create scheduling constraints table
CREATE TABLE scheduling_constraints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  constraint_type TEXT NOT NULL CHECK (constraint_type IN ('unavailable', 'preferred', 'blocked')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create working hours table
CREATE TABLE working_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(instructor_id, day_of_week)
);

-- Create indexes for performance
CREATE INDEX idx_scheduling_constraints_instructor ON scheduling_constraints(instructor_id);
CREATE INDEX idx_scheduling_constraints_dates ON scheduling_constraints(start_date, end_date);
CREATE INDEX idx_working_hours_instructor ON working_hours(instructor_id);
CREATE INDEX idx_working_hours_day ON working_hours(day_of_week);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_scheduling_constraints_updated_at 
  BEFORE UPDATE ON scheduling_constraints 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_working_hours_updated_at 
  BEFORE UPDATE ON working_hours 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE scheduling_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;

-- RLS policies for scheduling_constraints
CREATE POLICY "Instructors can manage their own constraints" ON scheduling_constraints
  FOR ALL USING (auth.uid() = instructor_id);

CREATE POLICY "Admins can manage all constraints" ON scheduling_constraints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS policies for working_hours
CREATE POLICY "Instructors can manage their own working hours" ON working_hours
  FOR ALL USING (auth.uid() = instructor_id);

CREATE POLICY "Admins can manage all working hours" ON working_hours
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Function to check time slot availability
CREATE OR REPLACE FUNCTION check_time_slot_availability(
  p_instructor_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
  day_of_week INTEGER;
  working_hours_count INTEGER;
  constraint_count INTEGER;
  booking_count INTEGER;
BEGIN
  -- Get day of week (0 = Sunday)
  day_of_week := EXTRACT(DOW FROM p_start_time);
  
  -- Check if instructor has working hours for this day
  SELECT COUNT(*) INTO working_hours_count
  FROM working_hours
  WHERE instructor_id = p_instructor_id
    AND day_of_week = day_of_week
    AND is_active = true
    AND p_start_time::TIME >= start_time
    AND p_end_time::TIME <= end_time;
  
  IF working_hours_count = 0 THEN
    RETURN false;
  END IF;
  
  -- Check for scheduling constraints
  SELECT COUNT(*) INTO constraint_count
  FROM scheduling_constraints
  WHERE instructor_id = p_instructor_id
    AND constraint_type IN ('unavailable', 'blocked')
    AND p_start_time < end_date
    AND p_end_time > start_date;
  
  IF constraint_count > 0 THEN
    RETURN false;
  END IF;
  
  -- Check for existing bookings (assuming bookings table exists)
  SELECT COUNT(*) INTO booking_count
  FROM bookings
  WHERE instructor_id = p_instructor_id
    AND status IN ('scheduled', 'confirmed')
    AND p_start_time < end_time
    AND p_end_time > start_time;
  
  IF booking_count > 0 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;