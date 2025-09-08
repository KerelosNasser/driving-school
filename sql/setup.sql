-- Main Setup File for Driving School Database
-- Run this file to set up the complete database schema

-- This file imports all the organized SQL files in the correct order

-- 1. Extensions and initial setup
\i 01_extensions.sql

-- 2. Create tables
\i 02_tables.sql

-- 3. Create functions
\i 03_functions.sql

-- 4. Create triggers and indexes
\i 04_triggers_indexes.sql

-- 5. Set up permissions and RLS
\i 05_permissions.sql

-- Setup complete
SELECT 'Database setup completed successfully!' as status;