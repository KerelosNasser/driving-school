-- Migration: Seed packages data
-- This migration ensures that the packages table has the required data

-- Insert default packages if they don't exist
INSERT INTO packages (id, name, description, price, hours, features, active, sort_order)
SELECT 
    '11111111-1111-1111-1111-111111111111',
    'Starter Package',
    'Perfect for beginners who are just starting their driving journey',
    299.99,
    5,
    ARRAY['5 hours of driving lessons', 'Personalized instruction', 'Flexible scheduling'],
    true,
    1
WHERE NOT EXISTS (
    SELECT 1 FROM packages WHERE name = 'Starter Package'
);

INSERT INTO packages (id, name, description, price, hours, features, active, sort_order)
SELECT 
    '22222222-2222-2222-2222-222222222222',
    'Standard Package',
    'Our most popular package for learners with some experience',
    499.99,
    10,
    ARRAY['10 hours of driving lessons', 'Personalized instruction', 'Flexible scheduling', 'Test preparation'],
    true,
    2
WHERE NOT EXISTS (
    SELECT 1 FROM packages WHERE name = 'Standard Package'
);

INSERT INTO packages (id, name, description, price, hours, features, active, sort_order)
SELECT 
    '33333333-3333-3333-3333-333333333333',
    'Premium Package',
    'Comprehensive package for complete preparation',
    799.99,
    20,
    ARRAY['20 hours of driving lessons', 'Personalized instruction', 'Flexible scheduling', 'Test preparation', 'Mock driving test', 'Pick-up and drop-off service'],
    true,
    3
WHERE NOT EXISTS (
    SELECT 1 FROM packages WHERE name = 'Premium Package'
);

-- Ensure at least one package is marked as popular
UPDATE packages 
SET popular = true 
WHERE name = 'Standard Package' 
AND (popular IS NULL OR popular = false);