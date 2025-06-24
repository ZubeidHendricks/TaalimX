const express = require('express');
const Joi = require('joi');
const { query, transaction } = require('../db');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createClassSchema = Joi.object({
  teacherId: Joi.number().required(),
  studentId: Joi.number().required(),
  subject: Joi.string().required(),
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().required(),
  pricePerLesson: Joi.number().positive().required()
});

const updateClassSchema = Joi.object({
  startTime: Joi.date().iso(),
  endTime: Joi.date().iso(),
  status: Joi.string().valid('scheduled', 'completed', 'cancelled')
});

// Create a new class
router.post('/', auth, authorize('parent'), async (req, res) => {
  try {
    const { error, value } = createClassSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { teacherId, studentId, subject, startTime, endTime, pricePerLesson } = value;

    // Verify teacher is approved
    const teacherResult = await query(
      'SELECT id FROM teachers WHERE id = $1 AND status = $2',
      [teacherId, 'approved']
    );

    if (teacherResult.rows.length === 0) {
      return res.status(400).json({ error: 'Teacher not found or not approved' });
    }

    // Verify student belongs to parent
    const parentResult = await query(
      'SELECT id FROM parents WHERE user_id = $1',
      [req.user.id]
    );

    if (parentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Parent profile not found' });
    }

    const parentId = parentResult.rows[0].id;

    const studentResult = await query(
      'SELECT id FROM students WHERE id = $1 AND parent_id = $2',
      [studentId, parentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(403).json({ error: 'Student not found or does not belong to you' });
    }

    // Check for scheduling conflicts
    const conflictResult = await query(
      `SELECT id FROM classes 
       WHERE teacher_id = $1 
       AND status = 'scheduled'
       AND (
         (start_time <= $2 AND end_time > $2) OR
         (start_time < $3 AND end_time >= $3) OR
         (start_time >= $2 AND end_time <= $3)
       )`,
      [teacherId, startTime, endTime]
    );

    if (conflictResult.rows.length > 0) {
      return res.status(400).json({ error: 'Teacher already has a class scheduled at this time' });
    }

    // Create the class
    const result = await query(
      `INSERT INTO classes (teacher_id, student_id, subject, start_time, end_time, price_per_lesson)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [teacherId, studentId, subject, startTime, endTime, pricePerLesson]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// Get classes (for parents or teachers)
router.get('/', auth, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let queryText;
    let queryParams = [];

    if (req.user.role === 'parent') {
      // Get parent's ID
      const parentResult = await query(
        'SELECT id FROM parents WHERE user_id = $1',
        [req.user.id]
      );

      if (parentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Parent profile not found' });
      }

      const parentId = parentResult.rows[0].id;

      queryText = `
        SELECT c.*, 
               s.first_name as student_first_name, s.last_name as student_last_name,
               t.first_name as teacher_first_name, t.last_name as teacher_last_name
        FROM classes c
        JOIN students s ON c.student_id = s.id
        JOIN teachers t ON c.teacher_id = t.id
        WHERE s.parent_id = $1
      `;
      queryParams.push(parentId);

    } else if (req.user.role === 'teacher') {
      // Get teacher's ID
      const teacherResult = await query(
        'SELECT id FROM teachers WHERE user_id = $1',
        [req.user.id]
      );

      if (teacherResult.rows.length === 0) {
        return res.status(404).json({ error: 'Teacher profile not found' });
      }

      const teacherId = teacherResult.rows[0].id;

      queryText = `
        SELECT c.*, 
               s.first_name as student_first_name, s.last_name as student_last_name,
               p.first_name as parent_first_name, p.last_name as parent_last_name
        FROM classes c
        JOIN students s ON c.student_id = s.id
        JOIN parents p ON s.parent_id = p.id
        WHERE c.teacher_id = $1
      `;
      queryParams.push(teacherId);
    }

    let paramIndex = 2;

    if (status) {
      queryText += ` AND c.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

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

    queryText += ' ORDER BY c.start_time DESC';

    const result = await query(queryText, queryParams);
    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Get specific class
router.get('/:classId', auth, async (req, res) => {
  try {
    const { classId } = req.params;

    const result = await query(
      `SELECT c.*, 
              s.first_name as student_first_name, s.last_name as student_last_name,
              t.first_name as teacher_first_name, t.last_name as teacher_last_name,
              p.first_name as parent_first_name, p.last_name as parent_last_name
       FROM classes c
       JOIN students s ON c.student_id = s.id
       JOIN teachers t ON c.teacher_id = t.id
       JOIN parents p ON s.parent_id = p.id
       WHERE c.id = $1`,
      [classId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check access permissions
    if (req.user.role === 'parent') {
      const parentResult = await query(
        'SELECT id FROM parents WHERE user_id = $1',
        [req.user.id]
      );
      
      if (parentResult.rows[0].id !== result.rows[0].parent_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'teacher') {
      const teacherResult = await query(
        'SELECT id FROM teachers WHERE user_id = $1',
        [req.user.id]
      );
      
      if (teacherResult.rows[0].id !== result.rows[0].teacher_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

// Update class
router.put('/:classId', auth, async (req, res) => {
  try {
    const { classId } = req.params;
    const { error, value } = updateClassSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if user has permission to update the class
    let hasPermission = false;
    
    if (req.user.role === 'teacher') {
      const teacherResult = await query(
        'SELECT t.id FROM teachers t JOIN classes c ON t.id = c.teacher_id WHERE t.user_id = $1 AND c.id = $2',
        [req.user.id, classId]
      );
      hasPermission = teacherResult.rows.length > 0;
    } else if (req.user.role === 'parent') {
      const parentResult = await query(
        'SELECT p.id FROM parents p JOIN students s ON p.id = s.parent_id JOIN classes c ON s.id = c.student_id WHERE p.user_id = $1 AND c.id = $2',
        [req.user.id, classId]
      );
      hasPermission = parentResult.rows.length > 0;
    }

    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Build update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (value.startTime) {
      updates.push(`start_time = $${paramIndex}`);
      params.push(value.startTime);
      paramIndex++;
    }

    if (value.endTime) {
      updates.push(`end_time = $${paramIndex}`);
      params.push(value.endTime);
      paramIndex++;
    }

    if (value.status) {
      updates.push(`status = $${paramIndex}`);
      params.push(value.status);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid updates provided' });
    }

    params.push(classId);
    const updateQuery = `UPDATE classes SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

// Cancel class
router.post('/:classId/cancel', auth, async (req, res) => {
  try {
    const { classId } = req.params;

    // Check if user has permission to cancel the class
    let hasPermission = false;
    
    if (req.user.role === 'teacher') {
      const teacherResult = await query(
        'SELECT t.id FROM teachers t JOIN classes c ON t.id = c.teacher_id WHERE t.user_id = $1 AND c.id = $2',
        [req.user.id, classId]
      );
      hasPermission = teacherResult.rows.length > 0;
    } else if (req.user.role === 'parent') {
      const parentResult = await query(
        'SELECT p.id FROM parents p JOIN students s ON p.id = s.parent_id JOIN classes c ON s.id = c.student_id WHERE p.user_id = $1 AND c.id = $2',
        [req.user.id, classId]
      );
      hasPermission = parentResult.rows.length > 0;
    }

    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const result = await query(
      'UPDATE classes SET status = $1 WHERE id = $2 AND status = $3 RETURNING *',
      ['cancelled', classId, 'scheduled']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found or already completed/cancelled' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error cancelling class:', error);
    res.status(500).json({ error: 'Failed to cancel class' });
  }
});

// Complete class (teacher only)
router.post('/:classId/complete', auth, authorize('teacher'), async (req, res) => {
  try {
    const { classId } = req.params;

    // Verify teacher owns the class
    const teacherResult = await query(
      'SELECT t.id FROM teachers t JOIN classes c ON t.id = c.teacher_id WHERE t.user_id = $1 AND c.id = $2',
      [req.user.id, classId]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const result = await transaction(async (client) => {
      // Update class status
      const classResult = await client.query(
        'UPDATE classes SET status = $1 WHERE id = $2 AND status = $3 RETURNING *',
        ['completed', classId, 'scheduled']
      );

      if (classResult.rows.length === 0) {
        throw new Error('Class not found or already completed/cancelled');
      }

      const classData = classResult.rows[0];

      // Create payment record
      await client.query(
        `INSERT INTO payments (teacher_id, class_id, amount, payment_method, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [classData.teacher_id, classId, classData.price_per_lesson, 'paypal', 'pending']
      );

      return classData;
    });

    res.json(result);

  } catch (error) {
    console.error('Error completing class:', error);
    res.status(500).json({ error: error.message || 'Failed to complete class' });
  }
});

module.exports = router;
