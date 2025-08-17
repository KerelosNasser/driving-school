-- Content Management Schema Extension
-- Add this to your existing database schema

-- Site content table for managing dynamic content
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_key TEXT UNIQUE NOT NULL, -- e.g., 'hero_image', 'instructor_bio_text', 'gallery_images'
  content_type TEXT NOT NULL CHECK (content_type IN ('image', 'text', 'json', 'boolean')),
  content_value TEXT, -- For text content or image URLs
  content_json JSONB, -- For complex data like gallery arrays
  page_section TEXT NOT NULL, -- e.g., 'home', 'about', 'global'
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_site_content_key ON site_content(content_key);
CREATE INDEX IF NOT EXISTS idx_site_content_page_section ON site_content(page_section);
CREATE INDEX IF NOT EXISTS idx_site_content_active ON site_content(is_active);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE
    ON site_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();