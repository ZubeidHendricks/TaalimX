const express = require('express');
const Joi = require('joi');
const { query } = require('../db');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation schema
const parentProfileSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phoneNumber: Joi.string().required(),
  address: Joi.string().allow('')
});

// Get parent profile
router.get('/profile', auth, authorize('parent'), async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM parents WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parent profile not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error fetching parent profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update parent profile
router.put('/profile', auth, authorize('parent'), async (req, res) => {
  try {
    const { error, value } = parentProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { firstName, lastName, phoneNumber, address } = value;

    const result = await query(
      `UPDATE parents 
       SET first_name = $1, last_name = $2, phone_number = $3, address = $4
       WHERE user_id = $5
       RETURNING *`,
      [firstName, lastName, phoneNumber, address, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parent profile not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error updating parent profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get parent's students with their classes
router.get('/students-with-classes', auth, authorize('parent'), async (req, res) => {
  try {
    // Get parent ID
    const parentResult = await query(
      'SELECT id FROM parents WHERE user_id = $1',
      [req.user.id]
    );

    if (parentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Parent profile not found' });
    }

    const parentId = parentResult.rows[0].id;

    const result = await query(
      `SELECT 
        s.*,
        json_agg(
          json_build_object(
            'id', c.id,
            'subject', c.subject,
            'start_time', c.start_time,
            'end_time', c.end_time,
            'status', c.status,
            'price_per_lesson', c.price_per_lesson,
            'teacher_name', t.first_name || ' ' || t.last_name
          )
        ) FILTER (WHERE c.id IS NOT NULL) as classes
      FROM students s
      LEFT JOIN classes c ON s.id = c.student_id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      WHERE s.parent_id = $1
      GROUP BY s.id
      ORDER BY s.created_at DESC`,
      [parentId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching students with classes:', error);
    res.status(500).json({ error: 'Failed to fetch students with classes' });
  }
});

module.exports = router;
