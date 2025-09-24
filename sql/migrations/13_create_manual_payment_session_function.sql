-- Migration: Create atomic function for manual payment session creation
-- This migration creates a SECURITY DEFINER function that atomically upserts users 
-- and creates manual payment sessions, preventing foreign key constraint violations.

-- Create SECURITY DEFINER function to atomically upsert user and create session
CREATE OR REPLACE FUNCTION public.create_manual_payment_session(
  p_clerk_id text,
  p_email text,
  p_full_name text,
  p_session_id text,
  p_package_id uuid,
  p_amount numeric,
  p_currency text DEFAULT 'AUD',
  p_gateway text,
  p_expires_at timestamptz,
  p_metadata jsonb DEFAULT '{}'::jsonb
) 
RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE 
  v_user_id uuid; 
  v_session_id uuid;
BEGIN 
  -- Upsert user by clerk_id or email
  INSERT INTO public.users (id, clerk_id, email, full_name, created_at, updated_at)
  VALUES (gen_random_uuid(), p_clerk_id, p_email, p_full_name, now(), now())
  ON CONFLICT (clerk_id) 
  DO UPDATE SET 
    email = COALESCE(NULLIF(EXCLUDED.email,''), public.users.email),
    full_name = COALESCE(NULLIF(EXCLUDED.full_name,''), public.users.full_name),
    updated_at = now()
  RETURNING id INTO v_user_id;
  
  IF v_user_id IS NULL THEN 
    -- fallback: try matching by email
    SELECT id INTO v_user_id FROM public.users WHERE email = p_email LIMIT 1; 
  END IF;

  IF v_user_id IS NULL THEN 
    RAISE EXCEPTION 'Failed to resolve user id for clerk_id=% and email=%', p_clerk_id, p_email; 
  END IF;

  -- Insert manual payment session (idempotent on session_id)
  INSERT INTO public.manual_payment_sessions (
    session_id, user_id, package_id, amount, currency, gateway, status, metadata, expires_at, created_at, updated_at
  ) 
  VALUES (
    p_session_id, v_user_id, p_package_id, p_amount, p_currency, p_gateway, 'pending', p_metadata, p_expires_at, now(), now()
  ) 
  ON CONFLICT (session_id) 
  DO UPDATE SET 
    user_id = EXCLUDED.user_id,
    package_id = EXCLUDED.package_id,
    amount = EXCLUDED.amount,
    currency = EXCLUDED.currency,
    gateway = EXCLUDED.gateway,
    metadata = EXCLUDED.metadata,
    expires_at = EXCLUDED.expires_at,
    updated_at = now()
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

-- Revoke execute from public roles and grant to authenticated users
REVOKE ALL ON FUNCTION public.create_manual_payment_session(text,text,text,text,uuid,numeric,text,text,timestamptz,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_manual_payment_session(text,text,text,text,uuid,numeric,text,text,timestamptz,jsonb) TO authenticated;