# Google APIs Setup Guide

This guide will walk you through setting up the Google APIs for your driving school application. The app uses a single Google API key and OAuth credentials for multiple services.

## Overview

The application integrates with these Google services:
- **Google Places API** - Location autocomplete for pickup addresses
- **Google Calendar API** - Lesson booking and scheduling with buffer time management
- **Google My Business API** - Importing customer reviews

## Prerequisites

1. A Google Cloud Platform account
2. A Google Workspace or personal Google account for OAuth
3. Your driving school's Google My Business listing (for reviews)

## Step 1: Google Cloud Platform Setup

### 1.1 Create or Select a Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID for later use

### 1.2 Enable Required APIs

Enable these APIs in your Google Cloud project:

1. **Google Places API (New)**
   - Navigate to "APIs & Services" → "Library"
   - Search for "Places API (New)" and enable it

2. **Google Calendar API**
   - Search for "Google Calendar API" and enable it

3. **Google My Business API** (Optional - for reviews)
   - Search for "Google My Business API" and enable it

### 1.3 Create API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API key"
3. Copy the API key - this will be your `GOOGLE_API_KEY`
4. (Recommended) Restrict the API key:
   - Click on the key name to edit
   - Under "API restrictions", select "Restrict key"
   - Choose: Places API (New), Calendar API, My Business API

## Step 2: OAuth Setup for Calendar API

### 2.1 Create OAuth 2.0 Client ID

1. In "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type (unless you have Google Workspace)
   - Fill in app name, user support email, and developer contact
   - Add your domain to authorized domains
   - Add scopes: `calendar`, `calendar.events`

4. Create OAuth Client ID:
   - Application type: "Web application"
   - Name: "Driving School Calendar Integration"
   - Authorized redirect URIs: `http://localhost:3000/api/calendar/oauth/callback` (for development)
   - For production, add: `https://yourdomain.com/api/calendar/oauth/callback`

5. Copy the Client ID and Client Secret

## Step 3: Environment Variables Setup

Update your `.env.local` file with the following variables:

```bash
# Google Cloud Platform API (single key for all Google services)
GOOGLE_API_KEY=your_api_key_here
GOOGLE_LOCATION_ID=your_google_business_location_id
GOOGLE_OAUTH_CLIENT_ID=your_oauth_client_id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your_oauth_client_secret
GOOGLE_OAUTH_ACCESS_TOKEN=
GOOGLE_OAUTH_REFRESH_TOKEN=
GOOGLE_CALENDAR_ID=primary

# Facebook Graph API for reviews (optional)
FACEBOOK_PAGE_ACCESS_TOKEN=your_facebook_page_token
FACEBOOK_PAGE_ID=your_facebook_page_id
```

## Step 4: Google My Business Setup (For Reviews)

### 4.1 Find Your Location ID

1. Go to [Google My Business](https://business.google.com/)
2. Select your business location
3. The Location ID is in the URL: `accounts/{account_id}/locations/{location_id}`
4. Use the `{location_id}` part for `GOOGLE_LOCATION_ID`

### 4.2 Get OAuth Access Token

For My Business API, you'll need to obtain an OAuth access token:

1. Use Google's OAuth 2.0 Playground: https://developers.google.com/oauthplayground/
2. Select "Google My Business API v4.1"
3. Authorize and get the access token
4. Add it to `GOOGLE_OAUTH_ACCESS_TOKEN` in your `.env.local`

## Step 5: Calendar Integration Setup

### 5.1 Initial OAuth Flow

1. Start your development server: `npm run dev`
2. Navigate to the service center page
3. Click "Connect Google Calendar"
4. Complete the OAuth flow in the popup
5. The system will store your tokens securely

### 5.2 Calendar Configuration

The system is configured for:
- **Working Hours**: 8 AM - 6 PM
- **Time Zone**: Australia/Brisbane
- **Buffer Time**: 30 minutes (configurable)
- **Lesson Slots**: 1-hour intervals

You can modify these settings in `/api/calendar/availability/route.ts`

## Step 6: Testing the Integration

### 6.1 Places API Test

1. Navigate to any form with location autocomplete
2. Start typing an address
3. You should see real location suggestions

### 6.2 Calendar API Test

1. Go to Service Center → Calendar Integration
2. Connect your Google Calendar
3. Select a date and check for available time slots
4. Book a test lesson

### 6.3 Reviews API Test

1. Go to Admin Panel → Reviews Tab → External Reviews
2. Click "Fetch Google Reviews" or "Fetch Facebook Reviews"
3. You should see real reviews (no mock data)

## Step 7: Production Deployment

### 7.1 Update OAuth Redirect URIs

1. In Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add production redirect URI: `https://yourdomain.com/api/calendar/oauth/callback`

### 7.2 Security Best Practices

1. **API Key Restrictions**: Restrict your API key to specific APIs and domains
2. **OAuth Scopes**: Request minimal necessary scopes
3. **Token Storage**: Store refresh tokens securely in your database
4. **Rate Limiting**: Implement proper rate limiting for API calls
5. **Error Handling**: Monitor API quota usage and implement fallbacks

## Step 8: Monitoring and Maintenance

### 8.1 API Quotas

Monitor your API usage in Google Cloud Console:
- Places API: Check daily requests
- Calendar API: Monitor read/write operations
- My Business API: Track review fetch frequency

### 8.2 Token Refresh

Implement automatic refresh token handling:
- Calendar tokens expire after 1 hour
- Use refresh tokens to get new access tokens
- Store tokens per user in your database

## Troubleshooting

### Common Issues

1. **"Calendar not connected"**: Check OAuth flow and token storage
2. **"API key invalid"**: Verify API key and enabled services
3. **"Location service unavailable"**: Check Places API quota and restrictions
4. **"Failed to fetch reviews"**: Verify My Business API access and location ID

### Support Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Google My Business API Documentation](https://developers.google.com/my-business/reference/rest)

## Integration with Provided Calendar

The system is designed to integrate with your existing Google Calendar (https://calendar.app.google/4cFYF3NSgvonJ11w5). The buffer system ensures:

1. **30-minute buffer** between appointments
2. **Automatic conflict detection** with existing events
3. **Quota management** integration with lesson bookings
4. **Real-time availability** checking

This ensures proper control over your calendar while maintaining the quota system for driving lessons.
