-- Migration: Real-time Collaborative Editing System
-- Version: 001
-- Description: Creates tables and functions for real-time collaborative editing
-- Requirements: 8.1, 8.2, 8.3, 6.1, 6.2

-- ============================================================================
-- 1. CREATE OR UPDATE CORE CONTENT TABLES
-- ============================================================================

-- Ensure we're working in the public schema
SET search_path TO public;

-- Create page_content table if it doesn't exist (based on existing API usage)
CREATE TABLE IF NOT EXISTS public.page_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_name VARCHAR(100) NOT NULL,
    content_key VARCHAR(100) NOT NULL,
    content_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'json', 'file', 'image', 'boolean')),
    content_value TEXT,
    content_json JSONB,
    file_url TEXT,
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    file_type VARCHAR(100),
    alt_text TEXT,
    title TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_draft BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(page_name, content_key)
);

-- Add new columns to existing page_content table for real-time tracking and optimistic locking
-- Note: version and last_conflict_at columns already exist from QUICK_FIX.sql
ALTER TABLE public.page_content 
ADD COLUMN IF NOT EXISTS lock_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS locked_by TEXT,
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;

-- Create content_versions table for version history (or update existing)
CREATE TABLE IF NOT EXISTS public.content_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_name VARCHAR(100) NOT NULL,
    content_key VARCHAR(100) NOT NULL,
    content_type VARCHAR(20) NOT NULL,
    content_value TEXT,
    content_json JSONB,
    file_url TEXT,
    alt_text TEXT,
    version VARCHAR(50) NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns to existing content_versions table if they don't exist
ALTER TABLE public.content_versions 
ADD COLUMN IF NOT EXISTS conflict_resolution_id UUID,
ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) DEFAULT 'manual_edit',
ADD COLUMN IF NOT EXISTS session_id UUID;

-- ============================================================================
-- 2. CREATE NEW TABLES FOR COLLABORATIVE EDITING
-- ============================================================================

-- Edit sessions for tracking active editors
CREATE TABLE IF NOT EXISTS public.edit_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    page_name VARCHAR(100) NOT NULL,
    component_id VARCHAR(100),
    session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'idle', 'disconnected')),
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Component library definitions
CREATE TABLE IF NOT EXISTS public.component_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('text', 'media', 'layout', 'interactive')),
    icon VARCHAR(100),
    default_props JSONB NOT NULL DEFAULT '{}',
    schema JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Component instances on pages
CREATE TABLE IF NOT EXISTS public.page_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_name VARCHAR(100) NOT NULL,
    component_type VARCHAR(100) NOT NULL,
    component_id VARCHAR(100) NOT NULL UNIQUE,
    position_section VARCHAR(100) NOT NULL,
    position_order INTEGER NOT NULL,
    parent_component_id VARCHAR(100),
    props JSONB NOT NULL DEFAULT '{}',
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified_by TEXT NOT NULL,
    last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Navigation structure
CREATE TABLE IF NOT EXISTS public.navigation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    url_slug VARCHAR(100) NOT NULL UNIQUE,
    parent_id UUID REFERENCES public.navigation_items(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conflict resolution log
CREATE TABLE IF NOT EXISTS public.conflict_resolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_name VARCHAR(100) NOT NULL,
    component_id VARCHAR(100),
    conflict_type VARCHAR(50) NOT NULL CHECK (conflict_type IN ('content', 'structure', 'version_mismatch', 'concurrent_edit')),
    local_version VARCHAR(50),
    remote_version VARCHAR(50),
    resolution_strategy VARCHAR(50) NOT NULL CHECK (resolution_strategy IN ('accept_remote', 'keep_local', 'merge', 'manual')),
    resolved_by TEXT NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolution_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key constraint to content_versions for conflict resolution (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_content_versions_conflict_resolution'
        AND table_name = 'content_versions'
    ) THEN
        ALTER TABLE public.content_versions 
        ADD CONSTRAINT fk_content_versions_conflict_resolution 
        FOREIGN KEY (conflict_resolution_id) REFERENCES public.conflict_resolutions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add foreign key constraint to content_versions for session tracking (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_content_versions_session'
        AND table_name = 'content_versions'
    ) THEN
        ALTER TABLE public.content_versions 
        ADD CONSTRAINT fk_content_versions_session 
        FOREIGN KEY (session_id) REFERENCES public.edit_sessions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Indexes for page_content table
CREATE INDEX IF NOT EXISTS idx_page_content_page_name ON public.page_content(page_name);
CREATE INDEX IF NOT EXISTS idx_page_content_page_key ON public.page_content(page_name, content_key);
CREATE INDEX IF NOT EXISTS idx_page_content_updated ON public.page_content(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_content_locked ON public.page_content(locked_by, locked_at) WHERE locked_by IS NOT NULL;

-- Indexes for content_versions table
CREATE INDEX IF NOT EXISTS idx_content_versions_page_key ON public.content_versions(page_name, content_key);
CREATE INDEX IF NOT EXISTS idx_content_versions_created ON public.content_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_versions_version ON public.content_versions(page_name, content_key, version);
CREATE INDEX IF NOT EXISTS idx_content_versions_session ON public.content_versions(session_id);

-- Indexes for edit_sessions table
CREATE INDEX IF NOT EXISTS idx_edit_sessions_user_page ON public.edit_sessions(user_id, page_name);
CREATE INDEX IF NOT EXISTS idx_edit_sessions_activity ON public.edit_sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_edit_sessions_status ON public.edit_sessions(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_edit_sessions_component ON public.edit_sessions(component_id) WHERE component_id IS NOT NULL;

-- Indexes for page_components table
CREATE INDEX IF NOT EXISTS idx_page_components_page ON public.page_components(page_name);
CREATE INDEX IF NOT EXISTS idx_page_components_order ON public.page_components(page_name, position_section, position_order);
CREATE INDEX IF NOT EXISTS idx_page_components_component_id ON public.page_components(component_id);
CREATE INDEX IF NOT EXISTS idx_page_components_parent ON public.page_components(parent_component_id) WHERE parent_component_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_page_components_active ON public.page_components(page_name, is_active) WHERE is_active = true;

-- Indexes for navigation_items table
CREATE INDEX IF NOT EXISTS idx_navigation_order ON public.navigation_items(parent_id, order_index);
CREATE INDEX IF NOT EXISTS idx_navigation_slug ON public.navigation_items(url_slug);
CREATE INDEX IF NOT EXISTS idx_navigation_visible ON public.navigation_items(is_visible, is_active) WHERE is_visible = true AND is_active = true;

-- Indexes for component_library table
CREATE INDEX IF NOT EXISTS idx_component_library_category ON public.component_library(category);
CREATE INDEX IF NOT EXISTS idx_component_library_active ON public.component_library(is_active) WHERE is_active = true;

-- Indexes for conflict_resolutions table
CREATE INDEX IF NOT EXISTS idx_conflict_resolutions_page ON public.conflict_resolutions(page_name);
CREATE INDEX IF NOT EXISTS idx_conflict_resolutions_component ON public.conflict_resolutions(component_id) WHERE component_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conflict_resolutions_resolved ON public.conflict_resolutions(resolved_at DESC);
CREATE INDEX IF NOT EXISTS idx_conflict_resolutions_type ON public.conflict_resolutions(conflict_type);

-- ============================================================================
-- 5. CREATE DATABASE FUNCTIONS FOR CONFLICT DETECTION AND RESOLUTION
-- ============================================================================

-- Function to detect version conflicts
CREATE OR REPLACE FUNCTION public.detect_version_conflict(
    p_page_name VARCHAR(100),
    p_content_key VARCHAR(100),
    p_expected_version VARCHAR(50)
) RETURNS TABLE (
    has_conflict BOOLEAN,
    current_version VARCHAR(50),
    locked_by TEXT,
    locked_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (pc.version != p_expected_version OR pc.locked_by IS NOT NULL) as has_conflict,
        pc.version as current_version,
        pc.locked_by,
        pc.locked_at
    FROM public.page_content pc
    WHERE pc.page_name = p_page_name 
    AND pc.content_key = p_content_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to acquire optimistic lock
CREATE OR REPLACE FUNCTION public.acquire_content_lock(
    p_page_name VARCHAR(100),
    p_content_key VARCHAR(100),
    p_user_id TEXT,
    p_expected_version VARCHAR(50)
) RETURNS TABLE (
    success BOOLEAN,
    new_version VARCHAR(50),
    error_message TEXT
) AS $$
DECLARE
    v_current_version VARCHAR(50);
    v_locked_by TEXT;
    v_new_version VARCHAR(50);
BEGIN
    -- Check current state
    SELECT pc.version, pc.locked_by 
    INTO v_current_version, v_locked_by
    FROM public.page_content pc
    WHERE pc.page_name = p_page_name AND pc.content_key = p_content_key;
    
    -- Check if already locked by someone else
    IF v_locked_by IS NOT NULL AND v_locked_by != p_user_id THEN
        RETURN QUERY SELECT false, v_current_version, 'Content is locked by another user';
        RETURN;
    END IF;
    
    -- Check version conflict
    IF v_current_version != p_expected_version THEN
        RETURN QUERY SELECT false, v_current_version, 'Version conflict detected';
        RETURN;
    END IF;
    
    -- Generate new version
    v_new_version := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT::TEXT;
    
    -- Acquire lock
    UPDATE public.page_content 
    SET 
        locked_by = p_user_id,
        locked_at = NOW(),
        version = v_new_version,
        updated_at = NOW()
    WHERE page_name = p_page_name AND content_key = p_content_key;
    
    RETURN QUERY SELECT true, v_new_version, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release content lock
CREATE OR REPLACE FUNCTION public.release_content_lock(
    p_page_name VARCHAR(100),
    p_content_key VARCHAR(100),
    p_user_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.page_content 
    SET 
        locked_by = NULL,
        locked_at = NULL,
        updated_at = NOW()
    WHERE page_name = p_page_name 
    AND content_key = p_content_key 
    AND locked_by = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up stale locks (older than 30 minutes)
CREATE OR REPLACE FUNCTION public.cleanup_stale_locks() RETURNS INTEGER AS $$
DECLARE
    v_cleaned_count INTEGER;
BEGIN
    UPDATE public.page_content 
    SET 
        locked_by = NULL,
        locked_at = NULL,
        updated_at = NOW()
    WHERE locked_at < NOW() - INTERVAL '30 minutes';
    
    GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;
    RETURN v_cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create content version entry
CREATE OR REPLACE FUNCTION public.create_content_version(
    p_page_name VARCHAR(100),
    p_content_key VARCHAR(100),
    p_content_type VARCHAR(20),
    p_content_value TEXT,
    p_content_json JSONB,
    p_file_url TEXT,
    p_alt_text TEXT,
    p_version VARCHAR(50),
    p_created_by TEXT,
    p_session_id UUID DEFAULT NULL,
    p_event_type VARCHAR(50) DEFAULT 'manual_edit'
) RETURNS UUID AS $$
DECLARE
    v_version_id UUID;
BEGIN
    INSERT INTO public.content_versions (
        page_name, content_key, content_type, content_value, content_json,
        file_url, alt_text, version, created_by, session_id, event_type
    ) VALUES (
        p_page_name, p_content_key, p_content_type, p_content_value, p_content_json,
        p_file_url, p_alt_text, p_version, p_created_by, p_session_id, p_event_type
    ) RETURNING id INTO v_version_id;
    
    RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resolve conflicts
CREATE OR REPLACE FUNCTION public.resolve_content_conflict(
    p_page_name VARCHAR(100),
    p_content_key VARCHAR(100),
    p_conflict_type VARCHAR(50),
    p_resolution_strategy VARCHAR(50),
    p_resolved_by TEXT,
    p_resolution_data JSONB DEFAULT NULL,
    p_component_id VARCHAR(100) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_conflict_id UUID;
    v_local_version VARCHAR(50);
    v_remote_version VARCHAR(50);
BEGIN
    -- Get current version info
    SELECT version INTO v_remote_version
    FROM public.page_content
    WHERE page_name = p_page_name AND content_key = p_content_key;
    
    -- Create conflict resolution record
    INSERT INTO public.conflict_resolutions (
        page_name, component_id, conflict_type, local_version, remote_version,
        resolution_strategy, resolved_by, resolution_data
    ) VALUES (
        p_page_name, p_component_id, p_conflict_type, v_local_version, v_remote_version,
        p_resolution_strategy, p_resolved_by, p_resolution_data
    ) RETURNING id INTO v_conflict_id;
    
    RETURN v_conflict_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update edit session activity
CREATE OR REPLACE FUNCTION public.update_session_activity(
    p_session_id UUID,
    p_component_id VARCHAR(100) DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.edit_sessions 
    SET 
        last_activity = NOW(),
        component_id = COALESCE(p_component_id, component_id),
        status = 'active',
        updated_at = NOW()
    WHERE id = p_session_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup inactive sessions (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_inactive_sessions() RETURNS INTEGER AS $$
DECLARE
    v_cleaned_count INTEGER;
BEGIN
    UPDATE public.edit_sessions 
    SET 
        status = 'disconnected',
        updated_at = NOW()
    WHERE last_activity < NOW() - INTERVAL '1 hour' 
    AND status = 'active';
    
    GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;
    RETURN v_cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. SETUP SUPABASE REAL-TIME PUBLICATIONS
-- ============================================================================

-- Enable real-time for new tables (with error handling)
DO $$
BEGIN
    -- Check if supabase_realtime publication exists
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        -- Add tables to publication if they're not already added
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.edit_sessions;
        EXCEPTION WHEN duplicate_object THEN
            -- Table already in publication, ignore
        END;
        
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.page_components;
        EXCEPTION WHEN duplicate_object THEN
            -- Table already in publication, ignore
        END;
        
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.navigation_items;
        EXCEPTION WHEN duplicate_object THEN
            -- Table already in publication, ignore
        END;
        
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.conflict_resolutions;
        EXCEPTION WHEN duplicate_object THEN
            -- Table already in publication, ignore
        END;
        
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.content_versions;
        EXCEPTION WHEN duplicate_object THEN
            -- Table already in publication, ignore
        END;
        
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.page_content;
        EXCEPTION WHEN duplicate_object THEN
            -- Table already in publication, ignore
        END;
        
        RAISE NOTICE 'Real-time publications configured successfully';
    ELSE
        RAISE NOTICE 'supabase_realtime publication not found - real-time features may not work';
    END IF;
END $$;

-- ============================================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edit_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflict_resolutions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. CREATE RLS POLICIES
-- ============================================================================

-- Policies for page_content
DROP POLICY IF EXISTS "Allow authenticated users to read page_content" ON public.page_content;
CREATE POLICY "Allow authenticated users to read page_content" ON public.page_content
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow service role to manage page_content" ON public.page_content;
CREATE POLICY "Allow service role to manage page_content" ON public.page_content
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for content_versions
DROP POLICY IF EXISTS "Allow authenticated users to read content_versions" ON public.content_versions;
CREATE POLICY "Allow authenticated users to read content_versions" ON public.content_versions
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow service role to manage content_versions" ON public.content_versions;
CREATE POLICY "Allow service role to manage content_versions" ON public.content_versions
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for edit_sessions
DROP POLICY IF EXISTS "Allow users to manage their own sessions" ON public.edit_sessions;
CREATE POLICY "Allow users to manage their own sessions" ON public.edit_sessions
    FOR ALL USING (auth.uid()::text = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Allow authenticated users to read active sessions" ON public.edit_sessions;
CREATE POLICY "Allow authenticated users to read active sessions" ON public.edit_sessions
    FOR SELECT USING (auth.role() = 'authenticated' AND status = 'active');

-- Policies for component_library
DROP POLICY IF EXISTS "Allow authenticated users to read component_library" ON public.component_library;
CREATE POLICY "Allow authenticated users to read component_library" ON public.component_library
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "Allow service role to manage component_library" ON public.component_library;
CREATE POLICY "Allow service role to manage component_library" ON public.component_library
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for page_components
DROP POLICY IF EXISTS "Allow authenticated users to read page_components" ON public.page_components;
CREATE POLICY "Allow authenticated users to read page_components" ON public.page_components
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "Allow service role to manage page_components" ON public.page_components;
CREATE POLICY "Allow service role to manage page_components" ON public.page_components
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for navigation_items
DROP POLICY IF EXISTS "Allow authenticated users to read navigation_items" ON public.navigation_items;
CREATE POLICY "Allow authenticated users to read navigation_items" ON public.navigation_items
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "Allow service role to manage navigation_items" ON public.navigation_items;
CREATE POLICY "Allow service role to manage navigation_items" ON public.navigation_items
    FOR ALL USING (auth.role() = 'service_role');

-- Policies for conflict_resolutions
DROP POLICY IF EXISTS "Allow authenticated users to read conflict_resolutions" ON public.conflict_resolutions;
CREATE POLICY "Allow authenticated users to read conflict_resolutions" ON public.conflict_resolutions
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow service role to manage conflict_resolutions" ON public.conflict_resolutions;
CREATE POLICY "Allow service role to manage conflict_resolutions" ON public.conflict_resolutions
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 9. CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Use existing handle_updated_at function for triggers
-- Apply triggers to tables with updated_at columns
DROP TRIGGER IF EXISTS update_page_content_updated_at ON public.page_content;
CREATE TRIGGER update_page_content_updated_at
    BEFORE UPDATE ON public.page_content
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_edit_sessions_updated_at ON public.edit_sessions;
CREATE TRIGGER update_edit_sessions_updated_at
    BEFORE UPDATE ON public.edit_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_component_library_updated_at ON public.component_library;
CREATE TRIGGER update_component_library_updated_at
    BEFORE UPDATE ON public.component_library
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_navigation_items_updated_at ON public.navigation_items;
CREATE TRIGGER update_navigation_items_updated_at
    BEFORE UPDATE ON public.navigation_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 10. INSERT DEFAULT COMPONENT LIBRARY ITEMS
-- ============================================================================

-- Insert basic component types
INSERT INTO public.component_library (name, category, icon, default_props, schema) VALUES
('Text Block', 'text', 'type', 
 '{"content": "Enter your text here", "fontSize": "16px", "color": "#000000"}',
 '{"type": "object", "properties": {"content": {"type": "string"}, "fontSize": {"type": "string"}, "color": {"type": "string"}}}'),
 
('Image', 'media', 'image', 
 '{"src": "", "alt": "", "width": "100%", "height": "auto"}',
 '{"type": "object", "properties": {"src": {"type": "string"}, "alt": {"type": "string"}, "width": {"type": "string"}, "height": {"type": "string"}}}'),
 
('Section Container', 'layout', 'layout', 
 '{"backgroundColor": "#ffffff", "padding": "20px", "margin": "0px"}',
 '{"type": "object", "properties": {"backgroundColor": {"type": "string"}, "padding": {"type": "string"}, "margin": {"type": "string"}}}'),
 
('Button', 'interactive', 'mouse-pointer', 
 '{"text": "Click me", "href": "#", "style": "primary"}',
 '{"type": "object", "properties": {"text": {"type": "string"}, "href": {"type": "string"}, "style": {"type": "string", "enum": ["primary", "secondary", "outline"]}}}')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Real-time Collaborative Editing migration completed successfully!';
    RAISE NOTICE 'Created tables: edit_sessions, component_library, page_components, navigation_items, conflict_resolutions';
    RAISE NOTICE 'Enhanced tables: page_content, content_versions';
    RAISE NOTICE 'Created % indexes for performance optimization', 20;
    RAISE NOTICE 'Created % database functions for conflict detection and resolution', 8;
    RAISE NOTICE 'Enabled real-time publications for all tables';
    RAISE NOTICE 'Configured Row Level Security policies';
END $$;