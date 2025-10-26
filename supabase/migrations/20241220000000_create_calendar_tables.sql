-- Create calendar_settings table
CREATE TABLE IF NOT EXISTS calendar_settings (
    id SERIAL PRIMARY KEY,
    buffer_time_minutes INTEGER DEFAULT 15,
    monday_start TIME DEFAULT '09:00',
    monday_end TIME DEFAULT '17:00',
    monday_enabled BOOLEAN DEFAULT true,
    tuesday_start TIME DEFAULT '09:00',
    tuesday_end TIME DEFAULT '17:00',
    tuesday_enabled BOOLEAN DEFAULT true,
    wednesday_start TIME DEFAULT '09:00',
    wednesday_end TIME DEFAULT '17:00',
    wednesday_enabled BOOLEAN DEFAULT true,
    thursday_start TIME DEFAULT '09:00',
    thursday_end TIME DEFAULT '17:00',
    thursday_enabled BOOLEAN DEFAULT true,
    friday_start TIME DEFAULT '09:00',
    friday_end TIME DEFAULT '17:00',
    friday_enabled BOOLEAN DEFAULT true,
    saturday_start TIME DEFAULT '10:00',
    saturday_end TIME DEFAULT '16:00',
    saturday_enabled BOOLEAN DEFAULT false,
    sunday_start TIME DEFAULT '10:00',
    sunday_end TIME DEFAULT '16:00',
    sunday_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vacation_days table
CREATE TABLE IF NOT EXISTS vacation_days (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vacation_days_date ON vacation_days(date);

-- Insert default calendar settings if none exist
INSERT INTO calendar_settings (buffer_time_minutes) 
SELECT 15 
WHERE NOT EXISTS (SELECT 1 FROM calendar_settings);

-- Enable Row Level Security
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_days ENABLE ROW LEVEL SECURITY;

-- Create policies for calendar_settings (allow all operations for authenticated users)
DROP POLICY IF EXISTS "Allow all operations for authenticated users on calendar_settings" ON calendar_settings;
CREATE POLICY "Allow all operations for authenticated users on calendar_settings" 
ON calendar_settings FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create policies for vacation_days (allow all operations for authenticated users)
DROP POLICY IF EXISTS "Allow all operations for authenticated users on vacation_days" ON vacation_days;
CREATE POLICY "Allow all operations for authenticated users on vacation_days" 
ON vacation_days FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);