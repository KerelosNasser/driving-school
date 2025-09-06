-- Quota System Database Schema
-- Manages user driving hour quotas and transactions

-- User Quotas Table - Tracks each user's available driving hours
CREATE TABLE IF NOT EXISTS user_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_hours DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    used_hours DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    available_hours DECIMAL(5,2) GENERATED ALWAYS AS (total_hours - used_hours) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one quota record per user
    CONSTRAINT unique_user_quota UNIQUE (user_id),
    -- Ensure used hours never exceed total hours
    CONSTRAINT valid_hours CHECK (used_hours <= total_hours AND used_hours >= 0 AND total_hours >= 0)
);

-- Quota Transactions Table - Detailed history of all quota changes
CREATE TABLE IF NOT EXISTS quota_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'booking', 'refund', 'adjustment', 'free_credit')),
    hours_change DECIMAL(5,2) NOT NULL, -- Positive for additions, negative for deductions
    amount_paid DECIMAL(10,2), -- NULL for non-monetary transactions
    description TEXT NOT NULL,
    
    -- Related records
    package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    payment_id TEXT, -- Stripe payment ID
    
    -- Metadata
    metadata JSONB DEFAULT '{}', -- Store additional transaction details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL -- Admin who made adjustment
);

-- Instructor Messages Table - For negotiation system
CREATE TABLE IF NOT EXISTS instructor_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
    email_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update bookings table to include hours_used
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS hours_used DECIMAL(5,2) DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS quota_transaction_id UUID REFERENCES quota_transactions(id) ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_quotas_user_id ON user_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_quota_transactions_user_id ON quota_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_quota_transactions_type ON quota_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_quota_transactions_created_at ON quota_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_instructor_messages_user_id ON instructor_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_quota_transaction ON bookings(quota_transaction_id);

-- Trigger to update user_quotas.updated_at
CREATE OR REPLACE FUNCTION update_quota_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_quotas_updated_at
    BEFORE UPDATE ON user_quotas
    FOR EACH ROW
    EXECUTE FUNCTION update_quota_updated_at();

-- Function to safely update user quota
CREATE OR REPLACE FUNCTION update_user_quota(
    p_user_id UUID,
    p_hours_change DECIMAL(5,2),
    p_transaction_type VARCHAR(20),
    p_description TEXT,
    p_amount_paid DECIMAL(10,2) DEFAULT NULL,
    p_package_id UUID DEFAULT NULL,
    p_booking_id UUID DEFAULT NULL,
    p_payment_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_current_quota user_quotas%ROWTYPE;
BEGIN
    -- Get or create user quota record
    INSERT INTO user_quotas (user_id, total_hours, used_hours)
    VALUES (p_user_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Get current quota
    SELECT * INTO v_current_quota FROM user_quotas WHERE user_id = p_user_id;
    
    -- Validate the transaction
    IF p_transaction_type = 'booking' AND p_hours_change < 0 THEN
        IF (v_current_quota.available_hours + p_hours_change) < 0 THEN
            RAISE EXCEPTION 'Insufficient quota hours. Available: %, Requested: %', 
                v_current_quota.available_hours, ABS(p_hours_change);
        END IF;
    END IF;
    
    -- Create transaction record
    INSERT INTO quota_transactions (
        user_id, transaction_type, hours_change, amount_paid, description,
        package_id, booking_id, payment_id, metadata
    ) VALUES (
        p_user_id, p_transaction_type, p_hours_change, p_amount_paid, p_description,
        p_package_id, p_booking_id, p_payment_id, p_metadata
    ) RETURNING id INTO v_transaction_id;
    
    -- Update user quota
    IF p_transaction_type IN ('purchase', 'refund', 'adjustment', 'free_credit') THEN
        -- These affect total_hours
        UPDATE user_quotas 
        SET total_hours = total_hours + p_hours_change
        WHERE user_id = p_user_id;
    ELSIF p_transaction_type = 'booking' THEN
        -- This affects used_hours
        UPDATE user_quotas 
        SET used_hours = used_hours + ABS(p_hours_change)
        WHERE user_id = p_user_id;
    END IF;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own quota data
CREATE POLICY "Users can view own quota" ON user_quotas
    FOR SELECT USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

CREATE POLICY "Users can view own transactions" ON quota_transactions
    FOR SELECT USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

CREATE POLICY "Users can create own messages" ON instructor_messages
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

CREATE POLICY "Users can view own messages" ON instructor_messages
    FOR SELECT USING (auth.uid()::text = (SELECT clerk_id FROM users WHERE id = user_id));

-- Admin policies
CREATE POLICY "Admins can manage all quotas" ON user_quotas
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage all transactions" ON quota_transactions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can view all messages" ON instructor_messages
    FOR SELECT USING (auth.role() = 'authenticated');

-- Success message
SELECT 'Quota system schema created successfully! 🎉' as message,
       'Tables: user_quotas, quota_transactions, instructor_messages' as tables,
       'Function: update_user_quota() for safe quota management' as functions,
       'RLS policies enabled for data security' as security;