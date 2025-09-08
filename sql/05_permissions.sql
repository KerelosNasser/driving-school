-- Row Level Security and Permissions

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage users" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

-- Invitation codes policies
CREATE POLICY "Users can view own invitation codes" ON public.invitation_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invitation codes" ON public.invitation_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage invitation codes" ON public.invitation_codes
    FOR ALL USING (auth.role() = 'service_role');

-- User quotas policies
CREATE POLICY "Users can view own quotas" ON public.user_quotas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage quotas" ON public.user_quotas
    FOR ALL USING (auth.role() = 'service_role');

-- Referrals policies
CREATE POLICY "Users can view referrals they made or received" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Service role can manage referrals" ON public.referrals
    FOR ALL USING (auth.role() = 'service_role');

-- Referral rewards policies
CREATE POLICY "Users can view own rewards" ON public.referral_rewards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage rewards" ON public.referral_rewards
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.invitation_codes TO authenticated;
GRANT SELECT ON public.user_quotas TO authenticated;
GRANT SELECT ON public.referrals TO authenticated;
GRANT SELECT ON public.referral_rewards TO authenticated;

-- Grant permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;