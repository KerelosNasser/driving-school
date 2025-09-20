# Real-time Collaborative Editing Migration

This directory contains the database migration scripts for implementing real-time collaborative editing functionality.

## Migration Overview

The migration adds support for:
- Real-time collaborative editing with conflict resolution
- Component-based page building with drag-and-drop
- Dynamic page creation and navigation management
- Version tracking and optimistic locking
- User presence tracking and session management

## Files

- `001_realtime_collaborative_editing.sql` - Main migration script
- `001_realtime_collaborative_editing_rollback.sql` - Rollback script
- `README.md` - This documentation

## How to Run the Migration

### Option 1: Using the Script (Recommended)

1. Run the migration preparation script:
   ```bash
   node scripts/run-realtime-migration.js
   ```

2. Copy the content of `sql/migrations/001_realtime_collaborative_editing.sql`

3. Paste and run it in your Supabase SQL Editor

4. Verify the migration worked:
   ```bash
   node scripts/verify-realtime-migration.js
   ```

### Option 2: Manual Execution

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy the entire content of `001_realtime_collaborative_editing.sql`
4. Paste and execute it
5. Run the verification script to confirm success

## What the Migration Creates

### New Tables

1. **edit_sessions** - Tracks active editing sessions
2. **component_library** - Defines available page components
3. **page_components** - Stores component instances on pages
4. **navigation_items** - Manages site navigation structure
5. **conflict_resolutions** - Logs conflict resolution events

### Enhanced Tables

1. **page_content** - Added optimistic locking and version tracking
2. **content_versions** - Added real-time event tracking

### Database Functions

1. `detect_version_conflict()` - Detects version conflicts
2. `acquire_content_lock()` - Acquires optimistic locks
3. `release_content_lock()` - Releases content locks
4. `cleanup_stale_locks()` - Cleans up old locks
5. `create_content_version()` - Creates version entries
6. `resolve_content_conflict()` - Handles conflict resolution
7. `update_session_activity()` - Updates session activity
8. `cleanup_inactive_sessions()` - Cleans up old sessions

### Performance Optimizations

- 20+ indexes for frequently queried columns
- Optimized queries for real-time operations
- Efficient conflict detection algorithms

### Security Features

- Row Level Security (RLS) policies for all tables
- Service role and authenticated user permissions
- Input validation and sanitization functions

## Rollback

If you need to rollback the migration:

1. Run the rollback preparation:
   ```bash
   node scripts/run-realtime-migration.js rollback
   ```

2. Copy the content of `001_realtime_collaborative_editing_rollback.sql`

3. Paste and run it in your Supabase SQL Editor

**Warning**: Rollback will remove all new tables and their data. Make sure to backup any important data first.

## Verification

After running the migration, use the verification script to ensure everything is working:

```bash
node scripts/verify-realtime-migration.js
```

This will check:
- All tables were created successfully
- Database functions are working
- Component library is initialized
- Indexes are functioning
- Basic queries work correctly

## Troubleshooting

### Common Issues

1. **Permission Errors**: Make sure you're using the service role key in your environment variables

2. **Table Already Exists**: The migration uses `IF NOT EXISTS` clauses, so it's safe to re-run

3. **Function Errors**: If functions fail, check that all required tables exist first

4. **Real-time Not Working**: Ensure your Supabase project has real-time enabled

### Getting Help

If you encounter issues:

1. Check the Supabase logs in your dashboard
2. Run the verification script to identify specific problems
3. Review the error messages for specific table or function names
4. Ensure all environment variables are correctly set

## Next Steps

After successful migration:

1. Implement the real-time client wrapper (Task 2.1)
2. Create the real-time event system (Task 2.2)
3. Build the presence tracking system (Task 2.3)

See the main tasks.md file for the complete implementation plan.