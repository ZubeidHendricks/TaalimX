const express = require('express');
const Joi = require('joi');
const { query, transaction } = require('../db');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const teacherProfileSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  idNumber: Joi.string().required(),
  phoneNumber: Joi.string().required(),
  address: Joi.string().allow(''),
  driversLicenseNumber: Joi.string().allow(''),
  driversLicenseExpiry: Joi.date().allow(null),
  policeClearanceNumber: Joi.string().required(),
  policeClearanceExpiry: Joi.date().required()
});

const qualificationSchema = Joi.object({
  institution: Joi.string().required(),
  qualification: Joi.string().required(),
  yearCompleted: Joi.number().integer().min(1900).max(new Date().getFullYear()).required()
});

// Get teacher profile
router.get('/profile', auth, authorize('teacher'), async (req, res) => {
  try {
    const profileResult = await query(
      'SELECT * FROM teachers WHERE user_id = $1',
      [req.user.id]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const teacher = profileResult.rows[0];

    // Get qualifications
    const qualificationsResult = await query(
      'SELECT * FROM teacher_qualifications WHERE teacher_id = $1 ORDER BY year_completed DESC',
      [teacher.id]
    );

    res.json({
      ...teacher,
      qualifications: qualificationsResult.rows
    });

  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update teacher profile
router.put('/profile', auth, authorize('teacher'), async (req, res) => {
  try {
    const { error, value } = teacherProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const {
      firstName,
      lastName,
      idNumber,
      phoneNumber,
      address,
      driversLicenseNumber,
      driversLicenseExpiry,
      policeClearanceNumber,
      policeClearanceExpiry
    } = value;

    const result = await query(
      `UPDATE teachers 
       SET first_name = $1, last_name = $2, id_number = $3, phone_number = $4, 
           address = $5, drivers_license_number = $6, drivers_license_expiry = $7,
           police_clearance_number = $8, police_clearance_expiry = $9
       WHERE user_id = $10
       RETURNING *`,
      [
        firstName, lastName, idNumber, phoneNumber, address,
        driversLicenseNumber, driversLicenseExpiry,
        policeClearanceNumber, policeClearanceExpiry,
        req.user.id
      ]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error updating teacher profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Add qualification
router.post('/qualifications', auth, authorize('teacher'), async (req, res) => {
  try {
    const { error, value } = qualificationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Get teacher ID
    const teacherResult = await query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [req.user.id]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const teacherId = teacherResult.rows[0].id;
    const { institution, qualification, yearCompleted } = value;

    const result = await query(
      `INSERT INTO teacher_qualifications (teacher_id, institution, qualification, year_completed)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [teacherId, institution, qualification, yearCompleted]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Error adding qualification:', error);
    res.status(500).json({ error: 'Failed to add qualification' });
  }
});

// Get all teachers (admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const queryParams = [];
    
    if (status) {
      queryParams.push(status);
      whereClause = 'WHERE t.status = $1';
    }

    const teachersQuery = `
      SELECT t.*, u.email as user_email,
             COUNT(*) OVER() as total_count
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    queryParams.push(limit, offset);

    const result = await query(teachersQuery, queryParams);

    const teachers = result.rows;
    const totalCount = teachers.length > 0 ? parseInt(teachers[0].total_count) : 0;

    res.json({
      teachers: teachers.map(({ total_count, ...teacher }) => teacher),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// Update teacher status (admin only)
router.patch('/:teacherId/status', auth, authorize('admin'), async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { status } = req.body;

    if (!['pending', 'interviewed', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await query(
      'UPDATE teachers SET status = $1 WHERE id = $2 RETURNING *',
      [status, teacherId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error updating teacher status:', error);
    res.status(500).json({ error: 'Failed to update teacher status' });
  }
});

// Get teacher's classes
router.get('/classes', auth, authorize('teacher'), async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    // Get teacher ID
    const teacherResult = await query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [req.user.id]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const teacherId = teacherResult.rows[0].id;

    let queryText = `
      SELECT c.*, s.first_name as student_first_name, s.last_name as student_last_name,
             p.first_name as parent_first_name, p.last_name as parent_last_name,
             p.phone_number as parent_phone
      FROM classes c
      JOIN students s ON c.student_id = s.id
      JOIN parents p ON s.parent_id = p.id
      WHERE c.teacher_id = $1
    `;

    const queryParams = [teacherId];
    let paramIndex = 2;

    if (startDate) {
      queryText += ` AND c.start_time >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      queryText += ` AND c.end_time <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }

    if (status) {
      queryText += ` AND c.status = $${paramIndex}`;
      queryParams.push(status);
    }

    queryText += ' ORDER BY c.start_time DESC';

    const result = await query(queryText, queryParams);

    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Get teacher's earnings
router.get('/earnings', auth, authorize('teacher'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get teacher ID
    const teacherResult = await query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [req.user.id]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const teacherId = teacherResult.rows[0].id;

    let queryText = `
      SELECT 
        DATE_TRUNC('month', p.payment_date) as month,
        COUNT(*) as lesson_count,
        SUM(p.amount) as total_earned,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as pending_amount
      FROM payments p
      WHERE p.teacher_id = $1
    `;

    const queryParams = [teacherId];
    let paramIndex = 2;

    if (startDate) {
      queryText += ` AND p.payment_date >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      queryText += ` AND p.payment_date <= $${paramIndex}`;
      queryParams.push(endDate);
    }

    queryText += ' GROUP BY DATE_TRUNC(\'month\', p.payment_date) ORDER BY month DESC';

    const result = await query(queryText, queryParams);

    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching teacher earnings:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

module.exports = router;
