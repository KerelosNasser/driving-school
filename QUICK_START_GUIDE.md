# 🚀 Quick Start Guide - New Booking Features

## ⚡ 5-Minute Setup

### 1. Verify Installation ✅
All dependencies are already installed:
- `@react-email/render` ✓
- Email templates created ✓
- API endpoints configured ✓

### 2. Test the System

#### As a Student:
```
1. Go to: http://localhost:3000/service-center
2. Complete profile form (if first time)
3. Book a lesson
4. Check your email for confirmation
```

#### As Admin:
```
1. Go to: http://localhost:3000/admin
2. Check email for booking notification
3. Click "Bookings" tab
4. Find a booking and click "Cancel"
5. Enter reason and confirm
6. Verify student receives cancellation email
```

---

## 📧 Email Configuration

### Current Setup:
```env
RESEND_API_KEY=re_kDvdZwRY_Gj5QUmmLCunjBYtcihXXpRtP ✓
NEXT_PUBLIC_ADMIN_EMAIL=emealghobrial@gmail.com ✓
NEXT_PUBLIC_APP_URL=http://localhost:3000 ✓
```

### Email Addresses:
- **From**: `EG Driving School <noreply@egdrivingschool.com>`
- **Admin**: `emealghobrial@gmail.com`
- **Students**: Their registered email

---

## 🎯 Key Features

### 1. Booking Confirmation
**Trigger**: When student books a lesson
**Emails Sent**:
- ✅ Confirmation to student
- ✅ Notification to admin

**What Happens**:
- Hours deducted from student balance
- Calendar events created
- Booking saved to database
- Emails sent automatically

### 2. Admin Cancellation
**Trigger**: Admin clicks "Cancel" button
**Required**: Cancellation reason (min 10 chars)

**What Happens**:
- Calendar event removed
- Booking status → "cancelled"
- Hours refunded to student
- Cancellation email sent to student

### 3. Profile Form
**Trigger**: First visit to service center
**Shows**: Automatically as popup
**Collects**:
- Contact info (name, phone, address)
- Experience level
- Learning goals
- Emergency contact
- Medical conditions (optional)

---

## 🔍 Quick Checks

### Is Everything Working?

✅ **Profile Form Shows**:
- Visit `/service-center` as new user
- Form should popup automatically
- Complete and submit

✅ **Booking Creates Emails**:
- Book a lesson
- Check student email inbox
- Check admin email inbox

✅ **Cancellation Works**:
- Go to admin panel
- Click "Cancel" on a booking
- Enter reason and confirm
- Check student email

✅ **Hours Management**:
- Check quota before booking
- Book lesson
- Verify hours deducted
- Cancel booking
- Verify hours refunded

---

## 🎨 Email Preview

### Confirmation Email (Student):
```
🎉 Booking Confirmed!
Your driving lesson is all set

Hi [Student Name],

Great news! Your driving lesson has been successfully booked...

📅 Lesson Details
Date: [Date]
Time: [Time]
Duration: [Duration]
Lesson Type: [Type]

⏱️ Hours Update
Hours Consumed: [X] hours
Remaining Balance: [Y] hours

[View My Dashboard Button]
```

### Notification Email (Admin):
```
📋 New Booking Alert
A new lesson has been booked

👤 Student Information
Name: [Name]
Email: [Email]
Phone: [Phone]
Experience: [Level]

📅 Lesson Details
[Complete booking info]

[View in Admin Panel] [Cancel Booking]
```

### Cancellation Email (Student):
```
Booking Cancelled
Your lesson has been cancelled

Hi [Student Name],

We're writing to inform you that your driving lesson has been cancelled...

📝 Reason for Cancellation
[Admin's reason]

✅ Hours Refunded
Hours Refunded: +[X] hours
New Balance: [Y] hours

[Book Another Lesson Button]
```

---

## 🐛 Common Issues & Fixes

### Issue: Profile form doesn't show
**Fix**: 
- Clear browser cache
- Check user is not admin
- Try incognito mode

### Issue: Emails not received
**Fix**:
- Check spam folder
- Verify Resend API key
- Check server logs

### Issue: Cancel button missing
**Fix**:
- Verify admin role
- Check booking not already cancelled
- Refresh page

### Issue: Hours not refunding
**Fix**:
- Check database connection
- Verify RPC function exists
- Check server logs

---

## 📱 Mobile Testing

All emails are mobile-responsive. Test on:
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] iPad (Safari)
- [ ] Desktop (Chrome, Firefox, Safari)

---

## 🎓 Admin Training

### How to Cancel a Booking:

1. **Navigate**: Admin Dashboard → Bookings tab
2. **Find**: Locate the booking to cancel
3. **Click**: Red "Cancel" button
4. **Reason**: Enter detailed reason (min 10 characters)
5. **Confirm**: Click "Cancel Booking"
6. **Verify**: 
   - Status changes to "cancelled"
   - Student receives email
   - Hours refunded

### Best Practices:
- ✅ Be specific in cancellation reasons
- ✅ Cancel as early as possible
- ✅ Consider calling for urgent cancellations
- ✅ Check student received email

---

## 📊 Monitoring

### Check These Regularly:

1. **Resend Dashboard**:
   - Email delivery rates
   - Open rates
   - Bounce rates

2. **Database**:
   - Booking statuses
   - Quota transactions
   - User profiles

3. **Server Logs**:
   - API errors
   - Email failures
   - Calendar sync issues

---

## 🎉 You're All Set!

Everything is configured and ready to use. The system will:
- ✅ Automatically send emails
- ✅ Manage hours
- ✅ Track bookings
- ✅ Handle cancellations

**No additional setup required!**

---

## 📞 Quick Reference

### Important URLs:
- Service Center: `/service-center`
- Admin Panel: `/admin`
- Bookings Tab: `/admin` (Bookings tab)

### Key Files:
- Email Templates: `components/emails/`
- Booking API: `app/api/calendar/book/route.ts`
- Cancel API: `app/api/admin/bookings/[id]/cancel/route.ts`
- Email API: `app/api/send-booking-email/route.ts`

### Environment Variables:
```env
RESEND_API_KEY=your_key
NEXT_PUBLIC_ADMIN_EMAIL=admin@email.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

**Ready to go!** 🚀 Start testing and enjoy your new professional booking system!
