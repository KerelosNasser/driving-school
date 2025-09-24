-- Migration: Fix foreign key constraint for manual payment sessions
-- This migration fixes the foreign key constraint that was incorrectly pointing to auth.users
-- instead of public.users, which was causing foreign key constraint violations.

-- Drop the existing incorrect foreign key constraint
ALTER TABLE public.manual_payment_sessions DROP CONSTRAINT IF EXISTS manual_payment_sessions_user_id_fkey;

-- Add the correct foreign key constraint referencing public.users
ALTER TABLE public.manual_payment_sessions 
ADD CONSTRAINT manual_payment_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;