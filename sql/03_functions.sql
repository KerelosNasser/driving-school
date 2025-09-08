-- Database Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the updated_at column exists in the NEW record
    IF to_jsonb(NEW) ? 'updated_at' THEN
        NEW.updated_at = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create user invitation code
-- First drop the existing function if it exists
DROP FUNCTION IF EXISTS public.create_user_invitation_code(uuid);

CREATE FUNCTION public.create_user_invitation_code(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_code text;
BEGIN
    -- Generate a simple invitation code
    invitation_code := 'DRV' || upper(substring(md5(random()::text) from 1 for 5));
    
    -- Insert into invitation_codes table
    INSERT INTO public.invitation_codes (user_id, code, is_active, current_uses, max_uses)
    VALUES (p_user_id, invitation_code, true, 0, null);
    
    RETURN invitation_code;
EXCEPTION
    WHEN OTHERS THEN
        -- Return a fallback code if insertion fails
        RETURN 'DRV' || upper(substring(md5(random()::text) from 1 for 5));
END;
$$;

-- Function to process referral
-- First drop the existing function if it exists
DROP FUNCTION IF EXISTS public.process_referral(text, uuid);

CREATE FUNCTION public.process_referral(
    p_referrer_code text,
    p_referred_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    referrer_user_id uuid;
    referral_id uuid;
BEGIN
    -- Find the referrer by invitation code
    SELECT user_id INTO referrer_user_id
    FROM public.invitation_codes
    WHERE code = p_referrer_code AND is_active = true;
    
    IF referrer_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Create referral record
    INSERT INTO public.referrals (referrer_id, referred_id, invitation_code, status)
    VALUES (referrer_user_id, p_referred_user_id, p_referrer_code, 'completed')
    RETURNING id INTO referral_id;
    
    -- Update invitation code usage
    UPDATE public.invitation_codes
    SET current_uses = current_uses + 1,
        updated_at = timezone('utc'::text, now())
    WHERE code = p_referrer_code;
    
    -- Create rewards based on referral count
    -- This would be expanded based on business logic
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;