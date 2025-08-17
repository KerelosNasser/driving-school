-- Initial content data
INSERT INTO site_content (content_key, content_type, content_value, page_section, display_order) VALUES
-- Home page content
('hero_image', 'image', 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80', 'home', 1),
('hero_title', 'text', 'Learn to Drive with Confidence', 'home', 2),
('hero_subtitle', 'text', 'Professional driving lessons with experienced instructors at EG Driving School - tailored to your needs.', 'home', 3),
('instructor_name', 'text', 'Michael Thompson', 'home', 4),
('instructor_image', 'image', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80', 'home', 5),
('instructor_bio_short', 'text', 'Hi there! I''m Michael, a passionate driving instructor with over 15 years of experience teaching people of all ages how to drive safely and confidently on Brisbane roads.', 'home', 6),
('instructor_experience_years', 'text', '15+', 'home', 7),

-- About page content
('about_instructor_bio_full', 'text', 'I believe in creating a relaxed, supportive learning environment where you can develop your skills at your own pace. My teaching approach is patient, thorough, and tailored to your individual needs.', 'about', 1),
('about_page_title', 'text', 'About Our Driving School', 'about', 2),
('about_page_subtitle', 'text', 'Your success on the road is our top priority. We are committed to providing the highest quality driving education in Brisbane.', 'about', 3),

-- Gallery images (JSON array)
('gallery_images', 'json', NULL, 'home', 8);

-- Update gallery images with JSON data
UPDATE site_content 
SET content_json = '[
  {
    "id": 1,
    "src": "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "alt": "Driving instructor with student",
    "title": "Professional Instruction"
  },
  {
    "id": 2,
    "src": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "alt": "Modern driving school car",
    "title": "Modern Vehicles"
  },
  {
    "id": 3,
    "src": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "alt": "Student practicing parking",
    "title": "Practical Training"
  },
  {
    "id": 4,
    "src": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "alt": "Highway driving lesson",
    "title": "Highway Confidence"
  },
  {
    "id": 5,
    "src": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "alt": "City driving practice",
    "title": "City Navigation"
  }
]'::jsonb
WHERE content_key = 'gallery_images';