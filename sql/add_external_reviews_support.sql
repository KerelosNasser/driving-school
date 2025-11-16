-- Add external review support to reviews table
-- This migration adds columns to support Google Business and other external review sources

-- Add new columns to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'website',
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS reply JSONB,
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add unique constraint for external reviews
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_external_unique 
ON public.reviews (source, external_id) 
WHERE external_id IS NOT NULL;

-- Add index for source filtering
CREATE INDEX IF NOT EXISTS idx_reviews_source ON public.reviews (source);

-- Add index for sync tracking
CREATE INDEX IF NOT EXISTS idx_reviews_synced_at ON public.reviews (synced_at);

-- Create review sync log table
CREATE TABLE IF NOT EXISTS public.review_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(50) NOT NULL,
    sync_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'in_progress',
    reviews_fetched INTEGER DEFAULT 0,
    reviews_imported INTEGER DEFAULT 0,
    reviews_updated INTEGER DEFAULT 0,
    reviews_skipped INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for sync log queries
CREATE INDEX IF NOT EXISTS idx_sync_log_source ON public.review_sync_log (source);
CREATE INDEX IF NOT EXISTS idx_sync_log_created_at ON public.review_sync_log (created_at DESC);

-- Add comment to explain the schema
COMMENT ON COLUMN public.reviews.source IS 'Source of the review: website, google, facebook, etc.';
COMMENT ON COLUMN public.reviews.external_id IS 'External platform review ID for deduplication';
COMMENT ON COLUMN public.reviews.profile_photo_url IS 'URL to reviewer profile photo from external platform';
COMMENT ON COLUMN public.reviews.reply IS 'Business reply to the review (JSON with comment and updated_at)';
COMMENT ON COLUMN public.reviews.synced_at IS 'Last time this review was synced from external source';
COMMENT ON TABLE public.review_sync_log IS 'Tracks history of external review synchronization';
