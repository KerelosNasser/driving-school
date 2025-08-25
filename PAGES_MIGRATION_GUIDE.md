# Page Management System Migration Guide

## Problem
You're encountering this error because the new page management system is trying to create triggers that already exist from the previous implementation:

```
ERROR: 42710: trigger "update_pages_updated_at" for relation "pages" already exists
```

## Solution Options

### Option 1: Clean Migration (Recommended)

1. **Backup your data first** (important!):
   ```sql
   -- Export existing pages
   COPY pages TO '/tmp/pages_backup.csv' WITH CSV HEADER;
   ```

2. **Run the cleanup script**:
   ```bash
   # In your Supabase SQL editor or psql
   \i sql/cleanup-old-pages.sql
   ```

3. **Apply the new schema**:
   ```bash
   \i sql/modern-pages.sql
   ```

### Option 2: Manual Cleanup (If you prefer step-by-step)

Run these commands in your Supabase SQL editor:

```sql
-- Remove conflicting trigger
DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;

-- Remove old function (if it exists)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Now run the modern-pages.sql schema
```

### Option 3: Quick Fix (If you just want to fix the immediate error)

Run this single command to drop the conflicting trigger:

```sql
DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
```

Then run your `modern-pages.sql` script again.

## Verification

After running the migration, verify everything works:

```sql
-- Check if tables exist with correct structure
\d pages
\d component_templates  
\d page_revisions

-- Check if triggers are working
UPDATE pages SET title = 'Test' WHERE slug = 'home';
SELECT updated_at FROM pages WHERE slug = 'home'; -- Should show current timestamp

-- Test the new API
```

## Rollback Plan

If something goes wrong, you can restore from backup:

```sql
-- Restore pages from backup
TRUNCATE pages;
COPY pages FROM '/tmp/pages_backup.csv' WITH CSV HEADER;
```

## Files Modified

- `sql/modern-pages.sql` - Updated with conflict handling
- `sql/cleanup-old-pages.sql` - New cleanup script
- All page management components have been updated

## What's New

The new page management system includes:
- ✅ Advanced SEO management tools
- ✅ WordPress-like page editor  
- ✅ Component library system
- ✅ Live preview capabilities
- ✅ Schema.org structured data
- ✅ SEO analytics dashboard
- ✅ Conflict-resistant database schema

## Need Help?

If you encounter any issues:
1. Check the console for specific error messages
2. Verify your database permissions
3. Ensure you're using the Supabase service role key for admin operations
4. Check that all required environment variables are set