-- Migration script to update database from Stripe to PayPal
-- Run this script to migrate existing database

-- Add PayPal order ID column and remove Stripe payment ID
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS paypal_order_id VARCHAR(255);

-- Update existing payment records to use 'paypal' as payment method
UPDATE payments 
SET payment_method = 'paypal' 
WHERE payment_method = 'stripe';

-- Optional: Remove the old stripe_payment_id column after backup
-- Uncomment the line below only after ensuring data is backed up
-- ALTER TABLE payments DROP COLUMN IF EXISTS stripe_payment_id;

-- Create index for better performance on PayPal order lookups
CREATE INDEX IF NOT EXISTS idx_payments_paypal_order_id ON payments(paypal_order_id);

-- Update any existing payment status for better clarity
UPDATE payments 
SET status = 'completed' 
WHERE status = 'succeeded';

UPDATE payments 
SET status = 'failed' 
WHERE status = 'requires_payment_method' OR status = 'canceled';

COMMIT;