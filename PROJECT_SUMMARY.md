# TaalimX - Islamic Education Platform

## Project Overview

TaalimX is a comprehensive online platform that connects vetted Islamic teachers with students for madrasa education. The platform ensures quality education through thorough teacher vetting, provides easy class scheduling, and handles secure payment processing.

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: React Hooks
- **Form Handling**: React Hook Form with Zod validation
- **API Client**: Axios
- **Payment**: Stripe
- **Hosting**: Vercel

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **Authentication**: JWT
- **File Storage**: Local filesystem
- **Payment Processing**: Stripe
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Hosting**: Render

### Infrastructure
- **CI/CD**: GitHub Actions
- **Database Hosting**: Neon
- **Backend Hosting**: Render
- **Frontend Hosting**: Vercel
- **Version Control**: Git/GitHub

## Key Features

### For Teachers
1. **Profile Management**
   - Comprehensive onboarding process
   - Document upload (CV, ID, Police clearance)
   - Qualification management
   - Status tracking (pending, interviewed, approved)

2. **Class Management**
   - View scheduled classes
   - Complete/cancel classes
   - Track earnings
   - Monthly payment summaries

3. **Earnings Dashboard**
   - Monthly earnings overview
   - Payment status tracking
   - Detailed payment history

### For Parents
1. **Student Management**
   - Add multiple children
   - Track each child's progress
   - Manage student profiles
   - Set Arabic recitation levels

2. **Class Booking**
   - Browse approved teachers
   - Schedule classes for children
   - View upcoming classes
   - Cancel bookings if needed

3. **Payment Processing**
   - Secure Stripe integration
   - Pay per lesson
   - Payment history
   - Automated receipts

### For Platform Administrators
1. **Teacher Vetting**
   - Review teacher applications
   - Schedule interviews
   - Approve/reject teachers
   - Monitor teacher performance

2. **Platform Monitoring**
   - User activity tracking
   - Revenue reports
   - System health monitoring
   - Security audit logs

## Security Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (RBAC)
   - Secure password hashing (bcrypt)
   - Token expiration management

2. **Data Protection**
   - Input validation and sanitization
   - SQL injection prevention
   - XSS protection
   - CORS configuration

3. **File Upload Security**
   - File type validation
   - Size restrictions
   - Secure storage
   - Access control

4. **API Security**
   - Rate limiting
   - Helmet security headers
   - HTTPS enforcement
   - Request validation

## Database Schema

The platform uses a PostgreSQL database with the following key tables:

1. **users**: Authentication and role management
2. **teachers**: Teacher profiles and status
3. **parents**: Parent profiles
4. **students**: Student information and levels
5. **classes**: Class scheduling and management
6. **payments**: Transaction records
7. **teacher_qualifications**: Educational background
8. **teacher_interviews**: Vetting process tracking

## API Architecture

The API follows RESTful principles with the following main endpoints:

- `/api/auth/*` - Authentication and user management
- `/api/teachers/*` - Teacher profile and operations
- `/api/parents/*` - Parent profile management
- `/api/students/*` - Student management
- `/api/classes/*` - Class scheduling and management
- `/api/payments/*` - Payment processing
- `/api/uploads/*` - File upload handling

## Deployment Architecture

```
[Client Browser] -> [Vercel CDN] -> [Next.js Frontend]
                                           |
                                           v
                               [Render API Server]
                                           |
                                           v
                              [Neon PostgreSQL Database]
```

## Development Workflow

1. **Local Development**
   - Clone repository
   - Install dependencies
   - Set up environment variables
   - Run database migrations
   - Start development servers

2. **Testing**
   - Unit tests with Jest
   - API testing with Supertest
   - Component testing with React Testing Library
   - End-to-end testing (planned)

3. **CI/CD Pipeline**
   - Automated testing on push
   - Linting and code quality checks
   - Automated deployment to staging
   - Production deployment on merge to main

## Environment Configuration

### Backend Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook verification
- `FRONTEND_URL` - Frontend URL for CORS
- `PORT` - Server port
- `NODE_ENV` - Environment (development/production)

### Frontend Environment Variables
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key

## Project Structure

```
taalimx/
├── frontend/                # Next.js frontend application
│   ├── src/
│   │   ├── app/            # Page components and routing
│   │   ├── components/     # Reusable UI components
│   │   └── lib/           # Utility functions
│   └── public/            # Static assets
├── backend/               # Express.js API server
│   ├── db/               # Database schema and migrations
│   ├── middleware/       # Custom middleware
│   ├── routes/          # API route handlers
│   └── uploads/         # File storage directory
└── docs/                # Additional documentation
```

## Performance Considerations

1. **Frontend Optimization**
   - Static generation where possible
   - Image optimization
   - Code splitting
   - Lazy loading components

2. **Backend Optimization**
   - Database connection pooling
   - Query optimization with indexes
   - Caching strategies (planned)
   - Rate limiting

3. **Scalability**
   - Horizontal scaling on Render
   - Database read replicas (future)
   - CDN for static assets
   - Load balancing

## Monitoring and Maintenance

1. **Error Tracking**
   - Server error logging
   - Client-side error boundaries
   - Structured logging format

2. **Performance Monitoring**
   - API response times
   - Database query performance
   - Frontend Core Web Vitals

3. **Security Monitoring**
   - Failed login attempts
   - Unusual activity detection
   - Regular security audits

## Future Enhancements

1. **Features**
   - Video conferencing integration
   - Real-time chat system
   - Mobile applications
   - Progress tracking dashboard
   - Homework submission system
   - Parent-teacher messaging

2. **Technical Improvements**
   - GraphQL API (optional)
   - WebSocket for real-time features
   - Redis caching layer
   - Elasticsearch for search
   - Automated testing expansion

3. **Business Features**
   - Multiple payment methods
   - Subscription plans
   - Referral system
   - Analytics dashboard
   - Multi-language support

## Support and Documentation

1. **API Documentation**: `/API.md`
2. **Deployment Guide**: `/DEPLOYMENT.md`
3. **Project Structure**: `/PROJECT_STRUCTURE.md`
4. **Database Queries**: `/backend/db/queries.sql`
5. **README**: `/README.md`

## Contact and Support

For technical support or questions about the platform:
- GitHub Issues: [Create an issue](https://github.com/your-org/taalimx/issues)
- Email: support@taalimx.com
- Documentation: See `/docs` directory

## License

This project is proprietary software. All rights reserved.

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready
