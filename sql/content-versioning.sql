-- Content Versioning System for WordPress-like Edit History
-- This schema provides version control for content changes with rollback capabilities

-- Create content_versions table for maintaining edit history
CREATE TABLE IF NOT EXISTS content_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_name VARCHAR(100) NOT NULL,
    content_key VARCHAR(255) NOT NULL,
    
    -- Content storage (same as main table)
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('text', 'json', 'file', 'boolean')),
    content_value TEXT,
    content_json JSONB,
    file_url TEXT,
    alt_text TEXT,
    
    -- Version metadata
    version VARCHAR(50) NOT NULL,
    is_published BOOLEAN DEFAULT true,
    
    -- Change metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    
    -- Optional change description
    change_description TEXT,
    
    -- Reference to original content
    CONSTRAINT fk_content_versions_original 
        FOREIGN KEY (page_name, content_key) 
        REFERENCES page_content(page_name, content_key) 
        ON DELETE CASCADE
);

-- Create indexes for efficient history queries
CREATE INDEX IF NOT EXISTS idx_content_versions_page_key ON content_versions(page_name, content_key);
CREATE INDEX IF NOT EXISTS idx_content_versions_created ON content_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_versions_user ON content_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_content_versions_version ON content_versions(version);

-- Add version column to main page_content table
ALTER TABLE page_content 
ADD COLUMN IF NOT EXISTS version VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_conflict_at TIMESTAMP WITH TIME ZONE;

-- Create function to automatically create version entries
CREATE OR REPLACE FUNCTION create_content_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create version for updates, not inserts
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO content_versions (
            page_name,
            content_key,
            content_type,
            content_value,
            content_json,
            file_url,
            alt_text,
            version,
            created_by,
            change_description
        ) VALUES (
            OLD.page_name,
            OLD.content_key,
            OLD.content_type,
            OLD.content_value,
            OLD.content_json,
            OLD.file_url,
            OLD.alt_text,
            OLD.version,
            OLD.updated_by,
            'Auto-saved version before update'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic versioning
DROP TRIGGER IF EXISTS trigger_create_content_version ON page_content;
CREATE TRIGGER trigger_create_content_version
    BEFORE UPDATE ON page_content
    FOR EACH ROW
    EXECUTE FUNCTION create_content_version();

-- Create function for conflict detection
CREATE OR REPLACE FUNCTION detect_content_conflict(
    p_page_name VARCHAR(100),
    p_content_key VARCHAR(255),
    p_expected_version VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    current_version VARCHAR(50);
BEGIN
    SELECT version INTO current_version
    FROM page_content
    WHERE page_name = p_page_name AND content_key = p_content_key;
    
    -- If no current version or versions match, no conflict
    IF current_version IS NULL OR current_version = p_expected_version THEN
        RETURN FALSE;
    END IF;
    
    -- Update conflict timestamp
    UPDATE page_content 
    SET last_conflict_at = NOW()
    WHERE page_name = p_page_name AND content_key = p_content_key;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get content with conflict check
CREATE OR REPLACE FUNCTION upsert_content_with_version(
    p_page_name VARCHAR(100),
    p_content_key VARCHAR(255),
    p_content_type VARCHAR(20),
    p_version VARCHAR(50),
    p_updated_by VARCHAR(255),
    p_content_value TEXT DEFAULT NULL,
    p_content_json JSONB DEFAULT NULL,
    p_file_url TEXT DEFAULT NULL,
    p_alt_text TEXT DEFAULT NULL,
    p_expected_version VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, conflict BOOLEAN, new_version VARCHAR(50)) AS $$
DECLARE
    has_conflict BOOLEAN := FALSE;
    result_version VARCHAR(50);
BEGIN
    -- Check for conflicts if expected version is provided
    IF p_expected_version IS NOT NULL THEN
        has_conflict := detect_content_conflict(p_page_name, p_content_key, p_expected_version);
        
        IF has_conflict THEN
            RETURN QUERY SELECT FALSE, TRUE, p_expected_version;
            RETURN;
        END IF;
    END IF;
    
    -- Proceed with upsert
    INSERT INTO page_content (
        page_name,
        content_key,
        content_type,
        content_value,
        content_json,
        file_url,
        alt_text,
        version,
        updated_by,
        updated_at,
        is_active
    ) VALUES (
        p_page_name,
        p_content_key,
        p_content_type,
        p_content_value,
        p_content_json,
        p_file_url,
        p_alt_text,
        p_version,
        p_updated_by,
        NOW(),
        TRUE
    )
    ON CONFLICT (page_name, content_key) 
    DO UPDATE SET
        content_type = EXCLUDED.content_type,
        content_value = EXCLUDED.content_value,
        content_json = EXCLUDED.content_json,
        file_url = EXCLUDED.file_url,
        alt_text = EXCLUDED.alt_text,
        version = EXCLUDED.version,
        updated_by = EXCLUDED.updated_by,
        updated_at = EXCLUDED.updated_at;
    
    result_version := p_version;
    RETURN QUERY SELECT TRUE, FALSE, result_version;
END;
$$ LANGUAGE plpgsql;

-- Create view for easy version history access
CREATE OR REPLACE VIEW content_history AS
SELECT 
    cv.id,
    cv.page_name,
    cv.content_key,
    cv.content_type,
    cv.content_value,
    cv.content_json,
    cv.file_url,
    cv.version,
    cv.created_at,
    cv.created_by,
    cv.change_description,
    pc.version as current_version,
    CASE 
        WHEN cv.version = pc.version THEN TRUE 
        ELSE FALSE 
    END as is_current
FROM content_versions cv
LEFT JOIN page_content pc ON cv.page_name = pc.page_name AND cv.content_key = pc.content_key
ORDER BY cv.created_at DESC;

-- RLS Policies for versioning tables
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read version history
CREATE POLICY "Allow users to read content_versions" ON content_versions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role to manage versions
CREATE POLICY "Allow service role to manage content_versions" ON content_versions
    FOR ALL USING (auth.role() = 'service_role');

-- Create cleanup function to prevent version table from growing too large
CREATE OR REPLACE FUNCTION cleanup_old_versions()
RETURNS void AS $$
BEGIN
    -- Keep only last 50 versions per content key
    DELETE FROM content_versions cv1
    WHERE cv1.id NOT IN (
        SELECT cv2.id 
        FROM content_versions cv2 
        WHERE cv2.page_name = cv1.page_name 
        AND cv2.content_key = cv1.content_key
        ORDER BY cv2.created_at DESC 
        LIMIT 50
    );
    
    -- Delete versions older than 90 days
    DELETE FROM content_versions
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run periodically (you can set this up with pg_cron or run manually)
-- SELECT cron.schedule('cleanup-content-versions', '0 2 * * *', 'SELECT cleanup_old_versions();');

-- Success message
SELECT 'Content Versioning System created successfully! 🚀' as message,
       'Features: Edit history, conflict detection, version rollback' as features,
       'Tables: content_versions, updated page_content' as tables;
