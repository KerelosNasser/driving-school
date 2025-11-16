# Google Business Reviews Integration - Complete Setup Guide

This guide will help you integrate Google Business reviews into your admin dashboard with automatic daily synchronization.

## 📋 Overview

The system automatically syncs reviews from your Google Business Profile to your website daily at 2:00 AM UTC. You can also manually trigger syncs from the admin dashboard.

## 🔧 Setup Steps

### 1. Run Database Migration

First, update your database schema to support external reviews:

```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d your-database -f sql/add_external_reviews_support.sql
```

Or run the SQL directly in Supabase SQL Editor:
- Go to Supabase Dashboard → SQL Editor
- Copy contents from `sql/add_external_reviews_support.sql`
- Execute the query

### 2. Get Google Business Location ID

1. Go to [Google Business Profile API](https://developers.google.com/my-business/content/basic-setup)
2. Enable the "Business Profile API" in Google Cloud Console
3. Find your location ID:
   - Format: `locations/{location_id}`
   - You can use the [Account Management API](https://developers.google.com/my-business/reference/accountmanagement/rest/v1/accounts.locations/list) to list your locations

### 3. Set Up OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - Google Business Profile API
   - Google My Business API (legacy, for compatibility)
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Create OAuth 2.0 credentials
7. Get an access token:

```bash
# Use OAuth 2.0 Playground or generate programmatically
# Scopes needed:
# - https://www.googleapis.com/auth/business.manage
```

### 4. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Google Business Reviews Configuration
GOOGLE_LOCATION_ID=locations/your_location_id_here
GOOGLE_OAUTH_ACCESS_TOKEN=your_oauth_access_token_here

# Cron Job Security
CRON_SECRET=your_random_secret_here_use_openssl_rand_base64_32
```

**Important Notes:**
- `GOOGLE_LOCATION_ID` should include the "locations/" prefix
- OAuth tokens expire! You'll need to refresh them periodically (see section below)
- `CRON_SECRET` should be a strong random string

### 5. Deploy to Vercel

The `vercel.json` file is already configured for daily cron jobs:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-reviews",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Deploy your app:

```bash
npm run build
vercel --prod
```

Add environment variables in Vercel Dashboard:
- Go to Project Settings → Environment Variables
- Add all the variables from step 4

### 6. Test the Integration

#### Manual Sync Test:
1. Go to Admin Dashboard → Reviews Tab → Google Sync
2. Click "Sync Now"
3. Check if reviews appear

#### API Test:
```bash
curl -X POST https://your-domain.com/api/admin/google-reviews/sync \
  -H "Content-Type: application/json"
```

#### Cron Job Test:
```bash
curl https://your-domain.com/api/cron/sync-reviews \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 🔄 OAuth Token Refresh

OAuth tokens expire after 1 hour. You have two options:

### Option A: Use Refresh Tokens (Recommended)

Update the sync endpoint to automatically refresh tokens:

```typescript
// Add to app/api/admin/google-reviews/sync/route.ts
async function getAccessToken() {
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken!,
      grant_type: 'refresh_token'
    })
  });

  const data = await response.json();
  return data.access_token;
}
```

### Option B: Use Service Account (Best for Production)

1. Create a Service Account in Google Cloud Console
2. Download the JSON key file
3. Grant the service account access to your Google Business Profile
4. Use the service account credentials instead of OAuth

```typescript
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/business.manage'],
});

const accessToken = await auth.getAccessToken();
```

## 📊 Database Schema

The migration adds these columns to the `reviews` table:

| Column | Type | Description |
|--------|------|-------------|
| `source` | VARCHAR(50) | Source platform (website, google, facebook) |
| `external_id` | VARCHAR(255) | External platform review ID |
| `profile_photo_url` | TEXT | Reviewer's profile photo URL |
| `reply` | JSONB | Business reply to review |
| `synced_at` | TIMESTAMP | Last sync timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

And creates a new `review_sync_log` table to track sync history.

## 🎯 Features

### Automatic Daily Sync
- Runs at 2:00 AM UTC every day
- Imports new reviews
- Updates existing reviews
- Tracks sync history

### Manual Sync
- Trigger from admin dashboard
- Real-time status updates
- Shows import/update statistics

### Review Display
- Separate sections for website and Google reviews
- Shows reviewer profile photos
- Displays star ratings
- Auto-approved Google reviews
- Sync status indicators

## 🔍 Troubleshooting

### Reviews Not Syncing

1. **Check OAuth Token:**
   ```bash
   # Test if token is valid
   curl "https://mybusinessbusinessinformation.googleapis.com/v1/locations/YOUR_LOCATION_ID/reviews" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Check Logs:**
   - Vercel Dashboard → Deployments → Functions → Logs
   - Look for errors in `/api/cron/sync-reviews`

3. **Verify Location ID:**
   - Make sure it includes "locations/" prefix
   - Test with Google Business Profile API Explorer

### Cron Job Not Running

1. **Check Vercel Cron Configuration:**
   - Vercel Dashboard → Project → Settings → Cron Jobs
   - Verify the cron is enabled

2. **Check CRON_SECRET:**
   - Make sure it's set in Vercel environment variables
   - Match the secret in your code

### Database Errors

1. **Run Migration Again:**
   ```sql
   -- Check if columns exist
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'reviews';
   ```

2. **Check Permissions:**
   - Ensure Supabase service role key has write access

## 📝 API Endpoints

### Sync Reviews
```
POST /api/admin/google-reviews/sync
```
Fetches and imports Google Business reviews.

### Get Sync Status
```
GET /api/admin/google-reviews/sync
```
Returns last sync information and history.

### Cron Job
```
GET /api/cron/sync-reviews
Authorization: Bearer {CRON_SECRET}
```
Automated daily sync endpoint.

## 🚀 Next Steps

1. **Add Facebook Reviews:**
   - Similar setup with Facebook Graph API
   - Use existing `/api/admin/facebook-reviews` endpoint

2. **Add Webhooks:**
   - Real-time review notifications
   - Instant sync when new review is posted

3. **Add Reply Functionality:**
   - Reply to reviews from admin dashboard
   - Sync replies back to Google

4. **Analytics:**
   - Review trends over time
   - Average rating tracking
   - Response rate metrics

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Vercel function logs
3. Check Supabase database logs
4. Verify all environment variables are set correctly

## 🔐 Security Notes

- Never commit OAuth tokens to git
- Use environment variables for all secrets
- Rotate CRON_SECRET periodically
- Use service accounts in production
- Implement rate limiting for API endpoints
- Add admin role verification to sync endpoints

---

**Last Updated:** November 2025
**Version:** 1.0.0
