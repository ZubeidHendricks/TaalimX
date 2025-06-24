# PayPal Migration Guide for TaalimX

This guide provides complete instructions for migrating from Stripe to PayPal payment processing in the TaalimX platform.

## Overview

The migration replaces Stripe's payment intent-based system with PayPal's order-based payment system, providing:
- Simplified payment flow for South African users
- ZAR currency support
- Reduced transaction fees
- Better local payment method support

## Changes Made

### Backend Changes

#### 1. Package Dependencies
- **Removed**: `stripe: ^14.11.0`
- **Added**: `@paypal/checkout-server-sdk: ^1.0.3`

#### 2. Payment Routes (`backend/routes/payments.js`)
- **Replaced**: `/create-payment-intent` → `/create-order`
- **Replaced**: `/webhook` (Stripe) → `/webhook` (PayPal) + `/capture-order`
- **Updated**: Payment processing logic to use PayPal orders
- **Added**: Order capture functionality

#### 3. Database Schema
- **Updated**: `payments` table column `stripe_payment_id` → `paypal_order_id`
- **Added**: Database migration script (`backend/db/migrate-paypal.sql`)

#### 4. Environment Variables
```bash
# Removed Stripe variables
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

# Added PayPal variables
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_WEBHOOK_ID
```

### Frontend Changes

#### 1. Package Dependencies
- **Removed**: `stripe: ^14.11.0`, `@stripe/stripe-js: ^2.2.2`
- **Added**: `@paypal/react-paypal-js: ^8.1.3`

#### 2. Booking Flow (`frontend/src/app/parent/book-class/page.tsx`)
- **Updated**: Payment processing to create PayPal orders
- **Changed**: Redirects to PayPal checkout instead of Stripe Elements
- **Modified**: UI text to reference PayPal

#### 3. New Payment Pages
- **Added**: `/parent/payment-success/page.tsx` - Handles successful payments
- **Added**: `/parent/payment-cancelled/page.tsx` - Handles cancelled payments

#### 4. Environment Variables
```bash
# Removed
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Added
NEXT_PUBLIC_PAYPAL_CLIENT_ID
```

## Setup Instructions

### 1. PayPal Developer Account Setup

1. **Create PayPal Developer Account**
   - Go to [PayPal Developer Portal](https://developer.paypal.com/)
   - Sign up or log in with your PayPal account

2. **Create Application**
   - Navigate to "My Apps & Credentials"
   - Click "Create App"
   - Choose "Default Application" type
   - Select "Sandbox" for testing, "Live" for production

3. **Get Credentials**
   - Copy the **Client ID** and **Client Secret**
   - Note the **Webhook ID** if setting up webhooks

### 2. Environment Configuration

#### Backend `.env` file:
```bash
# PayPal Configuration
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_WEBHOOK_ID=your-paypal-webhook-id

# Other existing variables...
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:3001
NODE_ENV=development
```

#### Frontend `.env.local` file:
```bash
# Frontend Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-client-id
```

### 3. Database Migration

Run the migration script to update the database schema:

```bash
# Connect to your PostgreSQL database and run:
psql -d your_database -f backend/db/migrate-paypal.sql

# Or using the Node.js migration (recommended):
cd backend
npm run migrate-paypal
```

### 4. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend  
cd frontend
npm install
```

### 5. PayPal Webhook Setup (Optional)

1. **In PayPal Developer Portal**:
   - Go to your application
   - Navigate to "Webhooks"
   - Add webhook URL: `https://your-domain.com/api/payments/webhook`
   - Select events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`

2. **Update environment**:
   ```bash
   PAYPAL_WEBHOOK_ID=your-webhook-id-from-paypal
   ```

## Payment Flow

### New Payment Process:

1. **User books class** → Creates class in database
2. **System creates PayPal order** → Returns order ID
3. **User redirects to PayPal** → Completes payment on PayPal
4. **PayPal redirects back** → User returns to success/cancel page
5. **System captures payment** → Confirms payment and updates database

### API Endpoints:

- `POST /api/payments/create-order` - Creates PayPal order
- `POST /api/payments/capture-order` - Captures completed payment
- `POST /api/payments/webhook` - Handles PayPal webhooks
- `GET /api/payments/history` - Payment history (unchanged)
- `GET /api/payments/summary` - Payment summary (unchanged)

## Testing

### 1. PayPal Sandbox Testing

Use PayPal's sandbox environment for testing:
- Set `NODE_ENV=development` to use sandbox
- Use sandbox test accounts from PayPal Developer Portal
- Test with sandbox PayPal credentials

### 2. Test Payment Flow

1. Book a class as a parent
2. Verify PayPal order creation
3. Complete payment on PayPal sandbox
4. Verify payment capture and database update
5. Check payment history and teacher earnings

## Production Deployment

### 1. PayPal Live Environment

1. **Switch to Live credentials**:
   - Create live PayPal application
   - Update environment variables with live credentials
   - Set `NODE_ENV=production`

2. **Update webhook URLs**:
   - Point webhooks to production domain
   - Update webhook verification

### 2. Security Considerations

- **Never expose** PayPal client secret on frontend
- **Always verify** webhook signatures in production
- **Use HTTPS** for all PayPal communication
- **Validate** all payment amounts server-side

## Rollback Plan

If issues arise, rollback steps:

1. **Revert code changes**:
   ```bash
   git revert <commit-hash>
   ```

2. **Restore database**:
   ```sql
   -- Add back Stripe column
   ALTER TABLE payments ADD COLUMN stripe_payment_id VARCHAR(255);
   -- Update payment method back to stripe
   UPDATE payments SET payment_method = 'stripe' WHERE payment_method = 'paypal';
   ```

3. **Restore environment variables**:
   - Switch back to Stripe credentials
   - Update frontend to use Stripe

## Troubleshooting

### Common Issues:

1. **PayPal order creation fails**:
   - Check client ID/secret
   - Verify sandbox/live environment
   - Check currency format (ZAR)

2. **Payment capture fails**:
   - Verify order ID matches
   - Check order status before capture
   - Ensure user authorization

3. **Webhook verification fails**:
   - Verify webhook ID
   - Check endpoint URL accessibility
   - Validate webhook signature

### Debug Mode:

Enable detailed logging:
```javascript
// In backend/routes/payments.js
console.log('PayPal order creation:', order);
console.log('Payment capture result:', capture);
```

## Support

For issues or questions:
- Check PayPal Developer Documentation: https://developer.paypal.com/docs/
- Review PayPal SDK documentation: https://github.com/paypal/Checkout-NodeJS-SDK
- Test in PayPal sandbox environment first

## Summary

The migration successfully replaces Stripe with PayPal while maintaining the same core functionality:
- ✅ Class booking with payment
- ✅ Teacher earnings tracking  
- ✅ Payment history and summaries
- ✅ Webhook handling for payment confirmation
- ✅ ZAR currency support for South African market

The new system provides a more streamlined payment experience for South African users while reducing transaction fees and improving local payment method support.