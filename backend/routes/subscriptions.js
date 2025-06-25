const express = require('express');
const { Client, Environment } = require('@paypal/paypal-server-sdk');
const { query, transaction } = require('../db');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// PayPal client setup
const client = new Client({
  environment: process.env.NODE_ENV === 'production' ? Environment.Production : Environment.Sandbox,
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID,
    oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
  },
});

// Create PayPal subscription plan
router.post('/create-plan', auth, authorize('teacher'), async (req, res) => {
  try {
    const { name, description, pricePerLesson, frequency } = req.body;

    if (!name || !description || !pricePerLesson || !frequency) {
      return res.status(400).json({ error: 'All fields are required' });
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

    // Create PayPal product
    const productRequest = {
      name: `${name} - TaalimX Classes`,
      description: description,
      type: 'SERVICE',
      category: 'EDUCATIONAL',
      home_url: process.env.FRONTEND_URL
    };

    const { body: product } = await client.catalog.productsCreate({
      body: productRequest
    });

    // Create PayPal plan
    const planRequest = {
      product_id: product.id,
      name: name,
      description: description,
      status: 'ACTIVE',
      billing_cycles: [{
        frequency: {
          interval_unit: frequency.toUpperCase(), // WEEK, MONTH
          interval_count: 1
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0, // Infinite
        pricing_scheme: {
          fixed_price: {
            value: pricePerLesson.toFixed(2),
            currency_code: 'ZAR'
          }
        }
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: '0.00',
          currency_code: 'ZAR'
        },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3
      }
    };

    const { body: plan } = await client.subscriptions.plansCreate({
      body: planRequest
    });

    // Store subscription plan in database
    const result = await query(
      `INSERT INTO subscription_plans (teacher_id, paypal_plan_id, paypal_product_id, name, description, price_per_lesson, frequency, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
       RETURNING *`,
      [teacherId, plan.id, product.id, name, description, pricePerLesson, frequency]
    );

    res.status(201).json({
      plan: result.rows[0],
      paypalPlanId: plan.id
    });

  } catch (error) {
    console.error('Error creating subscription plan:', error);
    res.status(500).json({ error: 'Failed to create subscription plan' });
  }
});

// Create subscription for a student
router.post('/create-subscription', auth, authorize('parent'), async (req, res) => {
  try {
    const { planId, studentId, startDate } = req.body;

    if (!planId || !studentId) {
      return res.status(400).json({ error: 'Plan ID and Student ID are required' });
    }

    // Verify parent owns the student
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

    // Get subscription plan
    const planResult = await query(
      'SELECT * FROM subscription_plans WHERE id = $1 AND status = $2',
      [planId, 'active']
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription plan not found or inactive' });
    }

    const plan = planResult.rows[0];

    // Create PayPal subscription
    const subscriptionRequest = {
      plan_id: plan.paypal_plan_id,
      start_time: startDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Start tomorrow if not specified
      subscriber: {
        name: {
          given_name: req.user.first_name || 'Parent',
          surname: req.user.last_name || 'User'
        },
        email_address: req.user.email
      },
      application_context: {
        brand_name: 'TaalimX',
        locale: 'en-ZA',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        },
        return_url: `${process.env.FRONTEND_URL}/parent/subscriptions?status=success`,
        cancel_url: `${process.env.FRONTEND_URL}/parent/subscriptions?status=cancelled`
      },
      custom_id: `student_${studentId}_plan_${planId}`
    };

    const { body: subscription } = await client.subscriptions.subscriptionsCreate({
      body: subscriptionRequest
    });

    // Store subscription in database
    const result = await query(
      `INSERT INTO subscriptions (plan_id, student_id, parent_id, paypal_subscription_id, status, start_date)
       VALUES ($1, $2, $3, $4, 'pending', $5)
       RETURNING *`,
      [planId, studentId, parentId, subscription.id, startDate || new Date(Date.now() + 24 * 60 * 60 * 1000)]
    );

    res.json({
      subscription: result.rows[0],
      approvalUrl: subscription.links.find(link => link.rel === 'approve')?.href
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Activate subscription after PayPal approval
router.post('/activate-subscription', auth, authorize('parent'), async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    // Get subscription details from PayPal
    const getRequest = new paypal.subscriptions.SubscriptionsGetRequest(subscriptionId);
    const subscription = await client.execute(getRequest);

    if (subscription.result.status === 'ACTIVE') {
      // Update subscription status in database
      await query(
        `UPDATE subscriptions 
         SET status = 'active', activated_at = NOW()
         WHERE paypal_subscription_id = $1`,
        [subscriptionId]
      );

      res.json({ 
        success: true, 
        status: 'active',
        subscriptionId: subscriptionId
      });
    } else {
      res.status(400).json({ error: 'Subscription is not active on PayPal' });
    }

  } catch (error) {
    console.error('Error activating subscription:', error);
    res.status(500).json({ error: 'Failed to activate subscription' });
  }
});

// Cancel subscription
router.post('/cancel-subscription', auth, async (req, res) => {
  try {
    const { subscriptionId, reason } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    // Verify user owns the subscription
    let hasPermission = false;
    
    if (req.user.role === 'parent') {
      const parentResult = await query(
        `SELECT s.id FROM subscriptions s 
         JOIN parents p ON s.parent_id = p.id 
         WHERE s.paypal_subscription_id = $1 AND p.user_id = $2`,
        [subscriptionId, req.user.id]
      );
      hasPermission = parentResult.rows.length > 0;
    } else if (req.user.role === 'teacher') {
      const teacherResult = await query(
        `SELECT s.id FROM subscriptions s 
         JOIN subscription_plans sp ON s.plan_id = sp.id 
         JOIN teachers t ON sp.teacher_id = t.id 
         WHERE s.paypal_subscription_id = $1 AND t.user_id = $2`,
        [subscriptionId, req.user.id]
      );
      hasPermission = teacherResult.rows.length > 0;
    }

    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Cancel subscription on PayPal
    const cancelRequest = new paypal.subscriptions.SubscriptionsCancelRequest(subscriptionId);
    cancelRequest.requestBody({
      reason: reason || 'User requested cancellation'
    });

    await client.execute(cancelRequest);

    // Update subscription status in database
    await query(
      `UPDATE subscriptions 
       SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = $2
       WHERE paypal_subscription_id = $1`,
      [subscriptionId, reason]
    );

    res.json({ success: true, status: 'cancelled' });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Get subscriptions for parent or teacher
router.get('/', auth, async (req, res) => {
  try {
    let queryText;
    let queryParams = [];

    if (req.user.role === 'parent') {
      const parentResult = await query(
        'SELECT id FROM parents WHERE user_id = $1',
        [req.user.id]
      );

      if (parentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Parent profile not found' });
      }

      const parentId = parentResult.rows[0].id;

      queryText = `
        SELECT s.*, sp.name as plan_name, sp.description as plan_description, 
               sp.price_per_lesson, sp.frequency,
               st.first_name as student_first_name, st.last_name as student_last_name,
               t.first_name as teacher_first_name, t.last_name as teacher_last_name
        FROM subscriptions s
        JOIN subscription_plans sp ON s.plan_id = sp.id
        JOIN students st ON s.student_id = st.id
        JOIN teachers t ON sp.teacher_id = t.id
        WHERE s.parent_id = $1
        ORDER BY s.created_at DESC
      `;
      queryParams = [parentId];

    } else if (req.user.role === 'teacher') {
      const teacherResult = await query(
        'SELECT id FROM teachers WHERE user_id = $1',
        [req.user.id]
      );

      if (teacherResult.rows.length === 0) {
        return res.status(404).json({ error: 'Teacher profile not found' });
      }

      const teacherId = teacherResult.rows[0].id;

      queryText = `
        SELECT s.*, sp.name as plan_name, sp.description as plan_description, 
               sp.price_per_lesson, sp.frequency,
               st.first_name as student_first_name, st.last_name as student_last_name,
               p.first_name as parent_first_name, p.last_name as parent_last_name
        FROM subscriptions s
        JOIN subscription_plans sp ON s.plan_id = sp.id
        JOIN students st ON s.student_id = st.id
        JOIN parents p ON s.parent_id = p.id
        WHERE sp.teacher_id = $1
        ORDER BY s.created_at DESC
      `;
      queryParams = [teacherId];
    }

    const result = await query(queryText, queryParams);
    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Get subscription plans for a teacher
router.get('/plans', auth, authorize('teacher'), async (req, res) => {
  try {
    const teacherResult = await query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [req.user.id]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const teacherId = teacherResult.rows[0].id;

    const result = await query(
      `SELECT sp.*, COUNT(s.id) as active_subscriptions
       FROM subscription_plans sp
       LEFT JOIN subscriptions s ON sp.id = s.plan_id AND s.status = 'active'
       WHERE sp.teacher_id = $1
       GROUP BY sp.id
       ORDER BY sp.created_at DESC`,
      [teacherId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Webhook handler for subscription events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = req.body;
    
    console.log('PayPal subscription webhook received:', event.event_type);
    
    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await query(
          `UPDATE subscriptions 
           SET status = 'active', activated_at = NOW()
           WHERE paypal_subscription_id = $1`,
          [event.resource.id]
        );
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await query(
          `UPDATE subscriptions 
           SET status = 'cancelled', cancelled_at = NOW()
           WHERE paypal_subscription_id = $1`,
          [event.resource.id]
        );
        break;
        
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await query(
          `UPDATE subscriptions 
           SET status = 'suspended', suspended_at = NOW()
           WHERE paypal_subscription_id = $1`,
          [event.resource.id]
        );
        break;
        
      case 'PAYMENT.SALE.COMPLETED':
        // Record successful subscription payment
        const subscriptionId = event.resource.billing_agreement_id;
        if (subscriptionId) {
          await query(
            `INSERT INTO subscription_payments (subscription_id, paypal_payment_id, amount, payment_date, status)
             SELECT s.id, $2, $3, NOW(), 'completed'
             FROM subscriptions s
             WHERE s.paypal_subscription_id = $1`,
            [subscriptionId, event.resource.id, event.resource.amount.total]
          );
        }
        break;
        
      default:
        console.log(`Unhandled subscription event type: ${event.event_type}`);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Subscription webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;