# Calendar Settings Save Error - Fixed

## Problem
The calendar settings were failing to save with error: `Error saving calendar settings: {}`

## Root Causes Identified

1. **RLS Policy Blocking**: Calendar tables had Row Level Security enabled with policies requiring `authenticated` role, but the client was using the anonymous Supabase key
2. **Schema Mismatch**: TypeScript interfaces expected `id?: string` (UUID) but the actual database uses `SERIAL` (integer)
3. **No Admin Protection**: The `/admin` route was accessible to anyone without authentication
4. **Client-Side Operations**: Database writes were happening client-side with the anon key instead of through secure server routes
5. **Poor Error Visibility**: Next.js 15 console formatting rendered error objects as `{}`

## Solution Implemented

### 1. Admin Route Protection (`app/admin/layout.tsx`)
- Added authentication guard using Clerk
- Checks if user is logged in
- Verifies user email matches `NEXT_PUBLIC_ADMIN_EMAIL`
- Redirects unauthorized users

### 2. Secure API Routes
Created server-side API routes with admin authentication:

**`app/api/calendar-settings/route.ts`**
- GET: Load calendar settings
- POST: Save/update calendar settings
- Uses Supabase admin client (service role key)
- Validates admin access on every request
- Returns detailed error messages

**`app/api/vacation-days/route.ts`**
- GET: Load vacation days
- POST: Add vacation day
- DELETE: Remove vacation day
- Uses Supabase admin client
- Validates admin access on every request

### 3. Updated Client Component (`app/admin/components/CalendarSettingsTab.tsx`)
- Removed direct Supabase client usage
- All operations now go through API routes
- Fixed type definitions: `id?: number` instead of `id?: string`
- Improved error handling with detailed messages
- Better error logging

### 4. Type Alignment
- Changed `CalendarSettings.id` from `string` to `number`
- Changed `VacationDay.id` from `string` to `number`
- Matches the actual database schema (SERIAL PRIMARY KEY)

## Benefits

1. **Security**: All database operations now happen server-side with proper authentication
2. **RLS Bypass**: Using service role key bypasses RLS policies appropriately
3. **Better Errors**: API routes return structured error messages with details
4. **Type Safety**: TypeScript types now match actual database schema
5. **Admin Protection**: Only authenticated admin users can access admin features

## Testing

To test the fix:

1. Ensure `NEXT_PUBLIC_ADMIN_EMAIL` is set in `.env.local`
2. Sign in with the admin email
3. Navigate to `/admin`
4. Try saving calendar settings - should work without errors
5. Try adding/removing vacation days - should work without errors
6. Try accessing `/admin` while signed out - should redirect to sign-in

## Files Modified

- `app/admin/layout.tsx` (new)
- `app/api/calendar-settings/route.ts` (new)
- `app/api/vacation-days/route.ts` (new)
- `app/admin/components/CalendarSettingsTab.tsx` (updated)

## Environment Variables Required

- `NEXT_PUBLIC_ADMIN_EMAIL` - Email address of the admin user
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (already configured)
- `CLERK_SECRET_KEY` - Clerk secret key (already configured)
