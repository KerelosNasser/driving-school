-- Migration script to create invitation_codes table if it doesn't exist

-- Check if invitation_codes table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'invitation_codes'
    ) THEN
        -- Create invitation_codes table
        CREATE TABLE public.invitation_codes (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
            code text UNIQUE NOT NULL,
            is_active boolean DEFAULT true,
            current_uses integer DEFAULT 0,
            max_uses integer,
            created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
            updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        -- Create index on is_active column
        CREATE INDEX idx_invitation_codes_active ON public.invitation_codes(is_active);

        RAISE NOTICE 'Created invitation_codes table';
    ELSE
        RAISE NOTICE 'invitation_codes table already exists';
    END IF;
END
$$;

-- Create trigger for updated_at
DO $$
BEGIN
    -- Check if the trigger already exists
    IF NOT EXISTS (
        SELECT FROM pg_trigger 
        WHERE tgname = 'set_updated_at_on_invitation_codes'
    ) THEN
        -- Create the trigger
        CREATE TRIGGER set_updated_at_on_invitation_codes
        BEFORE UPDATE ON public.invitation_codes
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
        
        RAISE NOTICE 'Created updated_at trigger for invitation_codes';
    ELSE
        RAISE NOTICE 'updated_at trigger for invitation_codes already exists';
    END IF;
END
$$;