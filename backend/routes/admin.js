const express = require('express');
const { query } = require('../db');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard-stats', auth, authorize('admin'), async (req, res) => {
  try {
    // Get teacher counts
    const teacherStats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved
      FROM teachers
    `);

    // Get parent and student counts
    const parentStats = await query('SELECT COUNT(*) as total FROM parents');
    const studentStats = await query('SELECT COUNT(*) as total FROM students');

    // Get class statistics
    const classStats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'scheduled' AND start_time > NOW()) as upcoming,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
      FROM classes
    `);

    // Get revenue statistics
    const revenueStats = await query(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(SUM(amount) FILTER (WHERE payment_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) as monthly_revenue,
        COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_payments
      FROM payments
      WHERE status IN ('completed', 'pending')
    `);

    res.json({
      totalTeachers: parseInt(teacherStats.rows[0].total),
      pendingTeachers: parseInt(teacherStats.rows[0].pending),
      approvedTeachers: parseInt(teacherStats.rows[0].approved),
      totalParents: parseInt(parentStats.rows[0].total),
      totalStudents: parseInt(studentStats.rows[0].total),
      totalClasses: parseInt(classStats.rows[0].total),
      upcomingClasses: parseInt(classStats.rows[0].upcoming),
      totalRevenue: revenueStats.rows[0].total_revenue,
      monthlyRevenue: revenueStats.rows[0].monthly_revenue,
      pendingPayments: revenueStats.rows[0].pending_payments
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get pending teachers
router.get('/pending-teachers', auth, authorize('admin'), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        t.id,
        t.first_name,
        t.last_name,
        t.created_at,
        u.email,
        COUNT(q.id) as qualification_count
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN teacher_qualifications q ON t.id = q.teacher_id
      WHERE t.status = 'pending'
      GROUP BY t.id, t.first_name, t.last_name, t.created_at, u.email
      ORDER BY t.created_at ASC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching pending teachers:', error);
    res.status(500).json({ error: 'Failed to fetch pending teachers' });
  }
});

// Get teacher details for review
router.get('/teachers/:teacherId', auth, authorize('admin'), async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Get teacher details
    const teacherResult = await query(`
      SELECT 
        t.*,
        u.email
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = $1
    `, [teacherId]);

    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Get qualifications
    const qualificationsResult = await query(`
      SELECT * FROM teacher_qualifications
      WHERE teacher_id = $1
      ORDER BY year_completed DESC
    `, [teacherId]);

    res.json({
      teacher: teacherResult.rows[0],
      qualifications: qualificationsResult.rows
    });

  } catch (error) {
    console.error('Error fetching teacher details:', error);
    res.status(500).json({ error: 'Failed to fetch teacher details' });
  }
});

// Approve teacher
router.post('/teachers/:teacherId/approve', auth, authorize('admin'), async (req, res) => {
  try {
    const { teacherId } = req.params;

    const result = await query(
      'UPDATE teachers SET status = $1 WHERE id = $2 RETURNING *',
      ['approved', teacherId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // TODO: Send approval email to teacher

    res.json({ message: 'Teacher approved successfully', teacher: result.rows[0] });

  } catch (error) {
    console.error('Error approving teacher:', error);
    res.status(500).json({ error: 'Failed to approve teacher' });
  }
});

// Reject teacher
router.post('/teachers/:teacherId/reject', auth, authorize('admin'), async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { reason } = req.body;

    const result = await query(
      'UPDATE teachers SET status = $1 WHERE id = $2 RETURNING *',
      ['rejected', teacherId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // TODO: Send rejection email to teacher with reason

    res.json({ message: 'Teacher rejected', teacher: result.rows[0] });

  } catch (error) {
    console.error('Error rejecting teacher:', error);
    res.status(500).json({ error: 'Failed to reject teacher' });
  }
});

// Get all users with filters
router.get('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let queryText = `
      SELECT 
        u.id,
        u.email,
        u.role,
        u.created_at,
        CASE 
          WHEN u.role = 'teacher' THEN t.first_name
          WHEN u.role = 'parent' THEN p.first_name
          ELSE NULL
        END as first_name,
        CASE 
          WHEN u.role = 'teacher' THEN t.last_name
          WHEN u.role = 'parent' THEN p.last_name
          ELSE NULL
        END as last_name,
        CASE 
          WHEN u.role = 'teacher' THEN t.status
          ELSE 'active'
        END as status
      FROM users u
      LEFT JOIN teachers t ON u.id = t.user_id
      LEFT JOIN parents p ON u.id = p.user_id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (role) {
      queryText += ` AND u.role = $${paramIndex}`;
      queryParams.push(role);
      paramIndex++;
    }

    if (status && role === 'teacher') {
      queryText += ` AND t.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (
        u.email ILIKE $${paramIndex} OR 
        t.first_name ILIKE $${paramIndex} OR 
        t.last_name ILIKE $${paramIndex} OR
        p.first_name ILIKE $${paramIndex} OR 
        p.last_name ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(queryText.replace('SELECT', 'SELECT COUNT(*) as total FROM (SELECT') + ') as subquery', queryParams);
    const totalCount = parseInt(countResult.rows[0].total);

    // Add pagination
    queryText += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    res.json({
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get revenue report
router.get('/reports/revenue', auth, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;

    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateFormat = 'YYYY-WW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      case 'year':
        dateFormat = 'YYYY';
        break;
      default:
        dateFormat = 'YYYY-MM';
    }

    let queryText = `
      SELECT 
        TO_CHAR(p.payment_date, '${dateFormat}') as period,
        COUNT(DISTINCT p.teacher_id) as active_teachers,
        COUNT(DISTINCT c.student_id) as active_students,
        COUNT(p.id) as total_transactions,
        SUM(p.amount) as total_revenue,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as completed_revenue,
        SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as pending_revenue,
        SUM(CASE WHEN p.status = 'failed' THEN p.amount ELSE 0 END) as failed_revenue
      FROM payments p
      JOIN classes c ON p.class_id = c.id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (startDate) {
      queryText += ` AND p.payment_date >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      queryText += ` AND p.payment_date <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }

    queryText += ` GROUP BY period ORDER BY period DESC`;

    const result = await query(queryText, queryParams);

    res.json(result.rows);

  } catch (error) {
    console.error('Error generating revenue report:', error);
    res.status(500).json({ error: 'Failed to generate revenue report' });
  }
});

// Get teacher performance report
router.get('/reports/teacher-performance', auth, authorize('admin'), async (req, res) => {
  try {
    const result = await query(`
      WITH teacher_stats AS (
        SELECT 
          t.id,
          t.first_name,
          t.last_name,
          COUNT(DISTINCT c.id) as total_classes,
          COUNT(DISTINCT CASE WHEN c.status = 'completed' THEN c.id END) as completed_classes,
          COUNT(DISTINCT CASE WHEN c.status = 'cancelled' THEN c.id END) as cancelled_classes,
          COUNT(DISTINCT c.student_id) as unique_students,
          AVG(c.price_per_lesson) as avg_lesson_price,
          SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_earnings
        FROM teachers t
        LEFT JOIN classes c ON t.id = c.teacher_id
        LEFT JOIN payments p ON c.id = p.class_id
        WHERE t.status = 'approved'
        GROUP BY t.id, t.first_name, t.last_name
      )
      SELECT 
        ts.*,
        CASE 
          WHEN ts.total_classes > 0 
          THEN ROUND((ts.completed_classes::numeric / ts.total_classes) * 100, 2)
          ELSE 0 
        END as completion_rate
      FROM teacher_stats ts
      ORDER BY ts.total_earnings DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error('Error generating teacher performance report:', error);
    res.status(500).json({ error: 'Failed to generate teacher performance report' });
  }
});

// Get user activity log
router.get('/activity-log', auth, authorize('admin'), async (req, res) => {
  try {
    const { userId, action, startDate, endDate, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Note: This assumes you have an activity_log table
    // You would need to create this table and implement logging throughout the application
    
    let queryText = `
      SELECT 
        al.*,
        u.email as user_email,
        u.role as user_role
      FROM activity_log al
      JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (userId) {
      queryText += ` AND al.user_id = $${paramIndex}`;
      queryParams.push(userId);
      paramIndex++;
    }

    if (action) {
      queryText += ` AND al.action = $${paramIndex}`;
      queryParams.push(action);
      paramIndex++;
    }

    if (startDate) {
      queryText += ` AND al.created_at >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      queryText += ` AND al.created_at <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(queryText.replace('SELECT', 'SELECT COUNT(*) as total FROM (SELECT') + ') as subquery', queryParams);
    const totalCount = parseInt(countResult.rows[0].total);

    // Add pagination
    queryText += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    res.json({
      activities: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
});

module.exports = router;
