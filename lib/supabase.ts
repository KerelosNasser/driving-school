import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// Types for our database tables
export type User = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
  clerk_id: string;
};

export type Package = {
  id: string;
  name: string;
  description: string;
  price: number;
  hours: number;
  features: string[];
  popular: boolean;
  created_at: string;
};

export type Booking = {
  id: string;
  user_id: string;
  package_id: string | null;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_id: string | null;
  notes: string | null;
  created_at: string;
  google_calendar_event_id: string | null;
};

export type Review = {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  approved: boolean;
  user_name: string;
};

// Create a Supabase client for client-side usage
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// SQL for creating tables in Supabase
export const databaseSchema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  clerk_id TEXT UNIQUE NOT NULL
);

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  hours INTEGER NOT NULL,
  features JSONB NOT NULL,
  popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  google_calendar_event_id TEXT
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved BOOLEAN DEFAULT FALSE,
  user_name TEXT NOT NULL
);

-- Initial packages data
INSERT INTO packages (name, description, price, hours, features, popular)
VALUES 
  ('Starter Package', 'Perfect for beginners who are just starting their driving journey', 299.99, 5, '["5 hours of driving lessons", "Personalized instruction", "Flexible scheduling"]', FALSE),
  ('Standard Package', 'Our most popular package for learners with some experience', 499.99, 10, '["10 hours of driving lessons", "Personalized instruction", "Flexible scheduling", "Test preparation"]', TRUE),
  ('Premium Package', 'Comprehensive package for complete preparation', 799.99, 20, '["20 hours of driving lessons", "Personalized instruction", "Flexible scheduling", "Test preparation", "Mock driving test", "Pick-up and drop-off service"]', FALSE);
`;