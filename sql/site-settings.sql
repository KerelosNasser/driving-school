-- Create site_settings table for storing theme configurations and other site settings
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);

-- Insert default theme configuration
INSERT INTO site_settings (setting_key, setting_value, description) 
VALUES (
    'theme_config',
    '{
        "colors": {
            "primary": "#EDE513",
            "secondary": "#64748b",
            "accent": "#f59e0b",
            "background": "#ffffff",
            "foreground": "#020817",
            "muted": "#f1f5f9",
            "destructive": "#ef4444",
            "border": "#e2e8f0",
            "ring": "#EDE513"
        },
        "typography": {
            "fontFamily": "Inter, sans-serif",
            "headingFontFamily": "Inter, sans-serif",
            "lineHeight": 1.5,
            "letterSpacing": 0
        },
        "layout": {
            "containerMaxWidth": "1200px",
            "borderRadius": 8,
            "spacing": 16,
            "headerHeight": 80,
            "footerHeight": 120,
            "sidebarWidth": 280
        },
        "darkMode": false,
        "customCss": ""
    }',
    'Website theme configuration including colors, typography, and layout settings'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Update function to automatically set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();