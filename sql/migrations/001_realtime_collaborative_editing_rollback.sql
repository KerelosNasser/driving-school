-- Rollback Migration: Real-time Collaborative Editing System
-- Version: 001
-- Description: Rollback script for real-time collaborative editing migration

-- ============================================================================
-- 1. REMOVE TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_page_content_updated_at ON public.page_content;
DROP TRIGGER IF EXISTS update_edit_sessions_updated_at ON public.edit_sessions;
DROP TRIGGER IF EXISTS update_component_library_updated_at ON public.component_library;
DROP TRIGGER IF EXISTS update_navigation_items_updated_at ON public.navigation_items;

-- ============================================================================
-- 2. DROP FUNCTIONS (only the ones we created in this migration)
-- ============================================================================

-- Note: We use the existing handle_updated_at() function, so no custom trigger function to drop
DROP FUNCTION IF EXISTS public.detect_version_conflict(VARCHAR(100), VARCHAR(100), VARCHAR(50));
DROP FUNCTION IF EXISTS public.acquire_content_lock(VARCHAR(100), VARCHAR(100), TEXT, VARCHAR(50));
DROP FUNCTION IF EXISTS public.release_content_lock(VARCHAR(100), VARCHAR(100), TEXT);
DROP FUNCTION IF EXISTS public.cleanup_stale_locks();
DROP FUNCTION IF EXISTS public.create_content_version(VARCHAR(100), VARCHAR(100), VARCHAR(20), TEXT, JSONB, TEXT, TEXT, VARCHAR(50), TEXT, UUID, VARCHAR(50));
DROP FUNCTION IF EXISTS public.resolve_content_conflict(VARCHAR(100), VARCHAR(100), VARCHAR(50), VARCHAR(50), TEXT, JSONB, VARCHAR(100));
DROP FUNCTION IF EXISTS public.update_session_activity(UUID, VARCHAR(100));
DROP FUNCTION IF EXISTS public.cleanup_inactive_sessions();

-- ============================================================================
-- 3. REMOVE FROM REAL-TIME PUBLICATIONS
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime DROP TABLE public.edit_sessions;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors if table not in publication
        END;
        
        BEGIN
            ALTER PUBLICATION supabase_realtime DROP TABLE public.page_components;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors if table not in publication
        END;
        
        BEGIN
            ALTER PUBLICATION supabase_realtime DROP TABLE public.navigation_items;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors if table not in publication
        END;
        
        BEGIN
            ALTER PUBLICATION supabase_realtime DROP TABLE public.conflict_resolutions;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors if table not in publication
        END;
        
        BEGIN
            ALTER PUBLICATION supabase_realtime DROP TABLE public.content_versions;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors if table not in publication
        END;
        
        -- Note: We don't remove page_content from publication as it may be used elsewhere
        
        RAISE NOTICE 'Real-time publications removed successfully';
    END IF;
END $$;

-- ============================================================================
-- 4. DROP NEW TABLES (in reverse dependency order)
-- ============================================================================

DROP TABLE IF EXISTS public.conflict_resolutions CASCADE;
DROP TABLE IF EXISTS public.navigation_items CASCADE;
DROP TABLE IF EXISTS public.page_components CASCADE;
DROP TABLE IF EXISTS public.component_library CASCADE;
DROP TABLE IF EXISTS public.edit_sessions CASCADE;

-- ============================================================================
-- 5. REMOVE NEW COLUMNS FROM EXISTING TABLES
-- ============================================================================

-- Remove foreign key constraints first
ALTER TABLE public.content_versions DROP CONSTRAINT IF EXISTS fk_content_versions_conflict_resolution;
ALTER TABLE public.content_versions DROP CONSTRAINT IF EXISTS fk_content_versions_session;

-- Remove new columns from content_versions
ALTER TABLE public.content_versions DROP COLUMN IF EXISTS conflict_resolution_id;
ALTER TABLE public.content_versions DROP COLUMN IF EXISTS event_type;
ALTER TABLE public.content_versions DROP COLUMN IF EXISTS session_id;

-- Remove only the new columns we added in this migration
-- (version and last_conflict_at were already present from QUICK_FIX.sql)
ALTER TABLE public.page_content DROP COLUMN IF EXISTS lock_version;
ALTER TABLE public.page_content DROP COLUMN IF EXISTS locked_by;
ALTER TABLE public.page_content DROP COLUMN IF EXISTS locked_at;

-- Note: We don't drop 'version' and 'last_conflict_at' columns as they were added in QUICK_FIX.sql
-- and may be used by existing views/objects like content_history

-- Note: We don't drop page_content and content_versions tables entirely
-- as they may contain existing data and be used by the current system

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Real-time Collaborative Editing rollback completed successfully!';
    RAISE NOTICE 'Removed all new tables and functions';
    RAISE NOTICE 'Removed new columns from existing tables';
    RAISE NOTICE 'Removed real-time publications';
END $$;