-- seed.sql
-- This file contains sample data for the Driving School application database

-- Initial packages data
INSERT INTO packages (name, description, price, hours, features, popular)
VALUES 
  ('Starter Package', 'Perfect for beginners who are just starting their driving journey', 299.99, 5, '["5 hours of driving lessons", "Personalized instruction", "Flexible scheduling"]', FALSE),
  ('Standard Package', 'Our most popular package for learners with some experience', 499.99, 10, '["10 hours of driving lessons", "Personalized instruction", "Flexible scheduling", "Test preparation"]', TRUE),
  ('Premium Package', 'Comprehensive package for complete preparation', 799.99, 20, '["20 hours of driving lessons", "Personalized instruction", "Flexible scheduling", "Test preparation", "Mock driving test", "Pick-up and drop-off service"]', FALSE);

-- Sample users data
INSERT INTO users (email, full_name, phone, clerk_id)
VALUES
  ('sarah.johnson@example.com', 'Sarah Johnson', '0412345678', 'user_2NF8LmxeUrXl7KlZa1d5Qp3nMk1'),
  ('james.wilson@example.com', 'James Wilson', '0423456789', 'user_1MG7KlxdTqWk6JkYz0c4Np2lLj2'),
  ('emma.thompson@example.com', 'Emma Thompson', '0434567890', 'user_3PH9NoxfVsYm8LmZb2e6Rq4oNl3'),
  ('david.chen@example.com', 'David Chen', '0445678901', 'user_4QI0OpygWtZn9MnAc3f7Sr5pOm4'),
  ('olivia.martinez@example.com', 'Olivia Martinez', '0456789012', 'user_5RJ1PqzhXuAo0NoB4g8Ts6qPn5'),
  ('ryan.taylor@example.com', 'Ryan Taylor', '0467890123', 'user_6SK2QrAiYvBp1OpC5h9Ut7rQo6');

-- Sample reviews data
INSERT INTO reviews (user_id, rating, comment, approved, user_name, created_at)
VALUES
  ((SELECT id FROM users WHERE email = 'sarah.johnson@example.com'), 5, 'Michael is an amazing instructor! He was patient, encouraging, and really helped me build my confidence on the road. I passed my test on the first attempt!', TRUE, 'Sarah Johnson', '2025-07-15T10:30:00Z'),
  ((SELECT id FROM users WHERE email = 'james.wilson@example.com'), 5, 'Best driving instructor in Brisbane! The lessons were structured perfectly for my learning style, and Michael''s calm demeanor made me feel at ease even in stressful traffic situations.', TRUE, 'James Wilson', '2025-07-10T14:45:00Z'),
  ((SELECT id FROM users WHERE email = 'emma.thompson@example.com'), 4, 'Very professional service. The online booking system was convenient, and the instructor was always on time. Would definitely recommend to anyone learning to drive in Brisbane.', TRUE, 'Emma Thompson', '2025-07-05T09:15:00Z'),
  ((SELECT id FROM users WHERE email = 'david.chen@example.com'), 5, 'Michael''s tips and tricks for the driving test were invaluable. He knows exactly what the examiners look for and prepared me thoroughly. Thank you!', TRUE, 'David Chen', '2025-06-28T16:20:00Z'),
  ((SELECT id FROM users WHERE email = 'olivia.martinez@example.com'), 5, 'I was extremely nervous about learning to drive, but Michael made the whole experience enjoyable. His teaching methods are clear and effective. Highly recommend!', TRUE, 'Olivia Martinez', '2025-06-20T11:10:00Z'),
  ((SELECT id FROM users WHERE email = 'ryan.taylor@example.com'), 4, 'Great value for money. The package deals are well worth it, and the quality of instruction is top-notch. I feel much more confident on the road now.', TRUE, 'Ryan Taylor', '2025-06-15T13:30:00Z');

-- Sample completed bookings data
INSERT INTO bookings (user_id, package_id, date, time, status, notes, created_at)
VALUES
  ((SELECT id FROM users WHERE email = 'sarah.johnson@example.com'), (SELECT id FROM packages WHERE name = 'Standard Package'), '2025-06-10', '09:00:00', 'completed', 'First lesson went well. Student has good basic control of the vehicle.', '2025-06-01T08:30:00Z'),
  ((SELECT id FROM users WHERE email = 'sarah.johnson@example.com'), (SELECT id FROM packages WHERE name = 'Standard Package'), '2025-06-17', '09:00:00', 'completed', 'Practiced parallel parking and reverse parking. Needs more practice with parallel parking.', '2025-06-01T08:35:00Z'),
  ((SELECT id FROM users WHERE email = 'james.wilson@example.com'), (SELECT id FROM packages WHERE name = 'Premium Package'), '2025-06-12', '14:00:00', 'completed', 'Focused on highway driving and merging. Student handled it well.', '2025-06-02T10:15:00Z'),
  ((SELECT id FROM users WHERE email = 'james.wilson@example.com'), (SELECT id FROM packages WHERE name = 'Premium Package'), '2025-06-19', '14:00:00', 'completed', 'Practiced night driving. Student is progressing well.', '2025-06-02T10:20:00Z'),
  ((SELECT id FROM users WHERE email = 'emma.thompson@example.com'), (SELECT id FROM packages WHERE name = 'Starter Package'), '2025-06-15', '11:00:00', 'completed', 'First lesson. Student has some prior experience. Worked on basic maneuvers.', '2025-06-05T09:45:00Z'),
  ((SELECT id FROM users WHERE email = 'david.chen@example.com'), (SELECT id FROM packages WHERE name = 'Standard Package'), '2025-06-20', '16:00:00', 'completed', 'Mock test conducted. Student passed with minor errors. Ready for the actual test.', '2025-06-10T14:30:00Z'),
  ((SELECT id FROM users WHERE email = 'olivia.martinez@example.com'), (SELECT id FROM packages WHERE name = 'Premium Package'), '2025-06-25', '10:00:00', 'completed', 'First lesson. Student is a complete beginner. Covered basic controls and simple driving in quiet areas.', '2025-06-15T11:00:00Z'),
  ((SELECT id FROM users WHERE email = 'ryan.taylor@example.com'), (SELECT id FROM packages WHERE name = 'Starter Package'), '2025-06-30', '13:00:00', 'completed', 'Final lesson before test. Reviewed all test requirements and common mistakes.', '2025-06-20T09:15:00Z');

-- Add some upcoming bookings too
INSERT INTO bookings (user_id, package_id, date, time, status, notes, created_at)
VALUES
  ((SELECT id FROM users WHERE email = 'sarah.johnson@example.com'), (SELECT id FROM packages WHERE name = 'Standard Package'), '2025-08-10', '09:00:00', 'confirmed', 'Test preparation lesson', '2025-07-25T14:20:00Z'),
  ((SELECT id FROM users WHERE email = 'james.wilson@example.com'), (SELECT id FROM packages WHERE name = 'Premium Package'), '2025-08-12', '14:00:00', 'confirmed', 'Final lesson before test', '2025-07-26T09:30:00Z'),
  ((SELECT id FROM users WHERE email = 'emma.thompson@example.com'), (SELECT id FROM packages WHERE name = 'Starter Package'), '2025-08-15', '11:00:00', 'confirmed', 'Highway driving practice', '2025-07-27T16:45:00Z');