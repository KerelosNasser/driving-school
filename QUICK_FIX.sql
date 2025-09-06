-- QUICK FIX for PostgreSQL Parameter Error
-- Run this in your Supabase SQL editor to fix the function parameter issue

-- 1. First, ensure the page_content table has the necessary columns
ALTER TABLE page_content 
ADD COLUMN IF NOT EXISTS version VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_conflict_at TIMESTAMP WITH TIME ZONE;

-- 2. Create the content_versions table if it doesn't exist
CREATE TABLE IF NOT EXISTS content_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_name VARCHAR(100) NOT NULL,
    content_key VARCHAR(255) NOT NULL,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('text', 'json', 'file', 'boolean')),
    content_value TEXT,
    content_json JSONB,
    file_url TEXT,
    alt_text TEXT,
    version VARCHAR(50) NOT NULL,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    change_description TEXT
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_versions_page_key ON content_versions(page_name, content_key);
CREATE INDEX IF NOT EXISTS idx_content_versions_created ON content_versions(created_at DESC);

-- 4. Enable RLS
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
DROP POLICY IF EXISTS "Allow users to read content_versions" ON content_versions;
CREATE POLICY "Allow users to read content_versions" ON content_versions
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow service role to manage content_versions" ON content_versions;
CREATE POLICY "Allow service role to manage content_versions" ON content_versions
    FOR ALL USING (auth.role() = 'service_role');

-- 6. Success message
SELECT '✅ Quick fix applied successfully!' as status,
       'Content versioning tables are now ready' as message,
       'You can now use the persistent content system' as next_step;
