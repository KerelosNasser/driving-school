-- Function to process payment ID purchases
CREATE OR REPLACE FUNCTION process_payment_id_purchase(
  p_user_id UUID,
  p_package_id UUID,
  p_payment_id TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  transaction_id UUID,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_package_record RECORD;
  v_transaction_id UUID;
  v_current_quota INTEGER;
BEGIN
  -- Get package details
  SELECT id, name, price, hours, active
  INTO v_package_record
  FROM packages
  WHERE id = p_package_id AND active = true;

  -- Check if package exists and is active
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Package not found or inactive';
    RETURN;
  END IF;

  -- Check if payment ID already exists
  IF EXISTS (SELECT 1 FROM quota_transactions WHERE payment_id = p_payment_id) THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Payment ID already used';
    RETURN;
  END IF;

  -- Get current user quota
  SELECT COALESCE(quota_hours, 0) INTO v_current_quota
  FROM users
  WHERE id = p_user_id;

  -- Generate transaction ID
  v_transaction_id := gen_random_uuid();

  -- Insert quota transaction
  INSERT INTO quota_transactions (
    id,
    user_id,
    package_id,
    amount,
    hours_added,
    payment_method,
    payment_id,
    status,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    v_transaction_id,
    p_user_id,
    p_package_id,
    v_package_record.price,
    v_package_record.hours,
    'payment_id',
    p_payment_id,
    'completed',
    p_metadata,
    NOW(),
    NOW()
  );

  -- Update user quota
  UPDATE users
  SET 
    quota_hours = COALESCE(quota_hours, 0) + v_package_record.hours,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Return success
  RETURN QUERY SELECT v_transaction_id, true, 'Payment processed successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION process_payment_id_purchase(UUID, UUID, TEXT, JSONB) TO authenticated;

-- Create index on payment_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_quota_transactions_payment_id ON quota_transactions(payment_id);

-- Add payment_id column to quota_transactions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quota_transactions' 
    AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE quota_transactions ADD COLUMN payment_id TEXT UNIQUE;
  END IF;
END $$;