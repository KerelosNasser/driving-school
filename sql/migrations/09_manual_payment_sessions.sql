-- Migration: Add manual payment sessions table
-- This migration adds support for manual payment methods like Tyro, BPAY, and PayID

-- Table for storing manual payment sessions (Tyro, BPAY, PayID)
CREATE TABLE IF NOT EXISTS manual_payment_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'AUD',
    gateway TEXT NOT NULL, -- 'tyro', 'bpay', 'payid'
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'cancelled', 'expired'
    payment_reference TEXT,
    metadata JSONB,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for manual payment sessions
CREATE INDEX IF NOT EXISTS idx_manual_payment_sessions_user_id ON manual_payment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_payment_sessions_session_id ON manual_payment_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_manual_payment_sessions_status ON manual_payment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_manual_payment_sessions_expires_at ON manual_payment_sessions(expires_at);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at column
CREATE TRIGGER update_manual_payment_sessions_updated_at 
    BEFORE UPDATE ON manual_payment_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();