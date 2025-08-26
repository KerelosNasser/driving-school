-- Page Content Table - For storing editable website content
-- This table stores all editable content for the website including text, JSON, and file references
-- Used by the Terms & Conditions component and other editable content

CREATE TABLE IF NOT EXISTS page_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_name VARCHAR(100) NOT NULL, -- e.g., 'packages', 'home', 'about'
    content_key VARCHAR(255) NOT NULL, -- e.g., 'packages_terms_conditions', 'hero_title'
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('text', 'json', 'file', 'boolean')),
    
    -- Content storage fields (only one should be populated based on content_type)
    content_value TEXT, -- For text content
    content_json JSONB, -- For JSON/array content (like terms & conditions)
    file_url TEXT, -- For file references
    
    -- Additional metadata
    alt_text TEXT, -- For images
    is_active BOOLEAN DEFAULT true,
    is_draft BOOLEAN DEFAULT false,
    
    -- Audit fields
    updated_by VARCHAR(255), -- User ID who last updated
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate content keys per page
    CONSTRAINT unique_page_content UNIQUE (page_name, content_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_content_page ON page_content(page_name);
CREATE INDEX IF NOT EXISTS idx_page_content_key ON page_content(content_key);
CREATE INDEX IF NOT EXISTS idx_page_content_type ON page_content(content_type);
CREATE INDEX IF NOT EXISTS idx_page_content_active ON page_content(is_active);
CREATE INDEX IF NOT EXISTS idx_page_content_updated ON page_content(updated_at DESC);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_page_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating timestamps
DROP TRIGGER IF EXISTS update_page_content_updated_at ON page_content;
CREATE TRIGGER update_page_content_updated_at
    BEFORE UPDATE ON page_content
    FOR EACH ROW
    EXECUTE FUNCTION update_page_content_updated_at();

-- Enable RLS for security
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your auth setup)
-- Allow all authenticated users to read content
CREATE POLICY "Allow authenticated users to read page_content" ON page_content
    FOR SELECT USING (auth.role() = 'authenticated' OR is_active = true);

-- Allow service role (admin API) to manage all content
CREATE POLICY "Allow service role to manage page_content" ON page_content
    FOR ALL USING (auth.role() = 'service_role');

-- Success message
SELECT 'Page Content table created successfully! 🎉' as message,
       'Table: page_content with proper indexes and RLS policies' as details,
       'Ready for Terms & Conditions and other editable content' as status;