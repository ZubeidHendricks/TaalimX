# TaalimX Deployment Guide

This guide covers deploying the TaalimX platform using Neon (database), Render (backend), and Vercel (frontend).

## Prerequisites

- GitHub account
- Neon account (https://neon.tech)
- Render account (https://render.com)
- Vercel account (https://vercel.com)
- Stripe account (https://stripe.com)

## Step 1: Database Setup (Neon)

1. Create a new Neon project
2. Create a new database
3. Copy the connection string (it should look like: `postgresql://user:password@host/database?sslmode=require`)
4. Run the migration script locally:
   ```bash
   cd backend
   npm install
   DATABASE_URL="your-neon-connection-string" npm run migrate
   ```

## Step 2: Backend Deployment (Render)

1. Push your code to GitHub
2. Go to Render Dashboard and click "New +"
3. Select "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - **Name**: taalimx-api
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Select your preferred plan

6. Add Environment Variables:
   ```
   DATABASE_URL=your-neon-connection-string
   NODE_ENV=production
   JWT_SECRET=your-secure-jwt-secret
   FRONTEND_URL=https://your-vercel-app.vercel.app
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

7. Click "Create Web Service"

## Step 3: Frontend Deployment (Vercel)

1. Go to Vercel Dashboard
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-render-service.onrender.com
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

6. Click "Deploy"

## Step 4: Configure Stripe

1. Go to Stripe Dashboard
2. Create a new product for class payments
3. Set up webhook endpoint:
   - URL: `https://your-render-service.onrender.com/api/payments/webhook`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`

4. Copy the webhook signing secret and add it to your Render environment variables

## Step 5: Post-Deployment Configuration

### 1. Update Admin Password

After deployment, immediately login as admin and change the password:

1. Go to `https://your-frontend-url.vercel.app/sign-in`
2. Login with:
   - Email: `admin@taalimx.com`
   - Password: `changeme123`
3. Change password immediately

### 2. Configure Domain Names (Optional)

#### For Backend (Render):
1. Go to your service settings
2. Add a custom domain
3. Update DNS records as instructed

#### For Frontend (Vercel):
1. Go to project settings
2. Add domain
3. Configure DNS

### 3. Set up SSL Certificates

Both Render and Vercel provide automatic SSL certificates. Make sure to:
- Force HTTPS redirects
- Update your environment variables to use HTTPS URLs

## Monitoring and Maintenance

### Database Monitoring (Neon)
- Monitor connection counts
- Check query performance
- Set up backup schedules

### Backend Monitoring (Render)
- Set up health checks
- Configure alerts for downtime
- Monitor logs for errors

### Frontend Monitoring (Vercel)
- Check build logs
- Monitor performance metrics
- Set up error tracking

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL is correct
   - Check if SSL is required
   - Ensure database is not sleeping (Neon free tier)

2. **CORS Errors**
   - Verify FRONTEND_URL in backend environment variables
   - Check if the backend URL in frontend is correct

3. **Payment Issues**
   - Verify Stripe keys are correct
   - Check webhook configuration
   - Ensure proper error handling in payment flow

4. **Authentication Issues**
   - Verify JWT_SECRET is the same across environments
   - Check token expiration settings
   - Ensure proper CORS configuration

## Scaling Considerations

### Database Scaling
- Upgrade Neon plan for more resources
- Implement connection pooling
- Add read replicas for heavy read operations

### Backend Scaling
- Upgrade Render plan
- Implement caching (Redis)
- Use CDN for static assets

### Frontend Scaling
- Vercel automatically scales
- Implement image optimization
- Use static generation where possible

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS everywhere
- [ ] Set up proper CORS policies
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Secure file upload validation
- [ ] Input sanitization
- [ ] SQL injection protection
- [ ] XSS protection

## Backup and Recovery

### Database Backups
- Enable automatic backups in Neon
- Test restore procedures regularly
- Keep backup retention policy

### Code Backups
- Use Git for version control
- Regular commits and pushes
- Tag releases

### File Backups
- Backup uploaded files regularly
- Consider using cloud storage (S3, Cloudinary)

## Maintenance Tasks

### Regular Tasks
1. Update dependencies
2. Check for security vulnerabilities
3. Monitor error logs
4. Clean up old sessions
5. Archive completed classes

### Monthly Tasks
1. Review user feedback
2. Analyze performance metrics
3. Update documentation
4. Security audit

## Support and Updates

For issues or questions:
1. Check the documentation
2. Review error logs
3. Contact support channels

Keep the platform updated with:
1. Security patches
2. Dependency updates
3. New features
4. Bug fixes

---

Remember to always test changes in a staging environment before deploying to production!
