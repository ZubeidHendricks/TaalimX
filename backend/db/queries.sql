-- Common Queries for TaalimX Database

-- Get all pending teachers for admin review
SELECT 
    t.*,
    u.email as user_email,
    COUNT(q.id) as qualification_count
FROM teachers t
JOIN users u ON t.user_id = u.id
LEFT JOIN teacher_qualifications q ON t.teacher_id = q.teacher_id
WHERE t.status = 'pending'
GROUP BY t.id, u.email
ORDER BY t.created_at DESC;

-- Get teacher availability for a specific date
SELECT 
    t.id,
    t.first_name,
    t.last_name,
    COUNT(c.id) as classes_scheduled
FROM teachers t
LEFT JOIN classes c ON t.id = c.teacher_id
    AND c.status = 'scheduled'
    AND c.start_time::date = '2024-01-15'
WHERE t.status = 'approved'
GROUP BY t.id, t.first_name, t.last_name
HAVING COUNT(c.id) < 8  -- Assuming max 8 classes per day
ORDER BY COUNT(c.id) ASC;

-- Get monthly revenue report
SELECT 
    DATE_TRUNC('month', p.payment_date) as month,
    COUNT(DISTINCT p.teacher_id) as active_teachers,
    COUNT(DISTINCT c.student_id) as active_students,
    COUNT(p.id) as total_lessons,
    SUM(p.amount) as total_revenue,
    SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as collected_revenue,
    SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as pending_revenue
FROM payments p
JOIN classes c ON p.class_id = c.id
GROUP BY DATE_TRUNC('month', p.payment_date)
ORDER BY month DESC;

-- Find teachers by subject expertise (based on class history)
SELECT 
    t.id,
    t.first_name,
    t.last_name,
    c.subject,
    COUNT(c.id) as classes_taught,
    AVG(c.price_per_lesson) as avg_rate
FROM teachers t
JOIN classes c ON t.id = c.teacher_id
WHERE t.status = 'approved'
    AND c.status = 'completed'
GROUP BY t.id, t.first_name, t.last_name, c.subject
ORDER BY classes_taught DESC;

-- Get student progress overview
SELECT 
    s.id,
    s.first_name,
    s.last_name,
    s.arabic_recitation_level,
    COUNT(c.id) as total_classes,
    COUNT(CASE WHEN c.status = 'completed' THEN 1 END) as completed_classes,
    MIN(c.start_time) as first_class,
    MAX(c.start_time) as latest_class
FROM students s
LEFT JOIN classes c ON s.id = c.student_id
GROUP BY s.id, s.first_name, s.last_name, s.arabic_recitation_level;

-- Find overdue payments
SELECT 
    p.id,
    p.amount,
    p.payment_date,
    t.first_name as teacher_first_name,
    t.last_name as teacher_last_name,
    c.subject,
    c.start_time as class_date
FROM payments p
JOIN teachers t ON p.teacher_id = t.id
JOIN classes c ON p.class_id = c.id
WHERE p.status = 'pending'
    AND p.payment_date < NOW() - INTERVAL '30 days'
ORDER BY p.payment_date ASC;

-- Get top performing teachers (by student count and rating)
WITH teacher_stats AS (
    SELECT 
        t.id,
        t.first_name,
        t.last_name,
        COUNT(DISTINCT c.student_id) as unique_students,
        COUNT(c.id) as total_classes,
        AVG(CASE WHEN c.status = 'completed' THEN 1 ELSE 0 END) as completion_rate,
        AVG(c.price_per_lesson) as avg_rate
    FROM teachers t
    JOIN classes c ON t.id = c.teacher_id
    WHERE t.status = 'approved'
    GROUP BY t.id, t.first_name, t.last_name
)
SELECT 
    ts.*,
    ti.rating as interview_rating
FROM teacher_stats ts
LEFT JOIN teacher_interviews ti ON ts.id = ti.teacher_id AND ti.status = 'completed'
ORDER BY ts.unique_students DESC, ts.completion_rate DESC
LIMIT 10;

-- Audit trail: Recent profile updates
SELECT 
    'teacher' as profile_type,
    t.id,
    t.first_name || ' ' || t.last_name as name,
    t.updated_at,
    'Status: ' || t.status as change_description
FROM teachers t
WHERE t.updated_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
    'parent' as profile_type,
    p.id,
    p.first_name || ' ' || p.last_name as name,
    p.updated_at,
    'Profile updated' as change_description
FROM parents p
WHERE p.updated_at > NOW() - INTERVAL '7 days'
ORDER BY updated_at DESC;

-- Find scheduling conflicts
SELECT 
    c1.id as class1_id,
    c2.id as class2_id,
    t.first_name || ' ' || t.last_name as teacher_name,
    c1.start_time as class1_start,
    c1.end_time as class1_end,
    c2.start_time as class2_start,
    c2.end_time as class2_end
FROM classes c1
JOIN classes c2 ON c1.teacher_id = c2.teacher_id 
    AND c1.id < c2.id
    AND c1.status = 'scheduled'
    AND c2.status = 'scheduled'
    AND (
        (c1.start_time <= c2.start_time AND c1.end_time > c2.start_time) OR
        (c2.start_time <= c1.start_time AND c2.end_time > c1.start_time)
    )
JOIN teachers t ON c1.teacher_id = t.id;

-- Get inactive users (no activity in 90 days)
WITH user_activity AS (
    SELECT 
        u.id,
        u.email,
        u.role,
        MAX(GREATEST(
            COALESCE(c.created_at, '1970-01-01'),
            COALESCE(p.created_at, '1970-01-01'),
            u.created_at
        )) as last_activity
    FROM users u
    LEFT JOIN teachers t ON u.id = t.user_id
    LEFT JOIN parents pr ON u.id = pr.user_id
    LEFT JOIN classes c ON (t.id = c.teacher_id OR pr.id = (SELECT parent_id FROM students WHERE id = c.student_id))
    LEFT JOIN payments p ON t.id = p.teacher_id
    GROUP BY u.id, u.email, u.role
)
SELECT * FROM user_activity
WHERE last_activity < NOW() - INTERVAL '90 days'
ORDER BY last_activity ASC;

-- Financial dashboard summary
SELECT 
    (SELECT COUNT(*) FROM teachers WHERE status = 'approved') as active_teachers,
    (SELECT COUNT(*) FROM parents) as registered_parents,
    (SELECT COUNT(*) FROM students) as total_students,
    (SELECT COUNT(*) FROM classes WHERE status = 'scheduled' AND start_time > NOW()) as upcoming_classes,
    (SELECT SUM(amount) FROM payments WHERE status = 'completed' AND payment_date >= DATE_TRUNC('month', CURRENT_DATE)) as mtd_revenue,
    (SELECT SUM(amount) FROM payments WHERE status = 'pending') as pending_payments,
    (SELECT AVG(price_per_lesson) FROM classes) as avg_lesson_price;
