-- Driving School Database Setup
-- Generated SQL Script

-- Create Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Schemas
CREATE SCHEMA IF NOT EXISTS driving_school;

-- Enum Types
CREATE TYPE driving_school.student_status AS ENUM (
    'enrolled',
    'in_training',
    'completed',
    'dropped'
);

CREATE TYPE driving_school.course_type AS ENUM (
    'beginner',
    'intermediate',
    'advanced',
    'refresher'
);

-- Instructors Table
CREATE TABLE driving_school.instructors (
                                            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                            first_name TEXT NOT NULL,
                                            last_name TEXT NOT NULL,
                                            email TEXT UNIQUE NOT NULL,
                                            phone TEXT,
                                            license_number TEXT UNIQUE NOT NULL,
                                            hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
                                            specialization TEXT,
                                            is_active BOOLEAN DEFAULT TRUE
);

-- Students Table
CREATE TABLE driving_school.students (
                                         id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                         first_name TEXT NOT NULL,
                                         last_name TEXT NOT NULL,
                                         email TEXT UNIQUE NOT NULL,
                                         phone TEXT,
                                         date_of_birth DATE NOT NULL,
                                         address TEXT,
                                         status driving_school.student_status DEFAULT 'enrolled',
                                         enrolled_date DATE NOT NULL DEFAULT CURRENT_DATE,
                                         emergency_contact_name TEXT,
                                         emergency_contact_phone TEXT
);

-- Courses Table
CREATE TABLE driving_school.courses (
                                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                        name TEXT NOT NULL,
                                        description TEXT,
                                        course_type driving_school.course_type NOT NULL,
                                        duration_hours NUMERIC(5,2) NOT NULL,
                                        price NUMERIC(10,2) NOT NULL,
                                        max_students INTEGER NOT NULL
);

-- Enrollments Table
CREATE TABLE driving_school.enrollments (
                                            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                            student_id UUID NOT NULL REFERENCES driving_school.students(id),
                                            course_id UUID NOT NULL REFERENCES driving_school.courses(id),
                                            instructor_id UUID REFERENCES driving_school.instructors(id),
                                            enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
                                            start_date DATE,
                                            end_date DATE,
                                            final_grade NUMERIC(5,2),
                                            status TEXT DEFAULT 'active'
);

-- Vehicles Table
CREATE TABLE driving_school.vehicles (
                                         id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                         make TEXT NOT NULL,
                                         model TEXT NOT NULL,
                                         year INTEGER NOT NULL,
                                         license_plate TEXT UNIQUE NOT NULL,
                                         vin_number TEXT UNIQUE NOT NULL,
                                         transmission_type TEXT NOT NULL,
                                         is_available BOOLEAN DEFAULT TRUE
);

-- Lesson Schedules Table
CREATE TABLE driving_school.lesson_schedules (
                                                 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                                 enrollment_id UUID NOT NULL REFERENCES driving_school.enrollments(id),
                                                 vehicle_id UUID REFERENCES driving_school.vehicles(id),
                                                 lesson_date DATE NOT NULL,
                                                 start_time TIME NOT NULL,
                                                 end_time TIME NOT NULL,
                                                 location TEXT,
                                                 notes TEXT
);

-- Payments Table
CREATE TABLE driving_school.payments (
                                         id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                         enrollment_id UUID NOT NULL REFERENCES driving_school.enrollments(id),
                                         amount NUMERIC(10,2) NOT NULL,
                                         payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
                                         payment_method TEXT NOT NULL,
                                         receipt_number TEXT UNIQUE
);

-- Enable Row Level Security
ALTER TABLE driving_school.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE driving_school.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE driving_school.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE driving_school.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE driving_school.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driving_school.lesson_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE driving_school.payments ENABLE ROW LEVEL SECURITY;

-- Sample Data Insertion
-- Note: Replace with your actual data or remove if not needed

-- Sample Instructors
INSERT INTO driving_school.instructors
(first_name, last_name, email, phone, license_number, specialization)
VALUES
    ('John', 'Doe', 'john.doe@drivingschool.com', '555-1234', 'INS001', 'Manual Transmission'),
    ('Jane', 'Smith', 'jane.smith@drivingschool.com', '555-5678', 'INS002', 'Automatic Transmission');

-- Sample Courses
INSERT INTO driving_school.courses
(name, description, course_type, duration_hours, price, max_students)
VALUES
    ('Beginner Driving', 'Introduction to driving basics', 'beginner', 20.5, 499.99, 10),
    ('Advanced Defensive Driving', 'Advanced techniques for safe driving', 'advanced', 15.0, 299.99, 8);

-- Add more sample data as needed

-- Optional: Create indexes for performance
CREATE INDEX idx_students_email ON driving_school.students(email);
CREATE INDEX idx_instructors_email ON driving_school.instructors(email);
CREATE INDEX idx_enrollments_student ON driving_school.enrollments(student_id);
CREATE INDEX idx_lesson_schedules_enrollment ON driving_school.lesson_schedules(enrollment_id);

-- Completed Database Setup