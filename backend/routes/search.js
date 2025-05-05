const express = require('express');
const { query } = require('../db');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Search teachers
router.get('/teachers', auth, authorize('parent'), async (req, res) => {
  try {
    const { 
      search, 
      subject, 
      minRate, 
      maxRate, 
      location, 
      sortBy = 'rating',
      page = 1,
      limit = 12
    } = req.query;

    const offset = (page - 1) * limit;

    let queryText = `
      WITH teacher_stats AS (
        SELECT 
          t.id,
          t.first_name,
          t.last_name,
          t.email,
          t.address as location,
          ARRAY_AGG(DISTINCT c.subject) FILTER (WHERE c.subject IS NOT NULL) as subjects,
          COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed') as total_classes,
          AVG(CASE WHEN ti.rating IS NOT NULL THEN ti.rating ELSE 4.0 END) as rating,
          EXTRACT(YEAR FROM AGE(NOW(), MIN(t.created_at))) as experience_years,
          AVG(c.price_per_lesson) as hourly_rate
        FROM teachers t
        LEFT JOIN classes c ON t.id = c.teacher_id
        LEFT JOIN teacher_interviews ti ON t.id = ti.teacher_id AND ti.status = 'completed'
        WHERE t.status = 'approved'
        GROUP BY t.id, t.first_name, t.last_name, t.email, t.address
      ),
      teacher_qualifications AS (
        SELECT 
          teacher_id,
          json_agg(
            json_build_object(
              'institution', institution,
              'qualification', qualification,
              'year_completed', year_completed
            )
          ) as qualifications
        FROM teacher_qualifications
        GROUP BY teacher_id
      )
      SELECT 
        ts.*,
        COALESCE(tq.qualifications, '[]'::json) as qualifications
      FROM teacher_stats ts
      LEFT JOIN teacher_qualifications tq ON ts.id = tq.teacher_id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Apply filters
    if (search) {
      queryText += ` AND (ts.first_name ILIKE $${paramIndex} OR ts.last_name ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (subject) {
      queryText += ` AND $${paramIndex} = ANY(ts.subjects)`;
      queryParams.push(subject);
      paramIndex++;
    }

    if (minRate) {
      queryText += ` AND ts.hourly_rate >= $${paramIndex}`;
      queryParams.push(parseFloat(minRate));
      paramIndex++;
    }

    if (maxRate) {
      queryText += ` AND ts.hourly_rate <= $${paramIndex}`;
      queryParams.push(parseFloat(maxRate));
      paramIndex++;
    }

    if (location) {
      queryText += ` AND ts.location ILIKE $${paramIndex}`;
      queryParams.push(`%${location}%`);
      paramIndex++;
    }

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        queryText += ' ORDER BY ts.rating DESC NULLS LAST';
        break;
      case 'price_low':
        queryText += ' ORDER BY ts.hourly_rate ASC NULLS LAST';
        break;
      case 'price_high':
        queryText += ' ORDER BY ts.hourly_rate DESC NULLS LAST';
        break;
      case 'experience':
        queryText += ' ORDER BY ts.experience_years DESC NULLS LAST';
        break;
      default:
        queryText += ' ORDER BY ts.rating DESC NULLS LAST';
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM (${queryText}) as count_query`;
    const countResult = await query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count);

    // Add pagination
    queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    res.json({
      teachers: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });

  } catch (error) {
    console.error('Error searching teachers:', error);
    res.status(500).json({ error: 'Failed to search teachers' });
  }
});

// Get teacher profile details
router.get('/teachers/:teacherId', auth, async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacherQuery = `
      SELECT 
        t.*,
        u.email,
        json_agg(
          json_build_object(
            'institution', tq.institution,
            'qualification', tq.qualification,
            'year_completed', tq.year_completed
          )
        ) as qualifications,
        (
          SELECT json_agg(DISTINCT subject)
          FROM classes
          WHERE teacher_id = t.id AND subject IS NOT NULL
        ) as subjects,
        (
          SELECT COUNT(*)
          FROM classes
          WHERE teacher_id = t.id AND status = 'completed'
        ) as total_classes,
        (
          SELECT AVG(rating)
          FROM teacher_interviews
          WHERE teacher_id = t.id AND status = 'completed'
        ) as average_rating,
        (
          SELECT json_agg(
            json_build_object(
              'student_name', s.first_name || ' ' || s.last_name,
              'subject', c.subject,
              'date', c.start_time,
              'rating', ti.rating,
              'comment', ti.notes
            )
          )
          FROM classes c
          JOIN students s ON c.student_id = s.id
          LEFT JOIN teacher_interviews ti ON c.teacher_id = ti.teacher_id
          WHERE c.teacher_id = t.id AND c.status = 'completed'
          LIMIT 5
        ) as recent_reviews
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN teacher_qualifications tq ON t.id = tq.teacher_id
      WHERE t.id = $1 AND t.status = 'approved'
      GROUP BY t.id, u.email
    `;

    const result = await query(teacherQuery, [teacherId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    res.status(500).json({ error: 'Failed to fetch teacher profile' });
  }
});

// Get teacher availability
router.get('/teachers/:teacherId/availability', auth, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    // Get teacher's existing bookings for the specified date
    const bookingsQuery = `
      SELECT 
        start_time,
        end_time
      FROM classes
      WHERE teacher_id = $1
        AND DATE(start_time) = $2
        AND status = 'scheduled'
      ORDER BY start_time
    `;

    const result = await query(bookingsQuery, [teacherId, date]);

    // Define working hours (e.g., 8 AM to 8 PM)
    const workingHours = {
      start: 8,
      end: 20
    };

    // Calculate available slots (1-hour slots)
    const availableSlots = [];
    const bookedSlots = result.rows;

    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // Check if this slot conflicts with any booked slots
      const isAvailable = !bookedSlots.some(booking => {
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);
        
        return (slotStart < bookingEnd && slotEnd > bookingStart);
      });

      if (isAvailable) {
        availableSlots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString()
        });
      }
    }

    res.json({
      date,
      availableSlots,
      bookedSlots
    });

  } catch (error) {
    console.error('Error fetching teacher availability:', error);
    res.status(500).json({ error: 'Failed to fetch teacher availability' });
  }
});

module.exports = router;
