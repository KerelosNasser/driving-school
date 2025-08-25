-- Cleanup Script for Old Page Management System
-- Run this script before applying modern-pages.sql to avoid conflicts

-- Drop old triggers that might conflict
DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
DROP TRIGGER IF EXISTS update_page_templates_updated_at ON page_templates;
DROP TRIGGER IF EXISTS update_component_library_updated_at ON component_library;

-- Drop old functions that might conflict
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop old tables if they exist (be careful with this - backup data first!)
-- Uncomment the lines below if you want to completely reset the page management system
-- DROP TABLE IF EXISTS page_revisions CASCADE;
-- DROP TABLE IF EXISTS component_library CASCADE;
-- DROP TABLE IF EXISTS page_templates CASCADE;
-- DROP TABLE IF EXISTS pages CASCADE;

-- Drop old indexes that might conflict
DROP INDEX IF EXISTS idx_pages_slug;
DROP INDEX IF EXISTS idx_pages_status;
DROP INDEX IF EXISTS idx_pages_updated_at;
DROP INDEX IF EXISTS idx_page_templates_category;
DROP INDEX IF EXISTS idx_component_library_category;

-- Clean up any old component templates with conflicting names
DELETE FROM component_templates WHERE name IN (
    'Hero Section',
    'Text Block', 
    'Image Block',
    'Two Column Layout',
    'Call to Action'
) AND is_system = true;

-- Reset any conflicting page data (uncomment if needed)
-- DELETE FROM pages WHERE slug IN ('home', 'about', 'contact');

-- Display completion message
SELECT 'Cleanup completed successfully. You can now run modern-pages.sql' as message;