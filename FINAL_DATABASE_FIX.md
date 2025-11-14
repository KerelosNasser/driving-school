# ⚡ FINAL DATABASE FIX - Run This Once

## 🎯 Problem
Your `bookings` table is missing multiple columns:
- ❌ `duration`
- ❌ `lesson_type`
- ❌ `location`
- ❌ `notes`
- ❌ `status`
- ❌ `google_calendar_event_id`
- ❌ `hours_used`

## ✅ Complete Solution (1 minute)

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/wfivhauhxhmjskyhosdi/sql

### Step 2: Copy & Paste This SQL
```sql
-- Add ALL missing columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS lesson_type VARCHAR(50) DEFAULT 'Standard';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'confirmed';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hours_used DECIMAL(5,2);

-- Update existing records
UPDATE bookings SET duration = 60 WHERE duration IS NULL;
UPDATE bookings SET lesson_type = 'Standard' WHERE lesson_type IS NULL;
UPDATE bookings SET status = 'confirmed' WHERE status IS NULL;

-- Add constraint
ALTER TABLE bookings ADD CONSTRAINT IF NOT EXISTS bookings_duration_positive CHECK (duration > 0);
```

### Step 3: Click "Run"

### Step 4: Verify
Run this to confirm:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings'
ORDER BY ordinal_position;
```

You should see all these columns:
- ✅ id
- ✅ user_id
- ✅ date
- ✅ time
- ✅ duration
- ✅ lesson_type
- ✅ location
- ✅ notes
- ✅ status
- ✅ google_calendar_event_id
- ✅ hours_used
- ✅ created_at
- ✅ updated_at

---

## 🎉 After Running This

Your booking system will:
- ✅ Accept bookings without errors
- ✅ Store duration (for multi-hour bookings)
- ✅ Store lesson type
- ✅ Store location
- ✅ Store notes
- ✅ Track booking status
- ✅ Link to Google Calendar events
- ✅ Track hours consumed

---

## 🚀 Test It

1. Run the SQL above
2. Go back to your app
3. Try booking a lesson
4. Should work perfectly! ✅

---

**This is the FINAL fix - run it once and you're done!** 🎉
