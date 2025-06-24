-- PayPal Migration Script
-- This script updates the database schema to support PayPal payments

-- Add PayPal-specific columns to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS paypal_order_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paypal_payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create unique constraint on paypal_order_id to prevent duplicate orders
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_paypal_order_id ON payments(paypal_order_id) WHERE paypal_order_id IS NOT NULL;

-- Create index on paypal_payment_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_paypal_payment_id ON payments(paypal_payment_id) WHERE paypal_payment_id IS NOT NULL;

-- Create processed_webhooks table for webhook idempotency
CREATE TABLE IF NOT EXISTS processed_webhooks (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on event_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_event_id ON processed_webhooks(event_id);

-- Create index on event_type for reporting
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_event_type ON processed_webhooks(event_type);

-- Create index on processed_at for cleanup operations
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_processed_at ON processed_webhooks(processed_at);

-- Create update trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for updated_at on payments table
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing NULL status values to 'pending' for consistency
UPDATE payments SET status = 'pending' WHERE status IS NULL;

-- Ensure status column has proper constraint
ALTER TABLE payments ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
    CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded'));

-- Create view for payment analytics
CREATE OR REPLACE VIEW payment_analytics AS
SELECT 
    DATE_TRUNC('month', payment_date) as month,
    COUNT(*) as total_payments,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_payments,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
    SUM(amount) FILTER (WHERE status = 'completed') as total_revenue,
    AVG(amount) FILTER (WHERE status = 'completed') as avg_payment_amount,
    COUNT(DISTINCT teacher_id) as unique_teachers,
    COUNT(DISTINCT parent_id) as unique_parents
FROM payments
WHERE payment_date IS NOT NULL
GROUP BY DATE_TRUNC('month', payment_date)
ORDER BY month DESC;

-- Create view for teacher earnings
CREATE OR REPLACE VIEW teacher_earnings AS
SELECT 
    t.id as teacher_id,
    t.first_name,
    t.last_name,
    COUNT(p.id) as total_payments,
    COUNT(p.id) FILTER (WHERE p.status = 'completed') as completed_payments,
    SUM(p.amount) FILTER (WHERE p.status = 'completed') as total_earnings,
    AVG(p.amount) FILTER (WHERE p.status = 'completed') as avg_lesson_price,
    MAX(p.payment_date) as last_payment_date
FROM teachers t
LEFT JOIN payments p ON t.id = p.teacher_id
GROUP BY t.id, t.first_name, t.last_name
ORDER BY total_earnings DESC NULLS LAST;

-- Add cleanup job for old webhook records (keeps 30 days)
-- This should be run periodically by a cron job or scheduled task
-- DELETE FROM processed_webhooks WHERE processed_at < NOW() - INTERVAL '30 days';

-- Insert migration record
INSERT INTO migrations (version, description, applied_at) 
VALUES ('paypal_v1', 'Added PayPal payment support with webhook idempotency', NOW())
ON CONFLICT (version) DO NOTHING;

-- Create migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);