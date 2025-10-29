-- Migration: Add payment ID processing functionality
-- Created: 2025-01-27

-- Create the payment ID processing function
CREATE OR REPLACE FUNCTION process_payment_id_purchase(
  p_clerk_id TEXT,
  p_email TEXT,
  p_full_name TEXT,
  p_package_id UUID,
  p_payment_id TEXT,
  p_amount DECIMAL(10,2),
  p_currency TEXT DEFAULT 'AUD',
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_package_record RECORD;
  v_transaction_id UUID;
  v_result JSONB;
BEGIN
  -- Validate package exists and is active
  SELECT * INTO v_package_record
  FROM packages 
  WHERE id = p_package_id AND active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Package not found or inactive';
  END IF;
  
  -- Check if payment ID already exists
  IF EXISTS (SELECT 1 FROM quota_transactions WHERE payment_id = p_payment_id) THEN
    RAISE EXCEPTION 'Payment ID already used';
  END IF;
  
  -- Get or create user
  SELECT id INTO v_user_id
  FROM users 
  WHERE clerk_id = p_clerk_id;
  
  IF NOT FOUND THEN
    -- Create new user
    INSERT INTO users (clerk_id, email, full_name, created_at, updated_at)
    VALUES (p_clerk_id, p_email, p_full_name, NOW(), NOW())
    RETURNING id INTO v_user_id;
  ELSE
    -- Update existing user info
    UPDATE users 
    SET email = p_email, full_name = p_full_name, updated_at = NOW()
    WHERE id = v_user_id;
  END IF;
  
  -- Update user quota
  INSERT INTO user_quota (user_id, total_hours, used_hours, created_at, updated_at)
  VALUES (v_user_id, v_package_record.hours, 0, NOW(), NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_hours = user_quota.total_hours + v_package_record.hours,
    updated_at = NOW();
  
  -- Record the transaction
  INSERT INTO quota_transactions (
    user_id, 
    package_id, 
    payment_id,
    amount, 
    currency, 
    hours_added, 
    transaction_type, 
    status,
    metadata,
    created_at
  ) VALUES (
    v_user_id, 
    p_package_id, 
    p_payment_id,
    p_amount, 
    p_currency, 
    v_package_record.hours, 
    'purchase', 
    'completed',
    p_metadata,
    NOW()
  ) RETURNING id INTO v_transaction_id;
  
  -- Return success result
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'user_id', v_user_id,
    'hours_added', v_package_record.hours,
    'payment_id', p_payment_id
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE EXCEPTION 'Payment processing failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION process_payment_id_purchase TO authenticated;
GRANT EXECUTE ON FUNCTION process_payment_id_purchase TO service_role;

-- Create index on payment_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_quota_transactions_payment_id 
ON quota_transactions(payment_id) 
WHERE payment_id IS NOT NULL;

-- Add payment_id column to quota_transactions if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quota_transactions' 
    AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE quota_transactions 
    ADD COLUMN payment_id TEXT UNIQUE;
  END IF;
END $$;