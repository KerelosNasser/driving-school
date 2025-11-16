# Calendar Settings Admin Guide

## Overview

The Calendar Settings tab in the admin panel allows you to configure when and how students can book driving lessons. These settings directly control what appears in the Service Center booking calendar.

## Quick Start

1. Navigate to **Admin Panel** → **Calendar Settings** tab
2. Configure your preferences (working hours, buffer time, vacation days)
3. Click **"Save Settings"**
4. Click **"Test Connection"** to verify sync
5. Changes appear in Service Center within 30 seconds

## Settings Explained

### 1. Buffer Time

**What it is:** Time between lessons for travel, preparation, and breaks.

**Recommended:** 15-30 minutes

**Example:**
- Lesson 1: 10:00 - 11:00
- Buffer: 30 minutes
- Next available: 11:30

**Impact:**
- Prevents back-to-back bookings
- Ensures you have time to travel between locations
- Reduces stress and improves service quality

### 2. Working Hours

**What it is:** Hours you're available for lessons each day of the week.

**Configuration:**
- Enable/disable each day
- Set start and end times (30-minute intervals)
- Different hours for different days

**Example Setup:**
```
Monday:    09:00 - 17:00 ✅ Enabled
Tuesday:   09:00 - 17:00 ✅ Enabled
Wednesday: 09:00 - 17:00 ✅ Enabled
Thursday:  09:00 - 17:00 ✅ Enabled
Friday:    09:00 - 17:00 ✅ Enabled
Saturday:  10:00 - 16:00 ❌ Disabled
Sunday:    10:00 - 16:00 ❌ Disabled
```

**Impact:**
- Students can only book during enabled hours
- Disabled days appear grayed out in calendar
- Prevents bookings outside your availability

### 3. Vacation Days

**What it is:** Specific dates when you're unavailable (holidays, personal days, etc.)

**How to add:**
1. Click calendar icon
2. Select date
3. Enter reason (e.g., "Public Holiday", "Personal Leave")
4. Click "Add Vacation Day"

**How to remove:**
- Click trash icon next to vacation day

**Impact:**
- Selected dates are completely blocked
- Students cannot book on these days
- Existing bookings are not affected (cancel separately if needed)

## How Settings Sync to Service Center

### Automatic Sync
- Settings refresh every **30 seconds** in Service Center
- Refresh when user switches back to browser tab
- No manual page reload needed

### Manual Verification
1. Click **"Test Connection"** button in admin panel
2. System checks if Service Center can read settings
3. Shows success ✅ or warning ⚠️ message

### What Students See

**Enabled Working Day:**
- Date appears normal (white background)
- Time slots shown based on working hours
- Can click to book

**Disabled Day:**
- Date appears grayed out
- No time slots available
- Cannot click to book

**Vacation Day:**
- Date appears grayed out
- Marked as unavailable
- Reason visible to admin only

**Past Date:**
- Grayed out automatically
- Cannot book in the past

## Common Scenarios

### Scenario 1: Regular Business Hours
```
Goal: Monday-Friday, 9 AM - 5 PM, 30-minute buffer

Settings:
- Buffer Time: 30 minutes
- Monday-Friday: 09:00 - 17:00 (enabled)
- Saturday-Sunday: disabled
- Vacation Days: none

Result:
- Students see 8 one-hour slots per day (9-10, 10-11, ..., 16-17)
- 30 minutes between each lesson
- Weekends blocked
```

### Scenario 2: Extended Weekend Hours
```
Goal: Longer hours on weekends for working students

Settings:
- Buffer Time: 30 minutes
- Monday-Friday: 09:00 - 17:00 (enabled)
- Saturday: 08:00 - 18:00 (enabled)
- Sunday: disabled
- Vacation Days: none

Result:
- Weekdays: 8 slots (9 AM - 5 PM)
- Saturday: 10 slots (8 AM - 6 PM)
- Sunday: blocked
```

### Scenario 3: Holiday Period
```
Goal: Block Christmas week

Settings:
- Normal working hours
- Vacation Days:
  - Dec 25: "Christmas Day"
  - Dec 26: "Boxing Day"
  - Dec 27-29: "Holiday Break"

Result:
- Dec 25-29 completely blocked
- Students cannot book these dates
- Calendar shows dates as unavailable
```

### Scenario 4: Reduced Hours
```
Goal: Half-day Fridays

Settings:
- Buffer Time: 30 minutes
- Monday-Thursday: 09:00 - 17:00 (enabled)
- Friday: 09:00 - 13:00 (enabled)
- Saturday-Sunday: disabled

Result:
- Mon-Thu: Full day (8 slots)
- Friday: Morning only (4 slots)
- Weekends: blocked
```

## Best Practices

### 1. Buffer Time
- **Too short (<15 min):** Risk of running late, stressed instructor
- **Too long (>45 min):** Fewer bookings, reduced income
- **Sweet spot:** 20-30 minutes for most situations

### 2. Working Hours
- Consider peak demand times (after school, weekends)
- Balance work-life with business needs
- Review and adjust based on booking patterns

### 3. Vacation Days
- Add holidays well in advance
- Communicate with existing students
- Consider partial days (use working hours instead)

### 4. Regular Reviews
- Check settings monthly
- Adjust based on seasonal demand
- Update for public holidays

## Troubleshooting

### Problem: Settings not appearing in Service Center

**Solutions:**
1. Click "Test Connection" to verify sync
2. Wait 30 seconds for auto-refresh
3. Check browser console for errors
4. Verify settings saved successfully
5. Contact support if issue persists

### Problem: Wrong time slots showing

**Check:**
1. Working hours for that specific day
2. Buffer time setting
3. Existing bookings (check admin calendar)
4. Vacation days list

### Problem: Students can't book any dates

**Check:**
1. At least one day is enabled
2. Working hours are set correctly
3. No vacation days blocking all dates
4. Calendar settings saved successfully

### Problem: Buffer time not working

**Verify:**
1. Buffer time value is saved
2. Service Center has refreshed (wait 30 seconds)
3. Check console logs for errors
4. Test with "Test Connection" button

## Testing Your Configuration

### Step-by-Step Test

1. **Configure Settings**
   - Set Monday: 10:00 - 16:00 (enabled)
   - Set Saturday: disabled
   - Buffer time: 30 minutes
   - Save settings

2. **Verify in Admin Panel**
   - Click "Test Connection"
   - Should show ✅ success message

3. **Check Service Center**
   - Open Service Center in another tab
   - Navigate to Quota Management → Calendar
   - Select Monday → Should show 10:00-16:00 slots
   - Select Saturday → Should be grayed out

4. **Test Booking Flow**
   - Select Monday 10:00
   - Book lesson
   - Verify 10:30 is next available (not 10:00)

5. **Test Vacation Day**
   - Add vacation day for tomorrow
   - Save settings
   - Check Service Center → Tomorrow should be grayed out

## Support

If you encounter issues:

1. **Check Documentation:** Review this guide and CALENDAR_SETTINGS_CONNECTIVITY_FIX.md
2. **Test Connection:** Use the "Test Connection" button
3. **Console Logs:** Open browser console (F12) and check for errors
4. **Database:** Verify `calendar_settings` table has data
5. **Contact Support:** Provide screenshots and error messages

## Related Documentation

- `CALENDAR_SETTINGS_CONNECTIVITY_FIX.md` - Technical details of the sync system
- `scripts/test-calendar-settings-sync.js` - Automated testing script
- Admin Dashboard documentation

---

**Last Updated:** 2024
**Version:** 1.0
