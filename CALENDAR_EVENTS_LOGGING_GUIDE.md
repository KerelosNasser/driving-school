# 📊 Calendar Events Logging - Debug Guide

## ✅ Comprehensive Logging Added

I've added detailed logging to track exactly what's happening when events are fetched from Google Calendar.

---

## 🔍 What's Being Logged

### 1. API Request Level (`/api/calendar/events`)
```
📅 [CALENDAR EVENTS API] Request received
📅 [CALENDAR EVENTS API] Month/Day/Generic range
📅 [CALENDAR EVENTS API] Fetching admin/public events
📅 [CALENDAR EVENTS API] Events fetched with count and details
📅 [CALENDAR EVENTS API] Returning response
```

### 2. Service Level (`EnhancedCalendarService.getAdminEvents`)
```
🔍 [getAdminEvents] Starting fetch
🔍 [getAdminEvents] Using calendar ID
🔍 [getAdminEvents] Fetching page 1, 2, 3...
🔍 [getAdminEvents] Page X events (with full details)
✅ [getAdminEvents] Total events fetched
✅ [getAdminEvents] All events with timestamps
✅ [getAdminEvents] Transformed events count
```

---

## 🧪 How to See the Logs

### 1. Open Your Terminal
Where you're running `npm run dev`

### 2. Select a Date in Your App
Go to Service Center and click on a date

### 3. Watch the Terminal
You'll see detailed logs like:

```
📅 [CALENDAR EVENTS API] Request received: {
  date: '2025-01-13',
  admin: true,
  eventType: 'events'
}

📅 [CALENDAR EVENTS API] Day range: {
  date: '2025-01-13',
  startDate: '2025-01-13T00:00:00.000Z',
  endDate: '2025-01-14T00:00:00.000Z'
}

🔍 [getAdminEvents] Starting fetch: {
  startDate: '2025-01-13T00:00:00.000Z',
  endDate: '2025-01-14T00:00:00.000Z'
}

🔍 [getAdminEvents] Using calendar ID: lj4hsl9jtv32ulq7riatg6i8ro@group.calendar.google.com

🔍 [getAdminEvents] Fetching page 1...

🔍 [getAdminEvents] Page 1 response: {
  itemsCount: 3,
  hasNextPage: false
}

🔍 [getAdminEvents] Page 1 events: [
  {
    id: 'abc123',
    summary: 'Driving Lesson',
    start: '2025-01-13T09:00:00+10:00',
    end: '2025-01-13T10:00:00+10:00'
  },
  {
    id: 'def456',
    summary: 'Test Prep',
    start: '2025-01-13T11:00:00+10:00',
    end: '2025-01-13T12:00:00+10:00'
  },
  {
    id: 'ghi789',
    summary: 'Highway Lesson',
    start: '2025-01-13T14:00:00+10:00',
    end: '2025-01-13T15:00:00+10:00'
  }
]

✅ [getAdminEvents] Total events fetched: 3

✅ [getAdminEvents] All events: [
  {
    id: 'abc123',
    summary: 'Driving Lesson',
    start: '2025-01-13T09:00:00+10:00',
    end: '2025-01-13T10:00:00+10:00',
    timestamp: '1/13/2025, 9:00:00 AM'
  },
  ...
]

✅ [getAdminEvents] Transformed events: 3

📅 [CALENDAR EVENTS API] Admin events fetched: {
  count: 3,
  events: [...]
}
```

---

## 🎯 What to Look For

### ✅ Good Signs:
- `itemsCount: 3` (or more) - Events are being fetched
- `Total events fetched: 3` - All events retrieved
- Events show correct timestamps
- All events for the day are listed

### ❌ Problem Signs:
- `itemsCount: 0` - No events found
- `itemsCount: 1` when you have more - Only getting first event
- Missing events in the list
- Wrong date range

---

## 🐛 Common Issues & What Logs Will Show

### Issue 1: Only First Event Showing
**Logs will show:**
```
🔍 [getAdminEvents] Page 1 response: {
  itemsCount: 1,  // ❌ Should be more
  hasNextPage: false
}
```

**Cause**: Date range might be too narrow or events are on different days

### Issue 2: No Events Found
**Logs will show:**
```
🔍 [getAdminEvents] Page 1 response: {
  itemsCount: 0,  // ❌ No events
  hasNextPage: false
}
```

**Cause**: 
- Wrong calendar ID
- Date range doesn't match event dates
- Calendar not shared with service account

### Issue 3: Wrong Timestamps
**Logs will show:**
```
✅ [getAdminEvents] All events: [
  {
    timestamp: '1/13/2025, 9:00:00 AM'  // Check if this matches your calendar
  }
]
```

**Cause**: Timezone mismatch

---

## 📋 Debugging Checklist

When you see the logs, check:

1. **Date Range**:
   - [ ] `startDate` and `endDate` are correct
   - [ ] They cover the full day (00:00 to 23:59)

2. **Calendar ID**:
   - [ ] Matches your Google Calendar ID
   - [ ] `lj4hsl9jtv32ulq7riatg6i8ro@group.calendar.google.com`

3. **Events Count**:
   - [ ] `itemsCount` matches number of events in Google Calendar
   - [ ] All events are listed in the logs

4. **Timestamps**:
   - [ ] Event times match what's in Google Calendar
   - [ ] Timezone is correct (Australia/Brisbane)

5. **Pagination**:
   - [ ] If you have many events, check for multiple pages
   - [ ] `hasNextPage: true` means more events to fetch

---

## 🔧 How to Use This Info

### Step 1: Test with Known Events
1. Create 3 events in Google Calendar on the same day
2. Note the times (e.g., 9:00 AM, 11:00 AM, 2:00 PM)
3. Select that date in your app
4. Check terminal logs

### Step 2: Verify Event Count
```
✅ [getAdminEvents] Total events fetched: 3  // Should match your calendar
```

### Step 3: Verify Event Details
```
✅ [getAdminEvents] All events: [
  { summary: 'Event 1', start: '...', timestamp: '...' },
  { summary: 'Event 2', start: '...', timestamp: '...' },
  { summary: 'Event 3', start: '...', timestamp: '...' }
]
```

### Step 4: Check UI
- All 3 time slots should show as unavailable
- Correct times should be blocked

---

## 💡 Pro Tips

### Enable More Detailed Logs
The logs now show:
- ✅ Every API request
- ✅ Date range calculations
- ✅ Calendar ID being used
- ✅ Each page of results
- ✅ Every event with full details
- ✅ Timestamps in readable format
- ✅ Transformation results

### Save Logs to File
```bash
npm run dev > calendar-logs.txt 2>&1
```

Then search the file for specific dates or events.

---

## 🎉 What This Solves

With these logs, you can now see:
1. **Exactly how many events** are being fetched
2. **Which events** are being returned
3. **What timestamps** they have
4. **If pagination** is working correctly
5. **Where the problem** is (API, service, or transformation)

---

**Now restart your dev server and test!** 🚀

```bash
npm run dev
```

Then select a date and watch your terminal for detailed logs showing exactly what's happening with your calendar events.
