        # Post-Authentication Sign-Up Form Setup Guide

This guide will help you set up the post-authentication sign-up form with invitation codes, referral system, and device fingerprinting.

## Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Clerk account and application
- Google Cloud Platform account (for Places API)

## Database Setup

1. **Run the database migrations in order:**
   ```sql
   -- First, run the main schema
   \i database/driving-school.sql
   
   -- Then, run the complete schema
   \i database/complete-supabase-schema.sql
   
   -- Finally, run the invitation/referral system
   \i database/invitation-referral-system.sql
   
   -- And the quota system
   \i database/quota-system.sql
   ```

2. **Enable Row Level Security (RLS)** on all tables in Supabase dashboard

3. **Set up Supabase policies** (already included in the SQL files)

## Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the required values:

### Clerk Configuration
- Go to [Clerk Dashboard](https://dashboard.clerk.com/)
- Create a new application or use existing
- Copy the publishable key and secret key

### Supabase Configuration
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Navigate to Settings > API
- Copy the URL, anon key, and service role key

### Google Places API
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Enable Places API
- Create an API key with Places API restrictions
- Add your domain to the API key restrictions

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install additional packages for the sign-up form:**
   ```bash
   npm install @supabase/supabase-js react-hook-form @hookform/resolvers zod sonner
   npm install -D @types/uuid
   ```

## Features Implemented

### 1. Post-Authentication Sign-Up Form
- **Location:** `/complete-profile`
- **Fields:** Full name, phone number, location (with autocomplete), optional invitation code
- **Validation:** Real-time client-side and server-side validation
- **Security:** Rate limiting, device fingerprinting, CSRF protection

### 2. Invitation Code System
- **Unique codes:** Generated per user using UUID
- **Copy functionality:** One-click copy to clipboard
- **Usage tracking:** Complete history with timestamps
- **Device fingerprinting:** Prevents multiple accounts from same device

### 3. Referral Reward System
- **1 referral:** 30% discount on any package
- **3 referrals:** 2 hours of free driving lessons
- **Automatic processing:** Rewards applied when referral completes profile

### 4. Security Features
- **Rate limiting:** 5 requests per minute per IP
- **Device fingerprinting:** Browser and device identification
- **Input validation:** Comprehensive server-side validation
- **SQL injection protection:** Parameterized queries
- **XSS protection:** Input sanitization

## API Endpoints

### POST `/api/complete-profile`
Completes user profile after authentication
- **Body:** `{ fullName, phone, location, invitationCode? }`
- **Returns:** User profile data and invitation code

### GET `/api/location-autocomplete`
Provides location suggestions
- **Query:** `?input=search_term`
- **Returns:** Array of location suggestions

### GET `/api/check-profile-completion`
Checks if user has completed profile
- **Returns:** Profile completion status

## Usage Flow

1. **User signs up/signs in** via Clerk
2. **Profile completion check** runs automatically
3. **Redirect to `/complete-profile`** if profile incomplete
4. **User fills form** with validation feedback
5. **Server processes** form with security checks
6. **Referral processing** if invitation code provided
7. **User receives** their unique invitation code
8. **Redirect to dashboard** upon completion

## Testing

### Test the complete flow:

1. **Sign up a new user** via Clerk
2. **Verify redirect** to `/complete-profile`
3. **Test form validation** with invalid inputs
4. **Submit valid form** and check database
5. **Test invitation code** with another user
6. **Verify referral rewards** are applied

### Test security features:

1. **Rate limiting:** Make rapid requests
2. **Device fingerprinting:** Try multiple accounts
3. **Input validation:** Test with malicious inputs

## Troubleshooting

### Common Issues:

1. **"User not found" error:**
   - Check Clerk webhook is configured
   - Verify user exists in Supabase `users` table

2. **Location autocomplete not working:**
   - Verify Google Places API key
   - Check API key restrictions
   - Ensure Places API is enabled

3. **Rate limiting too aggressive:**
   - Adjust limits in API routes
   - Consider Redis for production

4. **Device fingerprinting issues:**
   - Check browser compatibility
   - Verify fingerprint generation

### Database Issues:

1. **RLS policies blocking queries:**
   - Check user authentication
   - Verify policy conditions

2. **Missing tables/functions:**
   - Re-run database migrations
   - Check for SQL errors

## Production Deployment

### Security Checklist:

- [ ] Enable HTTPS
- [ ] Set up proper CORS policies
- [ ] Configure rate limiting with Redis
- [ ] Set up monitoring and logging
- [ ] Enable Supabase RLS on all tables
- [ ] Restrict API keys to production domains
- [ ] Set up backup and recovery

### Performance Optimization:

- [ ] Enable caching for location autocomplete
- [ ] Optimize database queries
- [ ] Set up CDN for static assets
- [ ] Monitor API response times

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the database logs in Supabase
3. Check the browser console for client-side errors
4. Verify all environment variables are set correctly