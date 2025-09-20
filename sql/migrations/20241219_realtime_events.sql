-- Migration: Create realtime_events table for broadcasting real-time events
-- This table is used to broadcast events through Supabase real-time subscriptions

CREATE TABLE IF NOT EXISTS realtime_events (
  id UUID PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  page_name VARCHAR(100) NOT NULL,
  user_id TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_realtime_events_page_type ON realtime_events(page_name, event_type);
CREATE INDEX IF NOT EXISTS idx_realtime_events_created_at ON realtime_events(created_at);
CREATE INDEX IF NOT EXISTS idx_realtime_events_expires_at ON realtime_events(expires_at);

-- Enable real-time for this table
ALTER PUBLICATION supabase_realtime ADD TABLE realtime_events;

-- Function to automatically clean up expired events
CREATE OR REPLACE FUNCTION cleanup_expired_realtime_events()
RETURNS void AS $$
BEGIN
  DELETE FROM realtime_events WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired events (runs every hour)
-- Note: This requires pg_cron extension which may not be available in all environments
-- SELECT cron.schedule('cleanup-realtime-events', '0 * * * *', 'SELECT cleanup_expired_realtime_events();');

-- Alternative: Create a trigger to clean up old events on insert
CREATE OR REPLACE FUNCTION trigger_cleanup_realtime_events()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean up events older than 1 hour on every 100th insert (to avoid too frequent cleanup)
  IF random() < 0.01 THEN
    DELETE FROM realtime_events WHERE expires_at < NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_realtime_events_trigger
  AFTER INSERT ON realtime_events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_realtime_events();