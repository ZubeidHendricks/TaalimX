const express = require('express');
const Stripe = require('stripe');
const { query } = require('../db');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent for a class
router.post('/create-payment-intent', auth, authorize('parent'), async (req, res) => {
  try {
    const { classId } = req.body;

    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    // Get class details
    const classResult = await query(
      `SELECT c.*, s.parent_id 
       FROM classes c
       JOIN students s ON c.student_id = s.id
       WHERE c.id = $1`,
      [classId]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const classData = classResult.rows[0];

    // Verify parent owns the student
    const parentResult = await query(
      'SELECT id FROM parents WHERE user_id = $1',
      [req.user.id]
    );

    if (parentResult.rows[0].id !== classData.parent_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(classData.price_per_lesson * 100), // Convert to cents
      currency: 'zar', // South African Rand
      metadata: {
        classId: classId,
        teacherId: classData.teacher_id,
        studentId: classData.student_id
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Webhook handler for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      
      // Update payment status
      await query(
        `UPDATE payments 
         SET status = 'completed', stripe_payment_id = $1
         WHERE class_id = $2 AND status = 'pending'`,
        [paymentIntent.id, paymentIntent.metadata.classId]
      );

      // You might want to send an email notification here
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      
      // Update payment status
      await query(
        `UPDATE payments 
         SET status = 'failed', stripe_payment_id = $1
         WHERE class_id = $2 AND status = 'pending'`,
        [failedPayment.id, failedPayment.metadata.classId]
      );
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Get payment history (for teachers)
router.get('/history', auth, authorize('teacher'), async (req, res) => {
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
      SELECT p.*, c.subject, c.start_time, c.end_time,
             s.first_name as student_first_name, s.last_name as student_last_name
      FROM payments p
      JOIN classes c ON p.class_id = c.id
      JOIN students s ON c.student_id = s.id
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
      paramIndex++;
    }

    if (status) {
      queryText += ` AND p.status = $${paramIndex}`;
      queryParams.push(status);
    }

    queryText += ' ORDER BY p.payment_date DESC';

    const result = await query(queryText, queryParams);
    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

// Get payment summary (for teachers)
router.get('/summary', auth, authorize('teacher'), async (req, res) => {
  try {
    // Get teacher ID
    const teacherResult = await query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [req.user.id]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const teacherId = teacherResult.rows[0].id;

    const result = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'completed') as completed_payments,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_payments,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
        SUM(amount) FILTER (WHERE status = 'completed') as total_earned,
        SUM(amount) FILTER (WHERE status = 'pending') as total_pending,
        DATE_TRUNC('month', CURRENT_DATE) as current_month,
        SUM(amount) FILTER (WHERE status = 'completed' AND payment_date >= DATE_TRUNC('month', CURRENT_DATE)) as current_month_earned
      FROM payments
      WHERE teacher_id = $1`,
      [teacherId]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({ error: 'Failed to fetch payment summary' });
  }
});

module.exports = router;
