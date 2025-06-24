const express = require('express');
const { query } = require('../db');
const { auth, authorize } = require('../middleware/auth');
const {
  verifyPayPalWebhook,
  webhookRateLimit,
  webhookSecurity,
  validateWebhookEvent,
  webhookIdempotency,
  webhookErrorHandler
} = require('../middleware/webhook-verification');

const router = express.Router();

// PayPal SDK setup
const paypal = require('@paypal/paypal-server-sdk');

const client = new paypal.PayPalApi({
  environment: process.env.NODE_ENV === 'production' ? paypal.Environment.Live : paypal.Environment.Sandbox,
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
});

// Helper function to create PayPal order
const createPayPalOrder = async (amount, classId, metadata) => {
  const orderRequest = {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: `class_${classId}`,
      amount: {
        currency_code: 'ZAR',
        value: amount.toFixed(2)
      },
      description: `Payment for Islamic education class - ID: ${classId}`,
      custom_id: classId.toString(),
      invoice_id: `INV-${Date.now()}-${classId}`
    }],
    application_context: {
      brand_name: 'TaalimX - Islamic Education',
      landing_page: 'BILLING',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'PAY_NOW',
      return_url: `${process.env.FRONTEND_URL}/parent/payment-success?class_id=${classId}`,
      cancel_url: `${process.env.FRONTEND_URL}/parent/payment-cancelled?class_id=${classId}`
    }
  };

  try {
    const { body: order } = await client.ordersController.ordersCreate({
      body: orderRequest,
      prefer: 'return=representation'
    });
    
    return {
      orderId: order.id,
      approvalUrl: order.links.find(link => link.rel === 'approve').href
    };
  } catch (error) {
    console.error('PayPal order creation error:', error);
    throw new Error('Failed to create PayPal order');
  }
};

// Create payment order for a class
router.post('/create-payment-order', auth, authorize('parent'), async (req, res) => {
  try {
    const { classId } = req.body;

    if (!classId) {
      return res.status(400).json({ 
        error: 'Class ID is required',
        code: 'MISSING_CLASS_ID'
      });
    }

    // Get class details with proper joins
    const classResult = await query(
      `SELECT c.*, s.parent_id, t.first_name as teacher_first_name, t.last_name as teacher_last_name,
              st.first_name as student_first_name, st.last_name as student_last_name
       FROM classes c
       JOIN students st ON c.student_id = st.id
       JOIN teachers t ON c.teacher_id = t.id
       WHERE c.id = $1 AND c.status = 'scheduled'`,
      [classId]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Class not found or not available for booking',
        code: 'CLASS_NOT_FOUND'
      });
    }

    const classData = classResult.rows[0];

    // Verify parent owns the student
    const parentResult = await query(
      'SELECT id FROM parents WHERE user_id = $1',
      [req.user.id]
    );

    if (parentResult.rows.length === 0 || parentResult.rows[0].id !== classData.parent_id) {
      return res.status(403).json({ 
        error: 'Access denied - you can only pay for your own student\'s classes',
        code: 'ACCESS_DENIED'
      });
    }

    // Check if payment already exists
    const existingPayment = await query(
      'SELECT id, status, paypal_order_id FROM payments WHERE class_id = $1',
      [classId]
    );

    if (existingPayment.rows.length > 0) {
      const payment = existingPayment.rows[0];
      if (payment.status === 'completed') {
        return res.status(409).json({ 
          error: 'Payment already completed for this class',
          code: 'PAYMENT_ALREADY_COMPLETED'
        });
      }
      if (payment.status === 'pending' && payment.paypal_order_id) {
        return res.status(409).json({ 
          error: 'Payment already in progress for this class',
          code: 'PAYMENT_IN_PROGRESS',
          orderId: payment.paypal_order_id
        });
      }
    }

    // Create PayPal order
    const paypalOrder = await createPayPalOrder(
      classData.price_per_lesson,
      classId,
      {
        teacherId: classData.teacher_id,
        studentId: classData.student_id,
        parentId: parentResult.rows[0].id
      }
    );

    // Store payment record
    await query(
      `INSERT INTO payments (class_id, teacher_id, parent_id, amount, status, paypal_order_id, created_at)
       VALUES ($1, $2, $3, $4, 'pending', $5, NOW())
       ON CONFLICT (class_id) 
       DO UPDATE SET paypal_order_id = $5, status = 'pending', updated_at = NOW()`,
      [classId, classData.teacher_id, parentResult.rows[0].id, classData.price_per_lesson, paypalOrder.orderId]
    );

    res.json({
      orderId: paypalOrder.orderId,
      approvalUrl: paypalOrder.approvalUrl,
      amount: classData.price_per_lesson,
      currency: 'ZAR',
      classDetails: {
        subject: classData.subject,
        startTime: classData.start_time,
        endTime: classData.end_time,
        teacherName: `${classData.teacher_first_name} ${classData.teacher_last_name}`,
        studentName: `${classData.student_first_name} ${classData.student_last_name}`
      }
    });

  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ 
      error: 'Failed to create payment order',
      code: 'PAYMENT_ORDER_CREATION_FAILED'
    });
  }
});

// Capture payment after PayPal approval
router.post('/capture-payment', auth, authorize('parent'), async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ 
        error: 'Order ID is required',
        code: 'MISSING_ORDER_ID'
      });
    }

    // Verify order belongs to the current user
    const paymentResult = await query(
      `SELECT p.*, c.student_id, s.parent_id 
       FROM payments p
       JOIN classes c ON p.class_id = c.id
       JOIN students s ON c.student_id = s.id
       WHERE p.paypal_order_id = $1`,
      [orderId]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Payment order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    const payment = paymentResult.rows[0];

    // Verify parent authorization
    const parentResult = await query(
      'SELECT id FROM parents WHERE user_id = $1',
      [req.user.id]
    );

    if (parentResult.rows.length === 0 || parentResult.rows[0].id !== payment.parent_id) {
      return res.status(403).json({ 
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Capture the order
    const { body: capture } = await client.ordersController.ordersCapture({
      id: orderId,
      body: {}
    });

    if (capture.status === 'COMPLETED') {
      // Update payment status
      await query(
        `UPDATE payments 
         SET status = 'completed', paypal_payment_id = $1, payment_date = NOW(), updated_at = NOW()
         WHERE paypal_order_id = $2`,
        [capture.id, orderId]
      );

      // Update class status to confirmed
      await query(
        `UPDATE classes 
         SET status = 'confirmed', updated_at = NOW()
         WHERE id = $1`,
        [payment.class_id]
      );

      res.json({
        success: true,
        paymentId: capture.id,
        status: 'completed',
        message: 'Payment captured successfully'
      });
    } else {
      res.status(400).json({ 
        error: 'Payment capture failed',
        code: 'CAPTURE_FAILED',
        status: capture.status
      });
    }

  } catch (error) {
    console.error('Error capturing payment:', error);
    res.status(500).json({ 
      error: 'Failed to capture payment',
      code: 'PAYMENT_CAPTURE_FAILED'
    });
  }
});

// PayPal webhook handler
router.post('/webhook', 
  webhookRateLimit,
  webhookSecurity,
  express.raw({ type: 'application/json' }),
  verifyPayPalWebhook,
  validateWebhookEvent,
  webhookIdempotency,
  async (req, res) => {
    try {
      const { event_type, resource } = req.body;

      console.log(`Processing PayPal webhook: ${event_type}`, {
        resourceId: resource.id,
        status: resource.status
      });

      switch (event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          await handlePaymentCaptureCompleted(resource);
          break;

        case 'PAYMENT.CAPTURE.DENIED':
          await handlePaymentCaptureDenied(resource);
          break;

        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          await handleSubscriptionActivated(resource);
          break;

        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await handleSubscriptionCancelled(resource);
          break;

        case 'PAYMENT.SALE.COMPLETED':
          await handleSubscriptionPaymentCompleted(resource);
          break;

        default:
          console.log(`Unhandled webhook event type: ${event_type}`);
      }

      res.status(200).json({ received: true });

    } catch (error) {
      console.error('Webhook processing error:', error);
      webhookErrorHandler(error, req, res);
    }
  }
);

// Webhook event handlers
const handlePaymentCaptureCompleted = async (resource) => {
  const customId = resource.purchase_units?.[0]?.custom_id;
  if (!customId) return;

  await query(
    `UPDATE payments 
     SET status = 'completed', paypal_payment_id = $1, payment_date = NOW()
     WHERE class_id = $2 AND status = 'pending'`,
    [resource.id, customId]
  );

  await query(
    `UPDATE classes 
     SET status = 'confirmed'
     WHERE id = $1`,
    [customId]
  );
};

const handlePaymentCaptureDenied = async (resource) => {
  const customId = resource.purchase_units?.[0]?.custom_id;
  if (!customId) return;

  await query(
    `UPDATE payments 
     SET status = 'failed', paypal_payment_id = $1
     WHERE class_id = $2 AND status = 'pending'`,
    [resource.id, customId]
  );
};

const handleSubscriptionActivated = async (resource) => {
  await query(
    `UPDATE subscriptions 
     SET status = 'active', activated_at = NOW()
     WHERE paypal_subscription_id = $1`,
    [resource.id]
  );
};

const handleSubscriptionCancelled = async (resource) => {
  await query(
    `UPDATE subscriptions 
     SET status = 'cancelled', cancelled_at = NOW()
     WHERE paypal_subscription_id = $1`,
    [resource.id]
  );
};

const handleSubscriptionPaymentCompleted = async (resource) => {
  // Find subscription by billing agreement ID or subscription ID
  const subscriptionResult = await query(
    'SELECT id FROM subscriptions WHERE paypal_subscription_id = $1',
    [resource.billing_agreement_id || resource.id]
  );

  if (subscriptionResult.rows.length > 0) {
    await query(
      `INSERT INTO subscription_payments (subscription_id, paypal_payment_id, amount, payment_date, status)
       VALUES ($1, $2, $3, NOW(), 'completed')`,
      [subscriptionResult.rows[0].id, resource.id, parseFloat(resource.amount.total)]
    );
  }
};

// Get payment history (for teachers)
router.get('/history', auth, authorize('teacher'), async (req, res) => {
  try {
    const { startDate, endDate, status, page = 1, limit = 20 } = req.query;

    // Get teacher ID
    const teacherResult = await query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [req.user.id]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const teacherId = teacherResult.rows[0].id;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let queryText = `
      SELECT p.*, c.subject, c.start_time, c.end_time, c.scheduled_date,
             s.first_name as student_first_name, s.last_name as student_last_name,
             par.first_name as parent_first_name, par.last_name as parent_last_name
      FROM payments p
      JOIN classes c ON p.class_id = c.id
      JOIN students s ON c.student_id = s.id
      JOIN parents par ON s.parent_id = par.id
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
      paramIndex++;
    }

    queryText += ` ORDER BY p.payment_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), offset);

    const result = await query(queryText, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM payments p
      JOIN classes c ON p.class_id = c.id
      WHERE p.teacher_id = $1
    `;
    const countParams = [teacherId];
    let countParamIndex = 2;

    if (startDate) {
      countQuery += ` AND p.payment_date >= $${countParamIndex}`;
      countParams.push(startDate);
      countParamIndex++;
    }

    if (endDate) {
      countQuery += ` AND p.payment_date <= $${countParamIndex}`;
      countParams.push(endDate);
      countParamIndex++;
    }

    if (status) {
      countQuery += ` AND p.status = $${countParamIndex}`;
      countParams.push(status);
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      payments: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

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
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_earned,
        COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as total_pending,
        DATE_TRUNC('month', CURRENT_DATE) as current_month,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND payment_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) as current_month_earned,
        COALESCE(AVG(amount) FILTER (WHERE status = 'completed'), 0) as avg_payment_amount
      FROM payments
      WHERE teacher_id = $1`,
      [teacherId]
    );

    // Get recent payment trend (last 6 months)
    const trendResult = await query(
      `SELECT 
        DATE_TRUNC('month', payment_date) as month,
        COUNT(*) as payment_count,
        SUM(amount) as total_amount
      FROM payments
      WHERE teacher_id = $1 AND status = 'completed'
        AND payment_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', payment_date)
      ORDER BY month`,
      [teacherId]
    );

    res.json({
      summary: result.rows[0],
      monthlyTrend: trendResult.rows
    });

  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({ error: 'Failed to fetch payment summary' });
  }
});

// Get payment details by ID
router.get('/:paymentId', auth, async (req, res) => {
  try {
    const { paymentId } = req.params;

    const result = await query(
      `SELECT p.*, c.subject, c.start_time, c.end_time, c.scheduled_date,
              s.first_name as student_first_name, s.last_name as student_last_name,
              t.first_name as teacher_first_name, t.last_name as teacher_last_name,
              par.first_name as parent_first_name, par.last_name as parent_last_name
       FROM payments p
       JOIN classes c ON p.class_id = c.id
       JOIN students s ON c.student_id = s.id
       JOIN teachers t ON c.teacher_id = t.id
       JOIN parents par ON s.parent_id = par.id
       WHERE p.id = $1`,
      [paymentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = result.rows[0];

    // Check authorization
    if (req.user.role === 'teacher') {
      const teacherResult = await query(
        'SELECT id FROM teachers WHERE user_id = $1',
        [req.user.id]
      );
      if (teacherResult.rows.length === 0 || teacherResult.rows[0].id !== payment.teacher_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'parent') {
      const parentResult = await query(
        'SELECT id FROM parents WHERE user_id = $1',
        [req.user.id]
      );
      if (parentResult.rows.length === 0 || parentResult.rows[0].id !== payment.parent_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(payment);

  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
});

module.exports = router;