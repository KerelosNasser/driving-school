

-- Core Tables for Driving School Application

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    clerk_id text UNIQUE,
    full_name text,
    phone text,
    address text,
    suburb text,
    experience_level text,
    goals text,
    emergency_contact text,
    emergency_phone text,
    invitation_code text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Invitation codes table
CREATE TABLE IF NOT EXISTS public.invitation_codes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    code text UNIQUE NOT NULL,
    is_active boolean DEFAULT true,
    current_uses integer DEFAULT 0,
    max_uses integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User quotas table
CREATE TABLE IF NOT EXISTS public.user_quotas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    total_hours numeric DEFAULT 0,
    used_hours numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    invitation_code text,
    status text DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Referral rewards table
CREATE TABLE IF NOT EXISTS public.referral_rewards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    referral_id uuid REFERENCES public.referrals(id) ON DELETE CASCADE,
    reward_type text NOT NULL,
    reward_value numeric,
    is_used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    used_at timestamp with time zone
);

-- Table for storing manual payment sessions (Tyro, BPAY, PayID)
CREATE TABLE IF NOT EXISTS manual_payment_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'AUD',
    gateway TEXT NOT NULL, -- 'tyro', 'bpay', 'payid'
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'cancelled', 'expired'
    payment_reference TEXT,
    metadata JSONB,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for manual payment sessions
CREATE INDEX IF NOT EXISTS idx_manual_payment_sessions_user_id ON manual_payment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_payment_sessions_session_id ON manual_payment_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_manual_payment_sessions_status ON manual_payment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_manual_payment_sessions_expires_at ON manual_payment_sessions(expires_at);

-- RLS enabled tables with proper policies
-- These tables have Row Level Security enabled and require specific policies

-- User quota tracking
CREATE TABLE IF NOT EXISTS user_quota (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_hours DECIMAL(5,2) DEFAULT 0.00,
    used_hours DECIMAL(5,2) DEFAULT 0.00,
    remaining_hours DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user_quota
CREATE INDEX IF NOT EXISTS idx_user_quota_user_id ON user_quota(user_id);

-- Packages table for driving lesson packages
CREATE TABLE IF NOT EXISTS packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    hours DECIMAL(5,2) NOT NULL,
    features TEXT[],
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for packages
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(active);
CREATE INDEX IF NOT EXISTS idx_packages_sort_order ON packages(sort_order);

-- User bookings table
CREATE TABLE IF NOT EXISTS user_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled, noshow
    location TEXT,
    notes TEXT,
    google_event_id TEXT,
    completed BOOLEAN DEFAULT false,
    rating INTEGER,
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_bookings
CREATE INDEX IF NOT EXISTS idx_user_bookings_user_id ON user_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookings_start_time ON user_bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_user_bookings_status ON user_bookings(status);

-- Payment attempts tracking
CREATE TABLE IF NOT EXISTS payment_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES packages(id),
    session_id TEXT,
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'AUD',
    status TEXT, -- initiated, success, failed
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for payment_attempts
CREATE INDEX IF NOT EXISTS idx_payment_attempts_user_id ON payment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_session_id ON payment_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON payment_attempts(status);

-- Promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL, -- percentage or fixed
    discount_value DECIMAL(10,2) NOT NULL,
    active BOOLEAN DEFAULT true,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for promo_codes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(active);
CREATE INDEX IF NOT EXISTS idx_promo_codes_expires_at ON promo_codes(expires_at);

-- User reviews table
CREATE TABLE IF NOT EXISTS user_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES user_bookings(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_reviews
CREATE INDEX IF NOT EXISTS idx_user_reviews_user_id ON user_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_booking_id ON user_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_status ON user_reviews(status);

-- Service areas table
CREATE TABLE IF NOT EXISTS service_areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    coordinates JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for service_areas
CREATE INDEX IF NOT EXISTS idx_service_areas_active ON service_areas(active);

-- User invitations table
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    invitee_email TEXT NOT NULL,
    invitee_name TEXT,
    status TEXT DEFAULT 'pending', -- pending, accepted, expired
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for user_invitations
CREATE INDEX IF NOT EXISTS idx_user_invitations_inviter_id ON user_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_invitee_email ON user_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at columns
CREATE TRIGGER update_user_quota_updated_at 
    BEFORE UPDATE ON user_quota 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at 
    BEFORE UPDATE ON packages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_bookings_updated_at 
    BEFORE UPDATE ON user_bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promo_codes_updated_at 
    BEFORE UPDATE ON promo_codes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_reviews_updated_at 
    BEFORE UPDATE ON user_reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_areas_updated_at 
    BEFORE UPDATE ON service_areas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
