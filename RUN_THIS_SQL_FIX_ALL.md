# ⚡ RUN THIS SQL - Fix All Database Issues

## 🎯 Problems
```
1. Could not find the 'duration' column
2. Could not find the 'lesson_type' column
```

## ✅ Solution (30 seconds)

### 1. Open Supabase
Go to: https://supabase.com/dashboard/project/wfivhauhxhmjskyhosdi/sql

### 2. Paste This SQL (Fixes Everything)
```sql
-- Add missing columns
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS lesson_type VARCHAR(50) DEFAULT 'Standard';

-- Update existing records
UPDATE bookings SET duration = 60 WHERE duration IS NULL;
UPDATE bookings SET lesson_type = 'Standard' WHERE lesson_type IS NULL;

-- Add constraint
ALTER TABLE bookings ADD CONSTRAINT IF NOT EXISTS bookings_duration_positive CHECK (duration > 0);
```

### 3. Click "Run"

### 4. Done! ✅

---

## 🧪 Test It
1. Go back to your app
2. Try booking a lesson with multiple hours
3. Should work perfectly now!

---

## 📊 What This Does

### Adds `duration` Column:
- Type: INTEGER
- Default: 60 (minutes)
- Purpose: Stores lesson duration

### Adds `lesson_type` Column:
- Type: VARCHAR(50)
- Default: 'Standard'
- Purpose: Stores lesson type (Standard, Highway, Test Prep, etc.)

---

**That's it!** Your booking system will work after running this SQL.

The new multi-hour booking feature will now work correctly! 🚀
