const express = require('express');
const Joi = require('joi');
const { query } = require('../db');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Validation schema
const studentSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  dateOfBirth: Joi.date().required(),
  schoolName: Joi.string().allow(''),
  grade: Joi.string().allow(''),
  arabicRecitationLevel: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').required()
});

// Get all students for parent
router.get('/', auth, authorize('parent'), async (req, res) => {
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
      `SELECT * FROM students WHERE parent_id = $1 ORDER BY created_at DESC`,
      [parentId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Add new student
router.post('/', auth, authorize('parent'), async (req, res) => {
  try {
    const { error, value } = studentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Get parent ID
    const parentResult = await query(
      'SELECT id FROM parents WHERE user_id = $1',
      [req.user.id]
    );

    if (parentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Parent profile not found' });
    }

    const parentId = parentResult.rows[0].id;
    const { firstName, lastName, dateOfBirth, schoolName, grade, arabicRecitationLevel } = value;

    const result = await query(
      `INSERT INTO students (parent_id, first_name, last_name, date_of_birth, school_name, grade, arabic_recitation_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [parentId, firstName, lastName, dateOfBirth, schoolName, grade, arabicRecitationLevel]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ error: 'Failed to add student' });
  }
});

// Get specific student
router.get('/:studentId', auth, authorize('parent'), async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get parent ID
    const parentResult = await query(
      'SELECT id FROM parents WHERE user_id = $1',
      [req.user.id]
    );

    if (parentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Parent profile not found' });
    }

    const parentId = parentResult.rows[0].id;

    // Check if student belongs to parent
    const result = await query(
      'SELECT * FROM students WHERE id = $1 AND parent_id = $2',
      [studentId, parentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Update student
router.put('/:studentId', auth, authorize('parent'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { error, value } = studentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Get parent ID
    const parentResult = await query(
      'SELECT id FROM parents WHERE user_id = $1',
      [req.user.id]
    );

    if (parentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Parent profile not found' });
    }

    const parentId = parentResult.rows[0].id;

    // Check if student belongs to parent
    const checkResult = await query(
      'SELECT id FROM students WHERE id = $1 AND parent_id = $2',
      [studentId, parentId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const { firstName, lastName, dateOfBirth, schoolName, grade, arabicRecitationLevel } = value;

    const result = await query(
      `UPDATE students 
       SET first_name = $1, last_name = $2, date_of_birth = $3, 
           school_name = $4, grade = $5, arabic_recitation_level = $6
       WHERE id = $7
       RETURNING *`,
      [firstName, lastName, dateOfBirth, schoolName, grade, arabicRecitationLevel, studentId]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Delete student
router.delete('/:studentId', auth, authorize('parent'), async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get parent ID
    const parentResult = await query(
      'SELECT id FROM parents WHERE user_id = $1',
      [req.user.id]
    );

    if (parentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Parent profile not found' });
    }

    const parentId = parentResult.rows[0].id;

    // Check if student belongs to parent
    const checkResult = await query(
      'SELECT id FROM students WHERE id = $1 AND parent_id = $2',
      [studentId, parentId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await query('DELETE FROM students WHERE id = $1', [studentId]);

    res.json({ message: 'Student deleted successfully' });

  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

module.exports = router;
