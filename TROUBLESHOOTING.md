# Troubleshooting Guide

## API Error Fixes

This guide addresses two main issues in the application:

1. HTTP 400 errors in the `/api/quota` endpoints due to JSON parsing errors
2. "Invitation codes table not found or no active code" (PGRST116) errors

## Issue 1: JSON Parsing Errors

### Problem

The API endpoints were failing with HTTP 400 errors when receiving empty or malformed request bodies. This was due to unhandled exceptions when parsing JSON with `request.json()` method.

### Solution

We've added proper error handling around JSON parsing in the following files:

- `app/api/quota/route.ts`
- `app/api/quota/consume/route.ts`
- `app/api/quota/messages/route.ts`

The fix wraps the JSON parsing in try-catch blocks and returns appropriate error responses when parsing fails.

## Issue 2: Invitation Codes Table Errors

### Problem

The application was encountering "Invitation codes table not found or no active code" errors (PGRST116), indicating that the database table was missing or not properly set up.

### Solution

1. We've added a migration script to ensure the `invitation_codes` table exists:
   - `sql/migrations/20240101_create_invitation_codes.sql`

2. We've updated the invitation stats endpoint to properly handle cases where the table doesn't exist:
   - `app/api/invitation/stats/route.ts`

3. We've created utility scripts to help diagnose and fix database issues:
   - `scripts/run-migrations.js` - Runs database migrations
   - `scripts/check-tables.js` - Checks database table structure
   - `scripts/test-api-endpoints.js` - Tests API endpoints

## How to Fix

### Step 1: Run Database Migrations

```bash
node scripts/run-migrations.js
```

This will create the `invitation_codes` table if it doesn't exist.

### Step 2: Check Database Tables

```bash
node scripts/check-tables.js
```

This will verify that all required tables exist and show their structure.

### Step 3: Test API Endpoints

```bash
node scripts/test-api-endpoints.js
```

This will test the API endpoints to ensure they're working correctly.

## Additional Notes

- The invitation stats endpoint now gracefully handles missing tables by returning a fallback response.
- JSON parsing errors now return clear error messages with HTTP 400 status codes.
- The migration script includes proper error handling and will not fail if the table already exists.

## Troubleshooting

If you continue to experience issues:

1. Check the server logs for detailed error messages
2. Verify that your database connection is working correctly
3. Ensure that the Supabase service role key has sufficient permissions
4. Check that the `information_schema.tables` view is accessible to your database user