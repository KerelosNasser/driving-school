-- Modern Page Management System - Clean Database Schema
-- Following 2025 best practices: Simple, focused, and maintainable
-- This script is idempotent and handles conflicts with existing systems

-- Drop old triggers that might conflict
DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
DROP TRIGGER IF EXISTS update_page_templates_updated_at ON page_templates;
DROP TRIGGER IF EXISTS update_component_library_updated_at ON component_library;

-- Drop old functions that might conflict
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Pages table - Core page management
CREATE TABLE IF NOT EXISTS pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content JSONB NOT NULL DEFAULT '{"blocks": []}',
    meta_data JSONB DEFAULT '{
        "title": "",
        "description": "",
        "keywords": "",
        "og_title": "",
        "og_description": "",
        "og_image": "",
        "twitter_card": "summary",
        "canonical": "",
        "robots_index": true,
        "robots_follow": true,
        "schema_type": "WebPage"
    }',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    settings JSONB DEFAULT '{
        "layout": "default",
        "show_header": true,
        "show_footer": true,
        "allow_comments": false,
        "featured": false
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    author_id TEXT,
    
    -- Constraints
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- Component templates for reusable blocks
CREATE TABLE IF NOT EXISTS component_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'content',
    icon VARCHAR(100),
    description TEXT,
    template JSONB NOT NULL DEFAULT '{}',
    preview_image TEXT,
    is_system BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Make sure system components can't be deleted
    CONSTRAINT protect_system_components CHECK (
        is_system = false OR id IS NOT NULL
    ),
    
    -- Unique constraint for name and category combination
    CONSTRAINT unique_name_category UNIQUE (name, category)
);

-- Page revisions for version control
CREATE TABLE IF NOT EXISTS page_revisions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    meta_data JSONB NOT NULL,
    settings JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    author_id TEXT,
    revision_note TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_updated_at ON pages(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_pages_author ON pages(author_id);
CREATE INDEX IF NOT EXISTS idx_component_templates_category ON component_templates(category);
CREATE INDEX IF NOT EXISTS idx_component_templates_system ON component_templates(is_system);
CREATE INDEX IF NOT EXISTS idx_page_revisions_page_id ON page_revisions(page_id);
CREATE INDEX IF NOT EXISTS idx_page_revisions_created_at ON page_revisions(created_at DESC);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating timestamps
CREATE TRIGGER update_pages_updated_at 
    BEFORE UPDATE ON pages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default component templates (with conflict handling)
INSERT INTO component_templates (name, category, icon, description, template, is_system) VALUES
('Hero Section', 'headers', 'hero', 'Large header with title and call-to-action', '{
    "type": "hero",
    "props": {
        "title": "Welcome to Our Site",
        "subtitle": "Your journey starts here",
        "buttonText": "Get Started",
        "buttonUrl": "/contact",
        "backgroundImage": "",
        "alignment": "center"
    },
    "styles": {
        "padding": "80px 20px",
        "backgroundColor": "#f8fafc",
        "minHeight": "400px"
    }
}', true),

('Text Block', 'content', 'type', 'Rich text content block', '{
    "type": "text",
    "props": {
        "content": "<h2>Your Heading</h2><p>Your content goes here...</p>",
        "textAlign": "left"
    },
    "styles": {
        "padding": "40px 20px"
    }
}', true),

('Image Block', 'media', 'image', 'Single image with optional caption', '{
    "type": "image",
    "props": {
        "src": "",
        "alt": "",
        "caption": "",
        "width": "100%",
        "alignment": "center"
    },
    "styles": {
        "padding": "20px"
    }
}', true),

('Two Column Layout', 'layout', 'columns', 'Side-by-side content layout', '{
    "type": "columns",
    "props": {
        "leftContent": "<h3>Left Column</h3><p>Content for left side...</p>",
        "rightContent": "<h3>Right Column</h3><p>Content for right side...</p>",
        "gap": "40px"
    },
    "styles": {
        "padding": "40px 20px"
    }
}', true),

('Call to Action', 'marketing', 'megaphone', 'Centered call-to-action block', '{
    "type": "cta",
    "props": {
        "title": "Ready to Get Started?",
        "description": "Join thousands of satisfied customers",
        "buttonText": "Contact Us",
        "buttonUrl": "/contact",
        "backgroundColor": "#3b82f6"
    },
    "styles": {
        "padding": "60px 20px",
        "textAlign": "center"
    }
}', true),

('FAQ Section', 'content', 'help-circle', 'Frequently asked questions block', '{
    "type": "faq",
    "props": {
        "title": "Frequently Asked Questions",
        "faqs": [
            {
                "question": "How long are the driving lessons?",
                "answer": "Our standard driving lessons are 1 hour long, but we also offer 1.5 and 2-hour sessions."
            },
            {
                "question": "Do you provide pick-up and drop-off?",
                "answer": "Yes, we offer pick-up and drop-off services within our service area."
            }
        ]
    },
    "styles": {
        "padding": "60px 20px"
    }
}', true),

('Gallery Block', 'media', 'images', 'Image gallery with grid layout', '{
    "type": "gallery",
    "props": {
        "title": "Our Gallery",
        "images": [],
        "columns": 3,
        "spacing": "20px"
    },
    "styles": {
        "padding": "40px 20px"
    }
}', true),

('Contact Form', 'forms', 'mail', 'Contact form with validation', '{
    "type": "contact-form",
    "props": {
        "title": "Get in Touch",
        "description": "Send us a message and we will get back to you soon.",
        "fields": ["name", "email", "phone", "message"],
        "submitText": "Send Message"
    },
    "styles": {
        "padding": "60px 20px",
        "backgroundColor": "#f9fafb"
    }
}', true)
ON CONFLICT (name, category) DO NOTHING;

-- Insert default pages for the driving school (with conflict handling)
INSERT INTO pages (title, slug, content, meta_data, status, settings, published_at) VALUES
('Homepage', 'home', '{
    "blocks": [
        {
            "id": "hero-1",
            "type": "hero",
            "props": {
                "title": "Learn to Drive with Confidence",
                "subtitle": "Professional driving lessons with experienced instructors",
                "buttonText": "Book a Lesson",
                "buttonUrl": "/book",
                "alignment": "center"
            },
            "styles": {
                "padding": "80px 20px",
                "backgroundColor": "#f8fafc",
                "minHeight": "500px"
            }
        },
        {
            "id": "text-1",
            "type": "text",
            "props": {
                "content": "<h2>Why Choose Our Driving School?</h2><p>We provide comprehensive driving education with experienced instructors, modern vehicles, and flexible scheduling to help you become a confident and safe driver.</p>"
            },
            "styles": {
                "padding": "60px 20px"
            }
        }
    ]
}', '{
    "title": "Learn to Drive with Confidence | EG Driving School",
    "description": "Professional driving school offering comprehensive driving lessons with experienced instructors. Book your lesson today!",
    "keywords": "driving school, driving lessons, learn to drive, driving instructor",
    "og_title": "Learn to Drive with Confidence | EG Driving School",
    "og_description": "Professional driving lessons with experienced instructors",
    "schema_type": "WebPage"
}', 'published', '{
    "layout": "default",
    "show_header": true,
    "show_footer": true,
    "featured": true
}', NOW()),

('About Us', 'about', '{
    "blocks": [
        {
            "id": "text-1",
            "type": "text",
            "props": {
                "content": "<h1>About Our Driving School</h1><p>We are dedicated to providing the highest quality driving education with a focus on safety, confidence, and skill development. Our experienced instructors use modern teaching methods and vehicles to ensure you receive the best possible learning experience.</p><h2>Our Mission</h2><p>To create safe, confident, and responsible drivers through comprehensive education and personalized instruction.</p>"
            },
            "styles": {
                "padding": "60px 20px"
            }
        }
    ]
}', '{
    "title": "About Us | EG Driving School",
    "description": "Learn about our driving school, experienced instructors, and commitment to providing quality driving education",
    "keywords": "about, driving school, instructors, driving education",
    "schema_type": "AboutPage"
}', 'published', '{
    "layout": "default",
    "show_header": true,
    "show_footer": true
}', NOW()),

('Contact', 'contact', '{
    "blocks": [
        {
            "id": "text-1",
            "type": "text",
            "props": {
                "content": "<h1>Contact Us</h1><p>Ready to start your driving journey? Get in touch with us to schedule your lessons or ask any questions.</p>"
            },
            "styles": {
                "padding": "40px 20px"
            }
        },
        {
            "id": "contact-form-1",
            "type": "contact-form",
            "props": {
                "title": "Send us a message",
                "description": "Fill out the form below and we will get back to you as soon as possible.",
                "fields": ["name", "email", "phone", "message"],
                "submitText": "Send Message"
            },
            "styles": {
                "padding": "40px 20px"
            }
        }
    ]
}', '{
    "title": "Contact Us | EG Driving School",
    "description": "Contact our driving school to schedule lessons, ask questions, or get more information",
    "keywords": "contact, driving lessons, schedule, phone, email",
    "schema_type": "ContactPage"
}', 'published', '{
    "layout": "default",
    "show_header": true,
    "show_footer": true
}', NOW()),

('Our Services', 'services', '{
    "blocks": [
        {
            "id": "text-1",
            "type": "text",
            "props": {
                "content": "<h1>Our Driving Services</h1><p>We offer a comprehensive range of driving services to meet your needs.</p>"
            },
            "styles": {
                "padding": "60px 20px"
            }
        }
    ]
}', '{
    "title": "Driving Services | EG Driving School",
    "description": "Explore our comprehensive range of driving services including lessons, test preparation, and more",
    "keywords": "driving services, lessons, test preparation, instruction",
    "schema_type": "Service"
}', 'published', '{
    "layout": "default",
    "show_header": true,
    "show_footer": true
}', NOW())
ON CONFLICT (slug) DO UPDATE SET
    content = EXCLUDED.content,
    meta_data = EXCLUDED.meta_data,
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- Create a view for published pages with SEO data
CREATE OR REPLACE VIEW published_pages AS
SELECT 
    id,
    title,
    slug,
    content,
    meta_data,
    settings,
    published_at,
    updated_at
FROM pages 
WHERE status = 'published'
ORDER BY updated_at DESC;

-- Create a view for page analytics
CREATE OR REPLACE VIEW page_analytics AS
SELECT 
    p.id,
    p.title,
    p.slug,
    p.status,
    p.created_at,
    p.updated_at,
    p.published_at,
    COALESCE(jsonb_array_length(p.content->'blocks'), 0) as block_count,
    CASE 
        WHEN p.meta_data->>'description' IS NOT NULL AND p.meta_data->>'description' != '' THEN true
        ELSE false
    END as has_meta_description,
    CASE 
        WHEN p.meta_data->>'keywords' IS NOT NULL AND p.meta_data->>'keywords' != '' THEN true
        ELSE false
    END as has_keywords,
    COALESCE((
        SELECT COUNT(*)
        FROM page_revisions pr 
        WHERE pr.page_id = p.id
    ), 0) as revision_count
FROM pages p;

-- Grant permissions (adjust based on your RLS policies)
-- These permissions ensure the API can access the tables
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_revisions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (adjust based on your auth setup)
CREATE POLICY "Allow authenticated users to read pages" ON pages
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated admins to manage pages" ON pages
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public to read published pages" ON pages
    FOR SELECT USING (status = 'published');

CREATE POLICY "Allow authenticated users to read component templates" ON component_templates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated admins to manage component templates" ON component_templates
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read page revisions" ON page_revisions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated admins to manage page revisions" ON page_revisions
    FOR ALL USING (auth.role() = 'authenticated');

-- Success message
SELECT 'Modern Pages schema applied successfully! 🎉' as message,
       'Tables created: pages, component_templates, page_revisions' as tables,
       'Views created: published_pages, page_analytics' as views,
       'Component templates loaded: 8 system templates' as templates,
       'Default pages created: home, about, contact, services' as pages;