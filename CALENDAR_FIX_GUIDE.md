# 🔧 Google Calendar Integration Fix Guide

## 🎯 Problem Summary

Your calendar integration isn't working because:
1. Service account credentials aren't properly configured
2. Calendar ID isn't specified (defaults to 'primary' which doesn't work for service accounts)
3. Admin calendar needs to be shared with the service account
4. Environment variables need proper formatting

---

## ✅ Step-by-Step Fix

### Step 1: Get Your Service Account Email

From your GCP Console:
1. Go to **IAM & Admin** → **Service Accounts**
2. Find your service account
3. Copy the email (looks like: `your-service@project-id.iam.gserviceaccount.com`)

### Step 2: Share Your Google Calendar

**CRITICAL**: Your admin calendar MUST be shared with the service account!

1. Open **Google Calendar** (calendar.google.com)
2. Find the calendar you want to use (usually your primary calendar)
3. Click the **3 dots** next to the calendar name → **Settings and sharing**
4. Scroll to **Share with specific people**
5. Click **Add people**
6. Paste your **service account email**
7. Set permission to **"Make changes to events"**
8. Click **Send**

### Step 3: Get Your Calendar ID

1. In Calendar settings, scroll to **Integrate calendar**
2. Copy the **Calendar ID** (usually your email or a long string)
3. Save this for your `.env.local`

### Step 4: Configure Environment Variables

Add these to your `.env.local`:

```env
# Service Account Credentials
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service@project-id.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"

# Calendar Configuration
GOOGLE_CALENDAR_ID=your-email@gmail.com
# OR if using a specific calendar:
# GOOGLE_CALENDAR_ID=abc123def456@group.calendar.google.com

# Admin Email (for reference)
NEXT_PUBLIC_ADMIN_EMAIL=your-email@gmail.com

# OAuth Credentials (if you have them)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/calendar/oauth/callback
```

**IMPORTANT**: The private key must:
- Be wrapped in quotes
- Have `\n` for newlines (not actual newlines)
- Include the BEGIN and END markers

### Step 5: Verify Service Account Permissions

In GCP Console:
1. Go to **APIs & Services** → **Enabled APIs**
2. Ensure **Google Calendar API** is enabled
3. Go to **IAM & Admin** → **Service Accounts**
4. Click your service account
5. Go to **Keys** tab
6. If no key exists, create one (JSON format)
7. Open the JSON file and copy:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

---

## 🧪 Test the Connection

### Test 1: Check Service Account

Create a test file `test-calendar.js`:

```javascript
const { google } = require('googleapis');

async function testCalendar() {
  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    console.log('✅ Calendar connection successful!');
    console.log(`Found ${response.data.items?.length || 0} events`);
    
    if (response.data.items && response.data.items.length > 0) {
      console.log('\nUpcoming events:');
      response.data.items.forEach(event => {
        console.log(`- ${event.summary} (${event.start?.dateTime || event.start?.date})`);
      });
    }
  } catch (error) {
    console.error('❌ Calendar connection failed:', error.message);
    if (error.message.includes('Not Found')) {
      console.error('\n⚠️  Calendar not found or not shared with service account!');
      console.error('Make sure to share your calendar with:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    }
  }
}

testCalendar();
```

Run it:
```bash
node test-calendar.js
```

### Test 2: Check API Endpoint

```bash
curl http://localhost:3000/api/calendar/connection
```

Should return:
```json
{
  "connected": true,
  "status": "connected",
  "message": "Calendar successfully connected via service account"
}
```

---

## 🔍 Common Issues & Solutions

### Issue 1: "Calendar not found" or 404 Error

**Solution**: Calendar isn't shared with service account
- Go to Google Calendar settings
- Share calendar with service account email
- Set permission to "Make changes to events"

### Issue 2: "Invalid credentials" or 401 Error

**Solution**: Private key formatting issue
- Ensure private key has `\n` for newlines
- Wrap in quotes in `.env.local`
- No extra spaces or characters

### Issue 3: "Insufficient permissions" or 403 Error

**Solution**: Service account needs proper scopes
- Check that Calendar API is enabled in GCP
- Verify service account has calendar scopes
- Ensure calendar is shared with "Make changes" permission

### Issue 4: Events not showing as unavailable

**Solution**: Calendar ID mismatch
- Verify `GOOGLE_CALENDAR_ID` matches the shared calendar
- Check that events exist in that specific calendar
- Ensure service account can read the calendar

### Issue 5: Bookings not creating events

**Solution**: Missing write permissions
- Calendar must be shared with "Make changes to events"
- Not just "See all event details"

---

## 🎨 Update Your Frontend

Your calendar component should fetch availability like this:

```typescript
// Fetch availability for a specific date
const response = await fetch(`/api/calendar/availability?date=${date}`);
const slots = await response.json();

// slots will be an array of:
// { start, end, time, available: true/false, reason?: string }
```

---

## 📝 Environment Variable Checklist

- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL` - Service account email
- [ ] `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` - Private key with `\n` newlines
- [ ] `GOOGLE_CALENDAR_ID` - Your calendar ID (email or calendar ID)
- [ ] `NEXT_PUBLIC_ADMIN_EMAIL` - Your admin email
- [ ] Calendar API enabled in GCP
- [ ] Calendar shared with service account
- [ ] Service account has "Make changes to events" permission

---

## 🚀 After Configuration

1. **Restart your dev server**: `npm run dev`
2. **Test connection**: Visit `/api/calendar/connection`
3. **Check availability**: Visit `/api/calendar/availability?date=2025-01-07`
4. **Try booking**: Use your booking form

---

## 📞 Still Not Working?

Check the console logs:
```bash
# In your terminal where dev server is running
# Look for:
# - "Successfully initialized JWT auth client"
# - "Found X events in calendar"
# - Any error messages
```

Check browser console:
```javascript
// In browser console
fetch('/api/calendar/connection')
  .then(r => r.json())
  .then(console.log)
```

---

## 🎯 Expected Behavior After Fix

1. **Calendar Connection**: `/api/calendar/connection` returns `connected: true`
2. **Events Fetched**: Admin events are retrieved from Google Calendar
3. **Availability Calculated**: Time slots show as unavailable when admin has events
4. **Booking Creates Events**: New bookings create events in both admin and user calendars
5. **Quota Consumed**: Hours are deducted from user quota
6. **Email Sent**: Confirmation email is sent to user

---

**Need more help?** Check the logs and share any error messages!
