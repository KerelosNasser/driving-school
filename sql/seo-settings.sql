-- Create SEO pages table for page-specific SEO settings
CREATE TABLE IF NOT EXISTS seo_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_url VARCHAR(500) UNIQUE NOT NULL,
    title VARCHAR(255),
    description TEXT,
    keywords TEXT,
    og_title VARCHAR(255),
    og_description TEXT,
    og_image VARCHAR(500),
    twitter_title VARCHAR(255),
    twitter_description TEXT,
    twitter_image VARCHAR(500),
    canonical_url VARCHAR(500),
    robots VARCHAR(100) DEFAULT 'index, follow',
    schema_markup JSONB,
    is_active BOOLEAN DEFAULT true,
    updated_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_seo_pages_url ON seo_pages(page_url);
CREATE INDEX IF NOT EXISTS idx_seo_pages_active ON seo_pages(is_active);

-- Insert default SEO settings for main pages
INSERT INTO seo_pages (page_url, title, description, keywords, og_title, og_description, og_image, twitter_title, twitter_description, twitter_image, canonical_url, robots) 
VALUES 
(
    '/',
    'EG Driving School - Professional Driving Lessons & Training',
    'Learn to drive with EG Driving School - Australia''s premier driving instruction service. Professional instructors, flexible scheduling, comprehensive packages, and excellent pass rates. Book your driving lessons today!',
    'driving lessons, driving school, learn to drive, driving instructor, driving test preparation, professional driving lessons, driving school near me, beginner driving lessons, defensive driving course, driving license training, Brisbane driving school',
    'EG Driving School - Professional Driving Lessons & Training',
    'Learn to drive with EG Driving School - Australia''s premier driving instruction service. Professional instructors, flexible scheduling, and excellent pass rates.',
    '/og-image.jpg',
    'EG Driving School - Professional Driving Lessons',
    'Learn to drive with Brisbane''s top-rated driving school. Expert instructors and high pass rates.',
    '/twitter-image.jpg',
    'https://egdrivingschool.com/',
    'index, follow'
),
(
    '/packages',
    'Driving Lesson Packages & Pricing | EG Driving School',
    'Choose from our range of driving lesson packages designed to suit different learning needs and budgets. Beginner to advanced courses available with flexible scheduling.',
    'driving packages, lesson prices, driving courses, driving lesson packages, learn to drive packages, driving school prices, beginner driving lessons',
    'Driving Lesson Packages & Pricing | EG Driving School',
    'Choose from our range of driving lesson packages designed to suit different learning needs and budgets.',
    '/packages-og.jpg',
    'Driving Lesson Packages | EG Driving School',
    'Choose the perfect driving lesson package for your needs and budget.',
    '/packages-twitter.jpg',
    'https://egdrivingschool.com/packages',
    'index, follow'
),
(
    '/reviews',
    'Student Reviews & Testimonials | EG Driving School',
    'Read genuine reviews from our successful students. See why EG Driving School has Brisbane''s highest student satisfaction rates and pass rates.',
    'driving school reviews, student testimonials, driving instructor reviews, Brisbane driving school reviews, customer feedback',
    'Student Reviews & Testimonials | EG Driving School',
    'Read genuine reviews from our successful students and see why we have Brisbane''s highest satisfaction rates.',
    '/reviews-og.jpg',
    'Student Reviews | EG Driving School',
    'See what our successful students say about their experience with EG Driving School.',
    '/reviews-twitter.jpg',
    'https://egdrivingschool.com/reviews',
    'index, follow'
),
(
    '/contact',
    'Contact EG Driving School | Book Your Driving Lessons',
    'Get in touch with EG Driving School to book your driving lessons, ask questions, or learn more about our services. Multiple contact options available.',
    'contact driving school, book driving lessons, driving lesson booking, contact driving instructor, Brisbane driving school contact',
    'Contact EG Driving School | Book Your Driving Lessons',
    'Get in touch with EG Driving School to book your driving lessons or ask questions about our services.',
    '/contact-og.jpg',
    'Contact EG Driving School',
    'Book your driving lessons or get in touch with our friendly team.',
    '/contact-twitter.jpg',
    'https://egdrivingschool.com/contact',
    'index, follow'
),
(
    '/about',
    'About EG Driving School | Professional Driving Instructor',
    'Learn about EG Driving School, our experienced instructor, teaching methods, and service areas across Brisbane. Professional, patient, and proven results.',
    'about driving school, driving instructor Brisbane, professional driving instructor, driving school Brisbane, experienced driving teacher',
    'About EG Driving School | Professional Driving Instructor',
    'Learn about our experienced instructor, proven teaching methods, and comprehensive service across Brisbane.',
    '/about-og.jpg',
    'About EG Driving School',
    'Meet our professional instructor and learn about our proven teaching methods.',
    '/about-twitter.jpg',
    'https://egdrivingschool.com/about',
    'index, follow'
),
(
    '/book',
    'Book Driving Lessons Online | EG Driving School',
    'Book your driving lessons online with EG Driving School. Easy online booking system, flexible scheduling, and instant confirmation.',
    'book driving lessons, online booking, driving lesson booking, schedule driving lessons, book driving instructor',
    'Book Driving Lessons Online | EG Driving School',
    'Book your driving lessons online with our easy booking system and flexible scheduling options.',
    '/book-og.jpg',
    'Book Driving Lessons | EG Driving School',
    'Easy online booking for your driving lessons with instant confirmation.',
    '/book-twitter.jpg',
    'https://egdrivingschool.com/book',
    'index, follow'
)
ON CONFLICT (page_url) DO NOTHING;

-- Insert default global SEO settings
INSERT INTO site_settings (setting_key, setting_value, description) 
VALUES (
    'seo_global',
    '{
        "site_name": "EG Driving School",
        "default_title": "EG Driving School - Professional Driving Lessons & Training",
        "default_description": "Learn to drive with EG Driving School - Australia''s premier driving instruction service. Professional instructors, flexible scheduling, comprehensive packages, and excellent pass rates. Book your driving lessons today!",
        "default_keywords": "driving lessons, driving school, learn to drive, driving instructor, driving test preparation, professional driving lessons, driving school near me, beginner driving lessons, defensive driving course, driving license training",
        "default_og_image": "/og-image.jpg",
        "google_analytics_id": "",
        "google_search_console_id": "",
        "facebook_app_id": "",
        "twitter_handle": "@egdrivingschool",
        "robots_txt": "User-agent: *\\nAllow: /\\nSitemap: https://egdrivingschool.com/sitemap.xml\\n\\n# Disallow admin and api routes\\nDisallow: /admin/\\nDisallow: /api/"
    }',
    'Global SEO settings including default meta tags, social media handles, and robots.txt content'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Update function to automatically set updated_at
CREATE OR REPLACE FUNCTION update_seo_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_seo_pages_updated_at ON seo_pages;
CREATE TRIGGER update_seo_pages_updated_at
    BEFORE UPDATE ON seo_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_seo_pages_updated_at();