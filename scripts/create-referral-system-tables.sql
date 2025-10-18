-- Create unified referral system tables
-- This script ensures all necessary tables exist for the connected referral system

-- Create referrals table (main referral tracking)
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitation_code TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(referrer_user_id, referred_user_id)
);

-- Create reward_tiers table (admin-managed reward tiers)
CREATE TABLE IF NOT EXISTS reward_tiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    required_referrals INTEGER NOT NULL DEFAULT 1,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('discount', 'free_package')),
    reward_value DECIMAL NOT NULL,
    package_id UUID REFERENCES packages(id),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(required_referrals) -- Only one active tier per referral count
);

-- Create referral_rewards table (unified rewards storage)
CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('discount', 'free_package')),
    reward_value DECIMAL NOT NULL,
    package_id UUID REFERENCES packages(id),
    tier_id UUID REFERENCES reward_tiers(id),
    source TEXT DEFAULT 'referral' CHECK (source IN ('referral', 'admin_gift')),
    gifted_by UUID REFERENCES users(id),
    reason TEXT,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create user_referral_progress table (materialized view of user progress)
CREATE TABLE IF NOT EXISTS user_referral_progress (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    completed_referrals INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user_id ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at);

CREATE INDEX IF NOT EXISTS idx_reward_tiers_required_referrals ON reward_tiers(required_referrals);
CREATE INDEX IF NOT EXISTS idx_reward_tiers_is_active ON reward_tiers(is_active);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_is_used ON referral_rewards(is_used);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_source ON referral_rewards(source);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_earned_at ON referral_rewards(earned_at);

-- Create function to update user referral progress
CREATE OR REPLACE FUNCTION update_user_referral_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update referrer's progress
    INSERT INTO user_referral_progress (user_id, completed_referrals, last_updated)
    VALUES (NEW.referrer_user_id,
            (SELECT COUNT(*) FROM referrals WHERE referrer_user_id = NEW.referrer_user_id AND status = 'completed'),
            NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
        completed_referrals = (SELECT COUNT(*) FROM referrals WHERE referrer_user_id = NEW.referrer_user_id AND status = 'completed'),
        last_updated = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update referral progress
DROP TRIGGER IF EXISTS trigger_update_referral_progress ON referrals;
CREATE TRIGGER trigger_update_referral_progress
    AFTER INSERT OR UPDATE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_user_referral_progress();

-- Create function to gift rewards to users (for admin panel)
CREATE OR REPLACE FUNCTION gift_reward_to_user(
    p_user_id UUID,
    p_reward_type TEXT,
    p_reward_value DECIMAL,
    p_gifted_by UUID,
    p_reason TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    reward_id UUID;
BEGIN
    INSERT INTO referral_rewards (
        user_id,
        reward_type,
        reward_value,
        source,
        gifted_by,
        reason,
        metadata
    ) VALUES (
        p_user_id,
        p_reward_type,
        p_reward_value,
        'admin_gift',
        p_gifted_by,
        p_reason,
        p_metadata
    ) RETURNING id INTO reward_id;

    RETURN reward_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get referral system statistics
CREATE OR REPLACE FUNCTION get_referral_system_stats()
RETURNS TABLE (
    total_users BIGINT,
    total_referrals BIGINT,
    total_rewards BIGINT,
    active_reward_tiers BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM referrals) as total_referrals,
        (SELECT COUNT(*) FROM referral_rewards) as total_rewards,
        (SELECT COUNT(*) FROM reward_tiers WHERE is_active = true) as active_reward_tiers;
END;
$$ LANGUAGE plpgsql;

-- Insert default reward tiers if they don't exist
INSERT INTO reward_tiers (name, required_referrals, reward_type, reward_value, description)
VALUES
    ('First Referral', 1, 'discount', 30, '30% discount for first successful referral'),
    ('Three Referrals', 3, 'free_package', 2, '2 free hours for three successful referrals')
ON CONFLICT (required_referrals) DO NOTHING;

-- Create view for admin dashboard (combines user and referral data)
CREATE OR REPLACE VIEW admin_referral_overview AS
SELECT
    u.id as user_id,
    u.email,
    u.full_name,
    COALESCE(urp.completed_referrals, 0) as completed_referrals,
    COALESCE(urp.last_updated, u.created_at) as last_referral_date,
    COUNT(r.id) as total_referrals_made,
    COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as successful_referrals,
    COUNT(rewards.id) as total_rewards_earned,
    COUNT(CASE WHEN rewards.is_used THEN 1 END) as rewards_used
FROM users u
LEFT JOIN user_referral_progress urp ON u.id = urp.user_id
LEFT JOIN referrals r ON u.id = r.referrer_user_id
LEFT JOIN referral_rewards rewards ON u.id = rewards.user_id
GROUP BY u.id, u.email, u.full_name, urp.completed_referrals, urp.last_updated, u.created_at;

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE reward_tiers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (uncomment if RLS is enabled)
-- Users can only see their own referrals and rewards
-- CREATE POLICY "Users can view own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);
-- CREATE POLICY "Users can view own rewards" ON referral_rewards FOR SELECT USING (auth.uid() = user_id);

-- Admins can see all data (you'll need to implement admin role checking)
-- CREATE POLICY "Admins can view all referrals" ON referrals FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
-- CREATE POLICY "Admins can view all rewards" ON referral_rewards FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

COMMENT ON TABLE referrals IS 'Tracks all referral relationships between users';
COMMENT ON TABLE reward_tiers IS 'Defines reward tiers that users can unlock through referrals';
COMMENT ON TABLE referral_rewards IS 'Stores all rewards earned by users through referrals or admin gifts';
COMMENT ON TABLE user_referral_progress IS 'Materialized view of user referral counts for performance';
