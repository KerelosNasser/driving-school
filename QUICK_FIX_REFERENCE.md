# Quick Fix Reference - Calendar Settings

## What Was Fixed

### ❌ Problem 1: Time slots don't change according to settings
**Example:** Set Monday 10:00-16:00, but still shows 09:00-17:00

### ✅ Solution
- API now returns day-specific hours (`mondayStart`, `mondayEnd`, etc.)
- Time slot generator uses correct hours for each day
- Each day can have different hours

---

### ❌ Problem 2: Some months block days incorrectly  
**Example:** Vacation day Jan 15 works in January but not February

### ✅ Solution
- Fixed date comparison to use local timezone
- Vacation days now work consistently across all months
- No more off-by-one day errors

---

## Quick Test (2 minutes)

### Test Day-Specific Hours
1. Admin Panel → Calendar Settings
2. Set Monday: 10:00-16:00 ✅
3. Set Tuesday: 09:00-14:00 ✅
4. Save Settings
5. Service Center → Select Monday → Should show 10:00-16:00
6. Select Tuesday → Should show 09:00-14:00

### Test Vacation Days
1. Admin Panel → Calendar Settings
2. Add vacation: Tomorrow's date
3. Save Settings
4. Service Center → Navigate to tomorrow
5. Should be grayed out ✅

---

## Verify Fix is Working

### Option 1: Test Page (Easiest)
```
Navigate to: /test-calendar-settings
```
- Shows all settings in readable format
- Validates each day's configuration
- Shows vacation days list

### Option 2: Browser Console
```
1. Open Service Center
2. Press F12
3. Look for: "⏰ [TimeSlotsView] Working hours for monday: 10:00 - 16:00"
```

### Option 3: API Call
```javascript
fetch('/api/calendar/settings').then(r => r.json()).then(console.log)
```
Should show: `mondayStart: "10:00"`, `mondayEnd: "16:00"`, etc.

---

## Common Issues

### Issue: Still showing wrong hours
**Fix:** Wait 30 seconds for auto-refresh, or reload page

### Issue: All days grayed out
**Fix:** Enable at least one day in Admin Panel → Calendar Settings

### Issue: Vacation days not working
**Fix:** Check date format is YYYY-MM-DD in database

---

## Files Changed

1. `app/api/calendar/settings/route.ts` - Returns day-specific settings
2. `app/service-center/components/QuotaManagementTab.tsx` - Uses day-specific hours
3. `app/test-calendar-settings/page.tsx` - NEW: Test page to verify settings

---

## Key Settings Format

```javascript
{
  // General
  bufferTimeMinutes: 30,
  lessonDurationMinutes: 60,
  
  // Day-specific (for each day)
  mondayEnabled: true,
  mondayStart: "09:00",
  mondayEnd: "17:00",
  
  tuesdayEnabled: true,
  tuesdayStart: "10:00",
  tuesdayEnd: "16:00",
  
  // ... for all 7 days
  
  // Vacation days
  vacationDays: ["2024-01-15", "2024-02-20"]
}
```

---

## Need Help?

1. **Test Page:** `/test-calendar-settings`
2. **Console Logs:** Press F12 in browser
3. **Admin Test:** Click "Test Connection" button
4. **Full Guide:** See `CALENDAR_DEBUGGING_GUIDE.md`

---

**Status:** ✅ Fixed
**Test:** `/test-calendar-settings`
