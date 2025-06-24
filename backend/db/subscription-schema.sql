-- Subscription Plans Table
CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
    paypal_plan_id VARCHAR(255) UNIQUE NOT NULL,
    paypal_product_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_per_lesson DECIMAL(10, 2) NOT NULL,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('week', 'month')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions Table
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES subscription_plans(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES parents(id) ON DELETE CASCADE,
    paypal_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'suspended', 'expired')),
    start_date DATE NOT NULL,
    activated_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    suspended_at TIMESTAMP,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscription Payments Table (for tracking recurring payments)
CREATE TABLE subscription_payments (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
    paypal_payment_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'refunded')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscription Classes Table (for scheduled classes under subscription)
CREATE TABLE subscription_classes (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_subscription_plans_teacher_id ON subscription_plans(teacher_id);
CREATE INDEX idx_subscription_plans_paypal_plan_id ON subscription_plans(paypal_plan_id);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_student_id ON subscriptions(student_id);
CREATE INDEX idx_subscriptions_parent_id ON subscriptions(parent_id);
CREATE INDEX idx_subscriptions_paypal_subscription_id ON subscriptions(paypal_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscription_payments_subscription_id ON subscription_payments(subscription_id);
CREATE INDEX idx_subscription_payments_payment_date ON subscription_payments(payment_date);
CREATE INDEX idx_subscription_classes_subscription_id ON subscription_classes(subscription_id);
CREATE INDEX idx_subscription_classes_scheduled_date ON subscription_classes(scheduled_date);

-- Triggers for updated_at columns
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_classes_updated_at
    BEFORE UPDATE ON subscription_classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Views for easy querying
CREATE VIEW active_subscriptions AS
SELECT 
    s.*,
    sp.name as plan_name,
    sp.description as plan_description,
    sp.price_per_lesson,
    sp.frequency,
    st.first_name as student_first_name,
    st.last_name as student_last_name,
    p.first_name as parent_first_name,
    p.last_name as parent_last_name,
    t.first_name as teacher_first_name,
    t.last_name as teacher_last_name
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
JOIN students st ON s.student_id = st.id
JOIN parents p ON s.parent_id = p.id
JOIN teachers t ON sp.teacher_id = t.id
WHERE s.status = 'active';

CREATE VIEW subscription_revenue AS
SELECT 
    sp.teacher_id,
    sp.name as plan_name,
    COUNT(s.id) as active_subscriptions,
    SUM(sp.price_per_lesson) as monthly_revenue,
    AVG(sp.price_per_lesson) as avg_price_per_lesson
FROM subscription_plans sp
LEFT JOIN subscriptions s ON sp.id = s.plan_id AND s.status = 'active'
WHERE sp.status = 'active'
GROUP BY sp.teacher_id, sp.id, sp.name;