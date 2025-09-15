-- Enhanced Referral Rewards System Migration
-- This migration extends the existing referral system with comprehensive reward management

-- 1. Reward Tiers Configuration Table
CREATE TABLE IF NOT EXISTS public.reward_tiers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name varchar(100) NOT NULL,
    description text,
    required_referrals integer NOT NULL CHECK (required_referrals > 0),
    reward_type varchar(50) NOT NULL CHECK (reward_type IN ('discount_percentage', 'discount_fixed', 'free_package', 'free_hours', 'custom')),
    reward_value decimal(10,2) NOT NULL,
    reward_metadata jsonb DEFAULT '{}',
    package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    
    UNIQUE(required_referrals, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Index for efficient tier lookups
CREATE INDEX IF NOT EXISTS idx_reward_tiers_active_referrals ON public.reward_tiers(required_referrals, is_active) WHERE is_active = true;

-- 2. User Notifications Table
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type varchar(50) NOT NULL CHECK (type IN ('reward_earned', 'reward_gifted', 'milestone_reached', 'referral_completed', 'system')),
    title varchar(200) NOT NULL,
    message text NOT NULL,
    metadata jsonb DEFAULT '{}',
    is_read boolean DEFAULT false,
    is_dismissed boolean DEFAULT false,
    priority varchar(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    read_at timestamp with time zone,
    dismissed_at timestamp with time zone
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread ON public.user_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON public.user_notifications(type, created_at DESC);

-- 3. Enhanced Referral Rewards Table (extends existing)
-- First, check if we need to add columns to existing referral_rewards table
DO $$
BEGIN
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_rewards' AND column_name = 'tier_id') THEN
        ALTER TABLE public.referral_rewards ADD COLUMN tier_id uuid REFERENCES public.reward_tiers(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_rewards' AND column_name = 'is_gifted') THEN
        ALTER TABLE public.referral_rewards ADD COLUMN is_gifted boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_rewards' AND column_name = 'gifted_by') THEN
        ALTER TABLE public.referral_rewards ADD COLUMN gifted_by uuid REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_rewards' AND column_name = 'gift_reason') THEN
        ALTER TABLE public.referral_rewards ADD COLUMN gift_reason text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_rewards' AND column_name = 'metadata') THEN
        ALTER TABLE public.referral_rewards ADD COLUMN metadata jsonb DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referral_rewards' AND column_name = 'notification_sent') THEN
        ALTER TABLE public.referral_rewards ADD COLUMN notification_sent boolean DEFAULT false;
    END IF;
END
$$;

-- 4. Reward Distribution Audit Log
CREATE TABLE IF NOT EXISTS public.reward_audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reward_id uuid NOT NULL REFERENCES public.referral_rewards(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action varchar(50) NOT NULL CHECK (action IN ('earned', 'gifted', 'used', 'expired', 'revoked')),
    performed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    reason text,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_reward_audit_log_user_action ON public.reward_audit_log(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reward_audit_log_reward ON public.reward_audit_log(reward_id, created_at DESC);

-- 5. Referral Progress Tracking (materialized view for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_referral_progress AS
SELECT 
    u.id as user_id,
    u.clerk_id,
    u.email,
    u.full_name,
    COALESCE(r.total_referrals, 0) as total_referrals,
    COALESCE(r.completed_referrals, 0) as completed_referrals,
    COALESCE(rw.total_rewards, 0) as total_rewards,
    COALESCE(rw.unused_rewards, 0) as unused_rewards,
    COALESCE(rw.total_reward_value, 0) as total_reward_value,
    rt.next_tier_referrals,
    rt.next_tier_reward_type,
    rt.next_tier_reward_value,
    ic.code as invitation_code,
    ic.current_uses as code_uses
FROM public.users u
LEFT JOIN (
    SELECT 
        referrer_user_id,
        COUNT(*) as total_referrals,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_referrals
    FROM public.referrals 
    GROUP BY referrer_user_id
) r ON u.id = r.referrer_user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_rewards,
        COUNT(CASE WHEN is_used = false THEN 1 END) as unused_rewards,
        SUM(reward_value) as total_reward_value
    FROM public.referral_rewards 
    GROUP BY user_id
) rw ON u.id = rw.user_id
LEFT JOIN (
    SELECT DISTINCT ON (rt.required_referrals)
        rt.required_referrals as next_tier_referrals,
        rt.reward_type as next_tier_reward_type,
        rt.reward_value as next_tier_reward_value
    FROM public.reward_tiers rt
    WHERE rt.is_active = true
    ORDER BY rt.required_referrals ASC
) rt ON rt.next_tier_referrals > COALESCE(r.completed_referrals, 0)
LEFT JOIN public.invitation_codes ic ON u.id = ic.user_id AND ic.is_active = true;

-- Index for the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_referral_progress_user_id ON public.user_referral_progress(user_id);

-- 6. Functions for reward management

-- Function to refresh referral progress
CREATE OR REPLACE FUNCTION public.refresh_referral_progress()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_referral_progress;
END;
$$;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id uuid,
    p_type varchar(50),
    p_title varchar(200),
    p_message text,
    p_metadata jsonb DEFAULT '{}',
    p_priority varchar(20) DEFAULT 'medium',
    p_expires_at timestamp with time zone DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id uuid;
BEGIN
    INSERT INTO public.user_notifications (
        user_id, type, title, message, metadata, priority, expires_at
    ) VALUES (
        p_user_id, p_type, p_title, p_message, p_metadata, p_priority, p_expires_at
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- Function to gift reward to user
CREATE OR REPLACE FUNCTION public.gift_reward_to_user(
    p_user_id uuid,
    p_reward_type varchar(50),
    p_reward_value decimal(10,2),
    p_gifted_by uuid,
    p_reason text DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reward_id uuid;
    v_notification_id uuid;
BEGIN
    -- Create the gifted reward
    INSERT INTO public.referral_rewards (
        user_id, reward_type, reward_value, is_gifted, gifted_by, gift_reason, metadata
    ) VALUES (
        p_user_id, p_reward_type, p_reward_value, true, p_gifted_by, p_reason, p_metadata
    ) RETURNING id INTO v_reward_id;
    
    -- Create audit log entry
    INSERT INTO public.reward_audit_log (
        reward_id, user_id, action, performed_by, reason, metadata
    ) VALUES (
        v_reward_id, p_user_id, 'gifted', p_gifted_by, p_reason, p_metadata
    );
    
    -- Create notification for user
    SELECT public.create_notification(
        p_user_id,
        'reward_gifted',
        'You received a reward!',
        CASE 
            WHEN p_reward_type = 'discount_30_percent' THEN 'You received a 30% discount reward from admin!'
            WHEN p_reward_type = 'free_hours_2' THEN 'You received 2 free hours from admin!'
            ELSE 'You received a special reward from admin!'
        END,
        jsonb_build_object('reward_id', v_reward_id, 'reward_type', p_reward_type, 'reward_value', p_reward_value),
        'high'
    ) INTO v_notification_id;
    
    -- Mark notification as sent
    UPDATE public.referral_rewards 
    SET notification_sent = true 
    WHERE id = v_reward_id;
    
    -- Refresh progress view
    PERFORM public.refresh_referral_progress();
    
    RETURN v_reward_id;
END;
$$;

-- Enhanced process_referral function with tier-based rewards
CREATE OR REPLACE FUNCTION public.process_referral_with_tiers(
    p_invitation_code text,
    p_referred_user_id uuid,
    p_device_fingerprint text DEFAULT NULL,
    p_ip_address inet DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_referral_id uuid;
    v_referrer_user_id uuid;
    v_invitation_code_id uuid;
    v_referral_count integer;
    v_tier record;
    v_reward_id uuid;
    v_notification_id uuid;
    v_result jsonb;
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
    
    -- Check for applicable reward tier
    SELECT * INTO v_tier
    FROM reward_tiers
    WHERE required_referrals = v_referral_count 
      AND is_active = true
    ORDER BY required_referrals DESC
    LIMIT 1;
    
    -- Create reward if tier found
    IF v_tier.id IS NOT NULL THEN
        INSERT INTO referral_rewards (
            user_id, referral_id, tier_id, reward_type, reward_value, metadata
        ) VALUES (
            v_referrer_user_id, v_referral_id, v_tier.id, v_tier.reward_type, v_tier.reward_value, v_tier.reward_metadata
        ) RETURNING id INTO v_reward_id;
        
        -- Create audit log
        INSERT INTO reward_audit_log (
            reward_id, user_id, action, reason, metadata
        ) VALUES (
            v_reward_id, v_referrer_user_id, 'earned', 
            'Earned reward for reaching ' || v_referral_count || ' referrals',
            jsonb_build_object('referral_count', v_referral_count, 'tier_id', v_tier.id)
        );
        
        -- Create notification
        SELECT public.create_notification(
            v_referrer_user_id,
            'reward_earned',
            'Congratulations! You earned a reward!',
            'You reached ' || v_referral_count || ' referrals and earned: ' || v_tier.name,
            jsonb_build_object('reward_id', v_reward_id, 'tier_id', v_tier.id, 'referral_count', v_referral_count),
            'high'
        ) INTO v_notification_id;
        
        -- Mark notification as sent
        UPDATE referral_rewards 
        SET notification_sent = true 
        WHERE id = v_reward_id;
        
        -- Handle specific reward types
        IF v_tier.reward_type = 'free_hours' THEN
            PERFORM update_user_quota(
                v_referrer_user_id,
                v_tier.reward_value,
                'free_credit',
                'Referral reward: ' || v_tier.name,
                NULL, NULL, NULL, NULL,
                jsonb_build_object('referral_id', v_referral_id, 'reward_id', v_reward_id, 'tier_id', v_tier.id)
            );
        END IF;
    END IF;
    
    -- Refresh progress view
    PERFORM public.refresh_referral_progress();
    
    -- Build result
    v_result := jsonb_build_object(
        'referral_id', v_referral_id,
        'referral_count', v_referral_count,
        'reward_earned', v_tier.id IS NOT NULL,
        'reward_id', v_reward_id,
        'tier_name', v_tier.name,
        'notification_id', v_notification_id
    );
    
    RETURN v_result;
END;
$$;

-- 7. Triggers for updated_at timestamps
CREATE TRIGGER set_updated_at_reward_tiers
    BEFORE UPDATE ON public.reward_tiers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 8. Insert default reward tiers
INSERT INTO public.reward_tiers (name, description, required_referrals, reward_type, reward_value, is_active) VALUES
('First Referral Bonus', '30% discount on your next booking', 1, 'discount_percentage', 30.00, true),
('Triple Referral Reward', '2 free driving lesson hours', 3, 'free_hours', 2.00, true),
('Referral Champion', '50% discount on any package', 5, 'discount_percentage', 50.00, true),
('Referral Master', '4 free driving lesson hours', 10, 'free_hours', 4.00, true)
ON CONFLICT (required_referrals, is_active) DO NOTHING;

-- 9. Create initial materialized view data
SELECT public.refresh_referral_progress();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.reward_tiers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.reward_audit_log TO authenticated;
GRANT SELECT ON public.user_referral_progress TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.gift_reward_to_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_referral_with_tiers TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_referral_progress TO authenticated;