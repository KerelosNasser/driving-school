# Testing Profile Completion Feature

## 🧪 Test Scenarios

### Scenario 1: New User (No Profile Data)
**Expected Behavior:**
1. Navigate to Service Center → Quota tab
2. Select a date and time slot
3. Click "Book Lesson"
4. ✅ Modal should appear showing all missing fields
5. Fill in Phone and Address (critical fields)
6. Click "Save & Continue"
7. ✅ Modal closes and booking proceeds

**Console Output:**
```
⚠️ Profile incomplete - missing critical fields: ['phone', 'address']
📋 Current profile data: { fullName: '', phone: '', address: '', ... }
```

### Scenario 2: Partial Profile (Has Phone, Missing Address)
**Expected Behavior:**
1. User has phone but no address
2. Try to book a lesson
3. ✅ Modal shows only missing critical field (address)
4. Fill in address
5. ✅ Booking proceeds

**Console Output:**
```
⚠️ Profile incomplete - missing critical fields: ['address']
```

### Scenario 3: Complete Profile
**Expected Behavior:**
1. User has all critical fields (phone + address)
2. Try to book a lesson
3. ✅ No modal appears
4. ✅ Booking proceeds directly

**Console Output:**
```
(No warnings - profile is complete)
```

### Scenario 4: Profile Completion Badge
**Expected Behavior:**
1. Navigate to Service Center
2. Look at header below "Service Center" title
3. ✅ Badge shows completion percentage
4. Colors:
   - 🔴 Red "Complete Profile" - Missing critical fields
   - 🟡 Yellow "Profile 50%" - Has critical, missing others
   - 🟢 Green "Profile Complete" - 100% complete

### Scenario 5: Profile Tab
**Expected Behavior:**
1. Navigate to Service Center → Profile tab
2. ✅ See UserDataDisplay showing stats
3. ✅ See UserDataReview showing profile details
4. Can edit profile directly from here

## 🔍 What to Check

### Visual Elements
- [ ] Profile completion badge in header
- [ ] Modal appears when booking with incomplete profile
- [ ] Modal shows only missing fields
- [ ] Fields are color-coded (red=critical, orange=important, gray=optional)
- [ ] Progress bar shows completion percentage
- [ ] Icons next to each field
- [ ] Helpful descriptions under each field

### Functionality
- [ ] Can't book without phone and address
- [ ] Can book with just phone and address
- [ ] Form validates phone numbers
- [ ] Form saves data to database
- [ ] Profile refreshes after save
- [ ] Booking proceeds automatically after completion
- [ ] Toast notifications appear

### Error Handling
- [ ] No console errors
- [ ] Handles null/undefined data gracefully
- [ ] Shows error message if API fails
- [ ] Can retry after error

## 🐛 Common Issues & Fixes

### Issue: Modal doesn't appear
**Fix:** Check console for errors. Profile data might not be loading.
```javascript
// Check in browser console:
console.log('Profile data:', profileData);
console.log('Can book:', canBook);
console.log('Missing fields:', missingFields);
```

### Issue: "Cannot read properties of null"
**Fix:** Already fixed! But if it happens:
- Check that `initialData` has default values
- Check that `profileData` is not null in hook
- Verify API returns proper data structure

### Issue: Form doesn't save
**Fix:** Check network tab for API call to `/api/user/profile`
- Should be PATCH request
- Should return updated profile
- Check Supabase for updated data

### Issue: Booking still fails after completing profile
**Fix:** 
- Click "Refresh" button to reload quota
- Check that `refreshProfile()` is called after save
- Verify profile data is actually saved in database

## 📊 Database Check

### Verify Profile Data in Supabase
```sql
-- Check user profile
SELECT 
  id,
  email,
  full_name,
  phone,
  address,
  suburb,
  emergency_contact,
  created_at,
  updated_at
FROM users
WHERE clerk_id = 'your_clerk_user_id';
```

### Expected Data Structure
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "phone": "+61 400 000 000",
  "address": "123 Main St, Brisbane",
  "suburb": "Brisbane CBD",
  "emergency_contact": {
    "name": "Jane Doe",
    "phone": "+61 400 000 001",
    "relationship": "Spouse"
  }
}
```

## ✅ Success Criteria

All of these should work:
1. ✅ Modal appears when profile incomplete
2. ✅ Modal shows correct missing fields
3. ✅ Form validates input
4. ✅ Form saves to database
5. ✅ Profile refreshes after save
6. ✅ Booking proceeds after completion
7. ✅ Badge shows correct status
8. ✅ No console errors
9. ✅ No TypeScript errors
10. ✅ Works on mobile and desktop

## 🎯 Quick Test Script

Run this in browser console to test:
```javascript
// 1. Check profile status
const checkProfile = async () => {
  const res = await fetch('/api/user');
  const data = await res.json();
  console.log('Profile:', data.user);
};

// 2. Update profile
const updateProfile = async () => {
  const res = await fetch('/api/user/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: '+61 400 000 000',
      address: '123 Test St, Brisbane',
      full_name: 'Test User'
    })
  });
  const data = await res.json();
  console.log('Updated:', data);
};

// Run tests
checkProfile();
// updateProfile(); // Uncomment to test update
```
