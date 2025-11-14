# 🔧 Database Schema Fix - Missing Duration Column

## ❌ Error
```
Database error: {
  code: 'PGRST204',
  message: "Could not find the 'duration' column of 'bookings' in the schema cache"
}
```

## 🎯 Root Cause
The `bookings` table is missing the `duration` column that the booking API expects.

---

## ✅ Quick Fix (2 minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `wfivhauhxhmjskyhosdi`
3. Click **SQL Editor** in the left sidebar

### Step 2: Run This SQL
Copy and paste this into the SQL Editor:

```sql
-- Add duration column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60;

-- Update existing records
UPDATE bookings 
SET duration = 60 
WHERE duration IS NULL;

-- Add constraint
ALTER TABLE bookings 
ADD CONSTRAINT IF NOT EXISTS bookings_duration_positive 
CHECK (duration > 0);
```

### Step 3: Click "Run"
The query should execute successfully.

### Step 4: Verify
Run this to confirm:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'duration';
```

You should see:
```
column_name | data_type | column_default
duration    | integer   | 60
```

---

## 🔍 What This Does

### Adds `duration` Column
- **Type**: INTEGER
- **Default**: 60 (minutes)
- **Purpose**: Stores lesson duration in minutes

### Updates Existing Records
- Sets duration = 60 for any existing bookings
- Ensures no NULL values

### Adds Constraint
- Ensures duration is always positive
- Prevents invalid data

---

## 🚀 After Running the SQL

### Test the Booking
1. Go to Service Center
2. Try booking a lesson
3. Should work without errors!

### Expected Behavior
- ✅ Booking creates successfully
- ✅ Duration stored in database
- ✅ Hours calculated correctly
- ✅ No more PGRST204 errors

---

## 📊 Complete Bookings Table Schema

After the fix, your `bookings` table should have:

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER DEFAULT 60,  -- ✅ ADDED
  lesson_type VARCHAR(50),
  location VARCHAR(255),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  google_calendar_event_id VARCHAR(255),
  hours_used DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 Alternative: Use Supabase CLI

If you prefer using the CLI:

```bash
# 1. Install Supabase CLI (if not installed)
npm install -g supabase

# 2. Link to your project
supabase link --project-ref wfivhauhxhmjskyhosdi

# 3. Run migration
supabase db push
```

---

## 🐛 Why This Happened

### Possible Causes:
1. **Migration not run**: The initial schema didn't include `duration`
2. **Manual table creation**: Table created without all columns
3. **Schema drift**: Code updated but database wasn't

### Prevention:
- Always run migrations after schema changes
- Use version control for database schema
- Test locally before deploying

---

## ✅ Verification Checklist

After running the SQL:

- [ ] SQL executed without errors
- [ ] `duration` column exists in `bookings` table
- [ ] Default value is 60
- [ ] Constraint added successfully
- [ ] Existing bookings updated
- [ ] New bookings work correctly
- [ ] No more PGRST204 errors

---

## 🆘 Troubleshooting

### Error: "column already exists"
```sql
-- Check if column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'duration';
```

If it exists, the issue might be cache. Try:
```sql
-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
```

### Error: "permission denied"
Make sure you're using the **service role key** or have admin access.

### Error: "constraint already exists"
```sql
-- Drop and recreate constraint
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_duration_positive;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_duration_positive 
CHECK (duration > 0);
```

---

## 📝 Notes

### Duration Values:
- **60 minutes** = 1 hour lesson (default)
- **90 minutes** = 1.5 hour lesson
- **120 minutes** = 2 hour lesson

### Hours Calculation:
```javascript
const hoursUsed = duration / 60;
// 60 minutes = 1.0 hours
// 90 minutes = 1.5 hours
// 120 minutes = 2.0 hours
```

---

## 🎉 Success!

Once you run the SQL:
- ✅ Database schema fixed
- ✅ Bookings will work
- ✅ Duration tracked properly
- ✅ Hours calculated correctly

---

**Run the SQL now and your booking system will work perfectly!** 🚀

The file `FIX_DATABASE_SCHEMA.sql` contains the exact SQL you need to run.
