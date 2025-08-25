-- Supabase Storage Configuration for Media Library
-- This script sets up bucket policies for the media library
-- Run this in the Supabase SQL editor

-- Note: The site-content bucket should be created via the Supabase Dashboard
-- Go to Storage > Create bucket > name: 'site-content' > public: true

-- Set up RLS policies for the site-content bucket
-- First, drop existing policies if they exist (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Public read access for site-content" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to site-content" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own uploads in site-content" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete from site-content" ON storage.objects;

-- Policy 1: Public read access to all files in site-content bucket
CREATE POLICY "Public read access for site-content"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-content');

-- Policy 2: Authenticated users can upload to site-content bucket
CREATE POLICY "Authenticated users can upload to site-content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'site-content' 
    AND (
        -- Allow uploads to specific paths
        name LIKE 'content-images/%' OR
        name LIKE 'media-library/%' OR
        name LIKE 'temp-uploads/%'
    )
);

-- Policy 3: Users can update their own uploads
CREATE POLICY "Users can update own uploads in site-content"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'site-content'
    AND owner = auth.uid()
)
WITH CHECK (
    bucket_id = 'site-content'
    AND owner = auth.uid()
);

-- Policy 4: Authenticated users can delete their own files
-- Note: For admin-only delete, you'll need to check admin status in your application
CREATE POLICY "Users can delete own uploads in site-content"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'site-content'
    AND owner = auth.uid()
);

-- Utility functions for the media library (these work with standard permissions)

-- Function to get storage usage statistics
CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS TABLE (
    total_files BIGINT,
    total_size BIGINT,
    total_size_mb NUMERIC,
    files_by_type JSONB,
    size_by_type JSONB,
    recent_uploads BIGINT
) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH file_stats AS (
        SELECT 
            mf.file_type,
            COUNT(*) as file_count,
            SUM(mf.file_size) as total_size,
            COUNT(*) FILTER (WHERE mf.created_at > NOW() - INTERVAL '7 days') as recent_count
        FROM media_files mf 
        WHERE mf.is_active = true
        GROUP BY mf.file_type
    ),
    aggregated_stats AS (
        SELECT 
            SUM(file_count) as total_files,
            SUM(total_size) as total_size,
            ROUND(SUM(total_size) / 1024.0 / 1024.0, 2) as total_size_mb,
            jsonb_object_agg(file_type, file_count) as files_by_type,
            jsonb_object_agg(file_type, ROUND(total_size / 1024.0 / 1024.0, 2)) as size_by_type,
            SUM(recent_count) as recent_uploads
        FROM file_stats
    )
    SELECT * FROM aggregated_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to generate organized storage paths
CREATE OR REPLACE FUNCTION generate_storage_path(
    file_type TEXT,
    file_extension TEXT DEFAULT 'jpg',
    subfolder TEXT DEFAULT NULL
)
RETURNS TEXT 
SECURITY DEFINER
AS $$
DECLARE
    date_path TEXT;
    type_folder TEXT;
    final_path TEXT;
BEGIN
    -- Generate date-based path (YYYY/MM)
    date_path := TO_CHAR(NOW(), 'YYYY/MM');
    
    -- Determine type folder
    CASE file_type
        WHEN 'image' THEN type_folder := 'images';
        WHEN 'video' THEN type_folder := 'videos';
        WHEN 'audio' THEN type_folder := 'audio';
        WHEN 'document' THEN type_folder := 'documents';
        ELSE type_folder := 'other';
    END CASE;
    
    -- Build final path
    final_path := 'media-library/' || type_folder || '/' || date_path;
    
    -- Add subfolder if specified
    IF subfolder IS NOT NULL AND subfolder != '' THEN
        final_path := final_path || '/' || subfolder;
    END IF;
    
    -- Add filename with timestamp and UUID
    final_path := final_path || '/' || 
                 EXTRACT(EPOCH FROM NOW())::TEXT || '_' || 
                 gen_random_uuid()::TEXT || '.' || 
                 file_extension;
    
    RETURN final_path;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_storage_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_storage_path(TEXT, TEXT, TEXT) TO authenticated;