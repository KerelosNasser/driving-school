-- Media Library Database Schema
-- Extends existing page_content system with dedicated media management

-- Create media folders table first (no dependencies)
CREATE TABLE IF NOT EXISTS media_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    
    -- Nested folder support
    parent_id UUID REFERENCES media_folders(id) ON DELETE CASCADE,
    
    -- Audit fields
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_folder_name_per_parent UNIQUE (name, parent_id)
);

-- Create media files table (depends on media_folders)
CREATE TABLE IF NOT EXISTS media_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- File identification
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL UNIQUE,
    storage_path VARCHAR(500) NOT NULL UNIQUE,
    public_url TEXT NOT NULL,
    
    -- File metadata
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'document', 'other')),
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    
    -- Media-specific metadata
    width INTEGER, -- For images and videos
    height INTEGER, -- For images and videos
    duration FLOAT, -- For videos and audio (in seconds)
    
    -- SEO and accessibility
    alt_text TEXT,
    caption TEXT,
    description TEXT,
    
    -- Organization
    folder_id UUID REFERENCES media_folders(id) ON DELETE SET NULL,
    tags TEXT[], -- Array of tags for searchability
    
    -- Integration with existing content system
    content_key VARCHAR(255), -- Links to page_content entries if used in content
    page_name VARCHAR(100), -- Page where this media is used
    
    -- Audit fields
    uploaded_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(file_type);
CREATE INDEX IF NOT EXISTS idx_media_files_folder ON media_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_media_files_content_key ON media_files(content_key);
CREATE INDEX IF NOT EXISTS idx_media_files_page_name ON media_files(page_name);
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded_by ON media_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at);
CREATE INDEX IF NOT EXISTS idx_media_files_active ON media_files(is_active);
CREATE INDEX IF NOT EXISTS idx_media_files_tags ON media_files USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_media_folders_parent ON media_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_media_folders_slug ON media_folders(slug);

-- Full-text search indexes for media files (simplified approach)
CREATE INDEX IF NOT EXISTS idx_media_files_name_search ON media_files USING GIN(to_tsvector('english', original_name));
CREATE INDEX IF NOT EXISTS idx_media_files_alt_search ON media_files USING GIN(to_tsvector('english', COALESCE(alt_text, '')));
CREATE INDEX IF NOT EXISTS idx_media_files_desc_search ON media_files USING GIN(to_tsvector('english', COALESCE(description, '')));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_media_files_updated_at ON media_files;
CREATE TRIGGER update_media_files_updated_at
    BEFORE UPDATE ON media_files
    FOR EACH ROW
    EXECUTE FUNCTION update_media_updated_at();

DROP TRIGGER IF EXISTS update_media_folders_updated_at ON media_folders;
CREATE TRIGGER update_media_folders_updated_at
    BEFORE UPDATE ON media_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_media_updated_at();

-- Function to get folder path (for breadcrumbs)
CREATE OR REPLACE FUNCTION get_folder_path(folder_uuid UUID)
RETURNS TEXT 
IMMUTABLE
AS $$
DECLARE
    folder_path TEXT := '';
    current_folder media_folders%ROWTYPE;
BEGIN
    IF folder_uuid IS NULL THEN
        RETURN '';
    END IF;
    
    -- Get current folder
    SELECT * INTO current_folder FROM media_folders WHERE id = folder_uuid;
    
    IF NOT FOUND THEN
        RETURN '';
    END IF;
    
    -- Build path recursively
    IF current_folder.parent_id IS NOT NULL THEN
        folder_path := get_folder_path(current_folder.parent_id) || '/' || current_folder.name;
    ELSE
        folder_path := current_folder.name;
    END IF;
    
    RETURN folder_path;
END;
$$ LANGUAGE plpgsql;

-- Function to count files in folder (including subfolders)
CREATE OR REPLACE FUNCTION count_folder_files(folder_uuid UUID, include_subfolders BOOLEAN DEFAULT false)
RETURNS INTEGER 
STABLE
AS $$
DECLARE
    file_count INTEGER := 0;
    subfolder_count INTEGER := 0;
BEGIN
    -- Count direct files in folder
    SELECT COUNT(*) INTO file_count 
    FROM media_files 
    WHERE folder_id = folder_uuid AND is_active = true;
    
    -- If including subfolders, count recursively
    IF include_subfolders THEN
        SELECT COALESCE(SUM(count_folder_files(id, true)), 0) INTO subfolder_count
        FROM media_folders 
        WHERE parent_id = folder_uuid;
        
        file_count := file_count + subfolder_count;
    END IF;
    
    RETURN file_count;
END;
$$ LANGUAGE plpgsql;

-- Insert default folders
INSERT INTO media_folders (name, slug, description, created_by) VALUES
    ('Images', 'images', 'General images for the website', 'system'),
    ('Instructor Photos', 'instructor-photos', 'Photos of driving instructors', 'system'),
    ('Vehicle Photos', 'vehicle-photos', 'Photos of driving school vehicles', 'system'),
    ('Student Gallery', 'student-gallery', 'Photos from driving lessons and student achievements', 'system'),
    ('Documents', 'documents', 'PDFs and other documents', 'system'),
    ('Videos', 'videos', 'Instructional and promotional videos', 'system'),
    ('Icons & Graphics', 'icons-graphics', 'Icons, logos, and graphic elements', 'system'),
    ('Backgrounds', 'backgrounds', 'Background images for various sections', 'system')
ON CONFLICT (slug) DO NOTHING;

-- View for media files with folder information (simplified)
CREATE OR REPLACE VIEW media_files_with_folders AS
SELECT 
    mf.*,
    COALESCE(folder.name, 'Root') as folder_name,
    COALESCE(folder.slug, '') as folder_slug
FROM media_files mf
LEFT JOIN media_folders folder ON mf.folder_id = folder.id
WHERE mf.is_active = true;

-- View for folder statistics (simplified)
CREATE OR REPLACE VIEW media_folder_stats AS
SELECT 
    f.*,
    COALESCE(file_counts.direct_count, 0) as direct_file_count,
    COALESCE(file_counts.direct_count, 0) as total_file_count
FROM media_folders f
LEFT JOIN (
    SELECT 
        folder_id,
        COUNT(*) as direct_count
    FROM media_files 
    WHERE is_active = true 
    GROUP BY folder_id
) file_counts ON f.id = file_counts.folder_id;

-- Function to search media files
CREATE OR REPLACE FUNCTION search_media_files(
    search_term TEXT DEFAULT '',
    file_types TEXT[] DEFAULT ARRAY['image', 'video', 'audio', 'document', 'other'],
    folder_uuid UUID DEFAULT NULL,
    include_subfolders BOOLEAN DEFAULT false,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    original_name VARCHAR(255),
    file_name VARCHAR(255),
    storage_path VARCHAR(500),
    public_url TEXT,
    file_type VARCHAR(20),
    mime_type VARCHAR(100),
    file_size BIGINT,
    width INTEGER,
    height INTEGER,
    duration FLOAT,
    alt_text TEXT,
    caption TEXT,
    description TEXT,
    folder_id UUID,
    folder_name TEXT,
    folder_path TEXT,
    tags TEXT[],
    uploaded_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mf.id,
        mf.original_name,
        mf.file_name,
        mf.storage_path,
        mf.public_url,
        mf.file_type,
        mf.mime_type,
        mf.file_size,
        mf.width,
        mf.height,
        mf.duration,
        mf.alt_text,
        mf.caption,
        mf.description,
        mf.folder_id,
        COALESCE(folder.name, 'Root') as folder_name,
        COALESCE(get_folder_path(mf.folder_id), '') as folder_path,
        mf.tags,
        mf.uploaded_by,
        mf.created_at,
        mf.updated_at
    FROM media_files mf
    LEFT JOIN media_folders folder ON mf.folder_id = folder.id
    WHERE 
        mf.is_active = true
        AND mf.file_type = ANY(file_types)
        AND (
            folder_uuid IS NULL 
            OR mf.folder_id = folder_uuid
            OR (include_subfolders AND mf.folder_id IN (
                SELECT id FROM media_folders 
                WHERE parent_id = folder_uuid OR id = folder_uuid
            ))
        )
        AND (
            search_term = '' 
            OR mf.original_name ILIKE '%' || search_term || '%'
            OR mf.alt_text ILIKE '%' || search_term || '%'
            OR mf.description ILIKE '%' || search_term || '%'
            OR mf.caption ILIKE '%' || search_term || '%'
            OR EXISTS (
                SELECT 1 FROM unnest(mf.tags) AS tag 
                WHERE tag ILIKE '%' || search_term || '%'
            )
        )
    ORDER BY mf.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up orphaned files (files not referenced in content)
CREATE OR REPLACE FUNCTION cleanup_orphaned_media(dry_run BOOLEAN DEFAULT true)
RETURNS TABLE (
    action TEXT,
    file_id UUID,
    file_name VARCHAR(255),
    storage_path VARCHAR(500),
    reason TEXT
) 
STABLE
AS $$
BEGIN
    IF dry_run THEN
        -- Return what would be deleted without actually deleting
        RETURN QUERY
        SELECT 
            'WOULD DELETE'::TEXT as action,
            mf.id as file_id,
            mf.file_name,
            mf.storage_path,
            'File not referenced in any content and older than 30 days'::TEXT as reason
        FROM media_files mf
        WHERE 
            mf.is_active = true
            AND mf.content_key IS NULL
            AND mf.created_at < NOW() - INTERVAL '30 days'
            AND NOT EXISTS (
                SELECT 1 FROM page_content pc 
                WHERE pc.content_json->>'url' = mf.public_url
                OR pc.content_value LIKE '%' || mf.public_url || '%'
                OR pc.file_url = mf.public_url
            );
    ELSE
        -- Actually perform the cleanup
        UPDATE media_files 
        SET is_active = false, deleted_at = NOW()
        WHERE 
            is_active = true
            AND content_key IS NULL
            AND created_at < NOW() - INTERVAL '30 days'
            AND NOT EXISTS (
                SELECT 1 FROM page_content pc 
                WHERE pc.content_json->>'url' = public_url
                OR pc.content_value LIKE '%' || public_url || '%'
                OR pc.file_url = public_url
            );
            
        RETURN QUERY
        SELECT 
            'DELETED'::TEXT as action,
            mf.id as file_id,
            mf.file_name,
            mf.storage_path,
            'File not referenced in any content and older than 30 days'::TEXT as reason
        FROM media_files mf
        WHERE 
            mf.is_active = false
            AND mf.deleted_at IS NOT NULL
            AND mf.deleted_at > NOW() - INTERVAL '1 minute';
    END IF;
END;
$$ LANGUAGE plpgsql;