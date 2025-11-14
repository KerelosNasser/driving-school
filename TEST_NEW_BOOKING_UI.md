# ⚡ Test New Booking UI - Quick Guide

## 🚀 Start Testing (30 seconds)

### 1. Restart Dev Server
```bash
# Press Ctrl+C to stop
npm run dev
```

### 2. Go to Service Center
```
http://localhost:3000/service-center
```

### 3. Test Features

#### ✅ Date Selection (2-3 tiles per row)
- Click any date tile
- Should see time slots load
- Try different dates

#### ✅ Consecutive Time Slots
**Should Work:**
- Select 9:00
- Select 10:00
- Select 11:00
- All turn green ✓

**Should Fail:**
- Select 9:00
- Select 10:00
- Select 1:00 (skip 11:00 and 12:00)
- Error message appears ✓

#### ✅ FreeBusy Events
- Create multiple events on same day in Google Calendar
- Select that date
- ALL events should show as unavailable ✓

---

## 🎯 What to Look For

### Date Tiles:
- [ ] 2-3 tiles per row
- [ ] Shows day, date, month
- [ ] "Today" indicator
- [ ] Responsive on mobile

### Time Slots:
- [ ] Grid layout (2-4 per row)
- [ ] Green when selected
- [ ] Gray when unavailable
- [ ] Shows reason for unavailability

### Booking:
- [ ] Can select multiple hours
- [ ] Must be consecutive
- [ ] Shows total hours
- [ ] Deducts correct amount

---

## 🐛 Known Issues Fixed

✅ FreeBusy now shows ALL events (not just 1)
✅ Consecutive validation works
✅ Better mobile UX
✅ Cleaner state management

---

**That's it!** Test the new UI and enjoy the improved experience! 🎉
