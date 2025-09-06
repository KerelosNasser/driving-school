-- Invitation and Referral System Database Schema
-- Extends the existing schema with invitation codes and referral tracking

-- Invitation Codes Table
CREATE TABLE IF NOT EXISTS invitation_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    max_uses INTEGER DEFAULT NULL, -- NULL means unlimited
    current_uses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    
    -- Ensure one active invitation code per user
    CONSTRAINT unique_active_user_invitation UNIQUE (user_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Referrals Table - Track successful referrals
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitation_code_id UUID NOT NULL REFERENCES invitation_codes(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    reward_tier INTEGER DEFAULT 0, -- 0=no reward, 1=30% discount, 3=2 free hours
    reward_applied BOOLEAN DEFAULT FALSE,
    device_fingerprint TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    
    -- Prevent self-referrals
    CONSTRAINT no_self_referral CHECK (referrer_user_id != referred_user_id),
    -- Ensure unique referral per user
    CONSTRAINT unique_referral UNIQUE (referred_user_id)
);

-- Device Fingerprints Table - Prevent multiple accounts from same device
CREATE TABLE IF NOT EXISTS device_fingerprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fingerprint_hash TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    screen_resolution TEXT,
    timezone TEXT,
    language TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for fast lookups
    CONSTRAINT unique_user_fingerprint UNIQUE (user_id, fingerprint_hash)
);

-- Referral Rewards Table - Track reward history
CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('discount_30_percent', 'free_hours_2')),
    reward_value DECIMAL(10,2), -- Discount amount or hours
    applied_to_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    applied_to_transaction_id UUID REFERENCES quota_transactions(id) ON DELETE SET NULL,
    is_used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Add invitation code to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS invitation_code TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS completed_onboarding BOOLEAN DEFAULT FALSE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_user_id ON invitation_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_device_fingerprints_hash ON device_fingerprints(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_unused ON referral_rewards(user_id, is_used) WHERE is_used = FALSE;

-- Function to generate unique invitation code
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM invitation_codes WHERE invitation_codes.code = code) INTO exists;
        
        -- If code doesn't exist, return it
        IF NOT exists THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create invitation code for user
CREATE OR REPLACE FUNCTION create_user_invitation_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
BEGIN
    -- Deactivate existing codes
    UPDATE invitation_codes 
    SET is_active = FALSE 
    WHERE user_id = p_user_id AND is_active = TRUE;
    
    -- Generate new code
    v_code := generate_invitation_code();
    
    -- Insert new invitation code
    INSERT INTO invitation_codes (user_id, code, is_active)
    VALUES (p_user_id, v_code, TRUE);
    
    -- Update user's invitation code
    UPDATE users SET invitation_code = v_code WHERE id = p_user_id;
    
    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Function to process referral and calculate rewards
CREATE OR REPLACE FUNCTION process_referral(
    p_referred_user_id UUID,
    p_invitation_code TEXT,
    p_device_fingerprint TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_referral_id UUID;
    v_referrer_user_id UUID;
    v_invitation_code_id UUID;
    v_referral_count INTEGER;
    v_reward_type TEXT;
    v_reward_value DECIMAL(10,2);
BEGIN
    -- Find the invitation code and referrer
    SELECT ic.id, ic.user_id INTO v_invitation_code_id, v_referrer_user_id
    FROM invitation_codes ic
    WHERE ic.code = p_invitation_code 
      AND ic.is_active = TRUE
      AND (ic.expires_at IS NULL OR ic.expires_at > NOW())
      AND (ic.max_uses IS NULL OR ic.current_uses < ic.max_uses);
    
    IF v_referrer_user_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invitation code';
    END IF;
    
    -- Prevent self-referral
    IF v_referrer_user_id = p_referred_user_id THEN
        RAISE EXCEPTION 'Cannot use your own invitation code';
    END IF;
    
    -- Create referral record
    INSERT INTO referrals (
        referrer_user_id, referred_user_id, invitation_code_id,
        device_fingerprint, ip_address, status
    ) VALUES (
        v_referrer_user_id, p_referred_user_id, v_invitation_code_id,
        p_device_fingerprint, p_ip_address, 'completed'
    ) RETURNING id INTO v_referral_id;
    
    -- Update invitation code usage
    UPDATE invitation_codes 
    SET current_uses = current_uses + 1
    WHERE id = v_invitation_code_id;
    
    -- Count total successful referrals for referrer
    SELECT COUNT(*) INTO v_referral_count
    FROM referrals
    WHERE referrer_user_id = v_referrer_user_id AND status = 'completed';
    
    -- Determine reward based on referral count
    IF v_referral_count = 1 THEN
        v_reward_type := 'discount_30_percent';
        v_reward_value := 30.00;
    ELSIF v_referral_count >= 3 THEN
        v_reward_type := 'free_hours_2';
        v_reward_value := 2.00;
    END IF;
    
    -- Create reward if applicable
    IF v_reward_type IS NOT NULL THEN
        INSERT INTO referral_rewards (
            user_id, referral_id, reward_type, reward_value
        ) VALUES (
            v_referrer_user_id, v_referral_id, v_reward_type, v_reward_value
        );
        
        -- If it's free hours, add to quota
        IF v_reward_type = 'free_hours_2' THEN
            PERFORM update_user_quota(
                v_referrer_user_id,
                v_reward_value,
                'free_credit',
                'Referral reward: 2 free hours for 3+ successful referrals',
                NULL, NULL, NULL, NULL,
                jsonb_build_object('referral_id', v_referral_id, 'reward_type', v_reward_type)
            );
        END IF;
    END IF;
    
    RETURN v_referral_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own invitation codes
CREATE POLICY "Users can view own invitation codes" ON invitation_codes
    FOR SELECT USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

-- Users can view their referrals (both as referrer and referred)
CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (
        auth.uid()::text = (SELECT clerk_id FROM users WHERE id = referrer_user_id) OR
        auth.uid()::text = (SELECT clerk_id FROM users WHERE id = referred_user_id)
    );

-- Users can view their own device fingerprints
CREATE POLICY "Users can view own device fingerprints" ON device_fingerprints
    FOR SELECT USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

-- Users can view their own rewards
CREATE POLICY "Users can view own rewards" ON referral_rewards
    FOR SELECT USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

-- Admin policies
CREATE POLICY "Admins can manage invitation codes" ON invitation_codes
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage referrals" ON referrals
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage device fingerprints" ON device_fingerprints
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage rewards" ON referral_rewards
    FOR ALL USING (auth.role() = 'authenticated');

-- Success message
SELECT 'Invitation and Referral system schema created successfully! 🎉' as message,
       'Tables: invitation_codes, referrals, device_fingerprints, referral_rewards' as tables,
       'Functions: generate_invitation_code(), create_user_invitation_code(), process_referral()' as functions,
       'RLS policies enabled for data security' as security;