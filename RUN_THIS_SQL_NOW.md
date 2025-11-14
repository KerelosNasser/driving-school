# ⚡ RUN THIS SQL NOW - Fix Booking Error

## 🎯 Problem
```
Could not find the 'duration' column of 'bookings' in the schema cache
```

## ✅ Solution (30 seconds)

### 1. Open Supabase
Go to: https://supabase.com/dashboard/project/wfivhauhxhmjskyhosdi/sql

### 2. Paste This SQL
```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60;
UPDATE bookings SET duration = 60 WHERE duration IS NULL;
ALTER TABLE bookings ADD CONSTRAINT IF NOT EXISTS bookings_duration_positive CHECK (duration > 0);
```

### 3. Click "Run"

### 4. Done! ✅

---

## 🧪 Test It
1. Go back to your app
2. Try booking a lesson
3. Should work now!

---

**That's it!** The booking system will work after running this SQL.

See `DATABASE_SCHEMA_FIX.md` for detailed explanation.
