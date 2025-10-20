-- Create OAuth tokens table for secure Google Calendar token storage
-- This addresses the critical missing infrastructure for per-user token management

CREATE TABLE IF NOT EXISTS "public"."oauth_tokens" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "token_type" TEXT DEFAULT 'Bearer',
    "expires_at" TIMESTAMPTZ,
    "scope" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one token set per user per provider
    UNIQUE("user_id", "provider")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_oauth_tokens_user_id" ON "public"."oauth_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "idx_oauth_tokens_provider" ON "public"."oauth_tokens"("provider");
CREATE INDEX IF NOT EXISTS "idx_oauth_tokens_expires_at" ON "public"."oauth_tokens"("expires_at");

-- Add RLS policies for security
ALTER TABLE "public"."oauth_tokens" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own tokens
CREATE POLICY "Users can manage own oauth tokens" ON "public"."oauth_tokens"
    FOR ALL
    USING (
        (auth.uid())::text = (
            SELECT clerk_id FROM "public"."users" 
            WHERE id = oauth_tokens.user_id
        )
    );

-- Policy: Service role can manage all tokens (for server-side operations)
CREATE POLICY "Service role can manage all oauth tokens" ON "public"."oauth_tokens"
    FOR ALL
    USING (auth.role() = 'service_role');

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION "public"."update_oauth_tokens_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at updates
CREATE OR REPLACE TRIGGER "update_oauth_tokens_updated_at"
    BEFORE UPDATE ON "public"."oauth_tokens"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_oauth_tokens_updated_at"();

-- Grant necessary permissions
GRANT ALL ON TABLE "public"."oauth_tokens" TO "postgres";
GRANT ALL ON TABLE "public"."oauth_tokens" TO "service_role";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."oauth_tokens" TO "authenticated";