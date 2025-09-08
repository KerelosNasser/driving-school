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