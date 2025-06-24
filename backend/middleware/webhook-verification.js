const crypto = require('crypto');

// PayPal webhook verification middleware
const verifyPayPalWebhook = (req, res, next) => {
  try {
    // Get headers
    const authAlgo = req.headers['paypal-auth-algo'];
    const transmission = req.headers['paypal-transmission-id'];
    const certId = req.headers['paypal-cert-id'];
    const signature = req.headers['paypal-transmission-sig'];
    const timestamp = req.headers['paypal-transmission-time'];

    if (!authAlgo || !transmission || !certId || !signature || !timestamp) {
      console.log('Missing PayPal webhook headers');
      return res.status(400).json({ error: 'Missing webhook verification headers' });
    }

    // In production, you should verify the webhook signature
    // For now, we'll log the webhook and continue
    console.log('PayPal webhook verification:', {
      authAlgo,
      transmission,
      certId,
      timestamp,
      body: req.body
    });

    // TODO: Implement proper webhook verification
    // This requires downloading PayPal's public certificate and verifying the signature
    // See: https://developer.paypal.com/docs/api/webhooks/v1/#webhooks-verification

    next();
  } catch (error) {
    console.error('Webhook verification error:', error);
    return res.status(400).json({ error: 'Webhook verification failed' });
  }
};

// Rate limiting for webhooks
const webhookRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // Simple in-memory rate limiting (in production, use Redis)
  if (!global.webhookRateLimits) {
    global.webhookRateLimits = new Map();
  }

  const requests = global.webhookRateLimits.get(ip) || [];
  const recentRequests = requests.filter(time => now - time < 60000); // Last minute

  if (recentRequests.length >= 100) { // Max 100 requests per minute
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  recentRequests.push(now);
  global.webhookRateLimits.set(ip, recentRequests);
  
  next();
};

// Security headers for webhook endpoints
const webhookSecurity = (req, res, next) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check content type
  if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
    return res.status(400).json({ error: 'Invalid content type' });
  }

  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
};

// Webhook event validation
const validateWebhookEvent = (req, res, next) => {
  const { event_type, resource } = req.body;

  if (!event_type || !resource) {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  // List of allowed event types
  const allowedEvents = [
    'PAYMENT.CAPTURE.COMPLETED',
    'PAYMENT.CAPTURE.DENIED',
    'BILLING.SUBSCRIPTION.ACTIVATED',
    'BILLING.SUBSCRIPTION.CANCELLED',
    'BILLING.SUBSCRIPTION.SUSPENDED',
    'PAYMENT.SALE.COMPLETED'
  ];

  if (!allowedEvents.includes(event_type)) {
    console.log(`Unhandled webhook event type: ${event_type}`);
    // Still return success to acknowledge receipt
    return res.status(200).json({ received: true, message: 'Event type not handled' });
  }

  next();
};

// Idempotency check for webhook events
const webhookIdempotency = async (req, res, next) => {
  const eventId = req.body.id;
  
  if (!eventId) {
    return res.status(400).json({ error: 'Missing event ID' });
  }

  try {
    // Check if we've already processed this event
    const { query } = require('../db');
    const result = await query(
      'SELECT id FROM processed_webhooks WHERE event_id = $1',
      [eventId]
    );

    if (result.rows.length > 0) {
      console.log(`Duplicate webhook event: ${eventId}`);
      return res.status(200).json({ received: true, message: 'Event already processed' });
    }

    // Store event ID to prevent duplicate processing
    await query(
      'INSERT INTO processed_webhooks (event_id, event_type, processed_at) VALUES ($1, $2, NOW())',
      [eventId, req.body.event_type]
    );

    next();
  } catch (error) {
    console.error('Idempotency check error:', error);
    // Continue processing even if idempotency check fails
    next();
  }
};

// Error handling for webhook processing
const webhookErrorHandler = (error, req, res, next) => {
  console.error('Webhook processing error:', error);
  
  // Log the error but return success to PayPal
  // This prevents PayPal from retrying the webhook
  res.status(200).json({ 
    received: true, 
    error: 'Processing error occurred',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  verifyPayPalWebhook,
  webhookRateLimit,
  webhookSecurity,
  validateWebhookEvent,
  webhookIdempotency,
  webhookErrorHandler
};