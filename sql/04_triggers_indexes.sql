-- Triggers and Indexes

-- Triggers for updated_at timestamps
-- First drop existing triggers if they exist
DROP TRIGGER IF EXISTS handle_updated_at_users ON public.users;
DROP TRIGGER IF EXISTS handle_updated_at_invitation_codes ON public.invitation_codes;
DROP TRIGGER IF EXISTS handle_updated_at_user_quotas ON public.user_quotas;
DROP TRIGGER IF EXISTS handle_updated_at_referrals ON public.referrals;

-- Create triggers for both INSERT and UPDATE operations
CREATE TRIGGER handle_updated_at_users
    BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_invitation_codes
    BEFORE INSERT OR UPDATE ON public.invitation_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_quotas
    BEFORE INSERT OR UPDATE ON public.user_quotas
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_referrals
    BEFORE INSERT OR UPDATE ON public.referrals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON public.users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON public.invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_user_id ON public.invitation_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_active ON public.invitation_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON public.referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_used ON public.referral_rewards(is_used);