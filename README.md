# TaalimX - Islamic Education Platform

TaalimX is an online platform that connects vetted Islamic teachers with students for madrasa education. The platform ensures safety through thorough teacher vetting and provides easy payment processing.

## Tech Stack

- **Frontend**: Next.js (hosted on Vercel)
- **Backend**: Node.js/Express (hosted on Render)
- **Database**: Neon (PostgreSQL)
- **Payment Processing**: Stripe
- **Authentication**: JWT

## Project Structure

```
taalimx/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # Next.js app router pages
│   │   ├── components/      # Reusable UI components
│   │   └── lib/            # Utility functions
│   └── public/             # Static assets
├── backend/                # Express API server
│   ├── db/                 # Database schema and connections
│   ├── middleware/         # Express middleware
│   ├── routes/            # API routes
│   └── uploads/           # File uploads directory
└── README.md
```

## Features

### For Teachers
- Profile creation with ID verification and police clearance
- Document upload (CV, qualifications)
- Interview and vetting system
- Class management
- Monthly payment tracking
- Earnings dashboard

### For Parents
- Student registration
- Teacher browsing
- Class booking
- Payment processing
- Progress tracking

### For Admins
- Teacher approval system
- Interview scheduling
- Platform monitoring

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database (Neon account)
- Stripe account
- Git

### Database Setup

1. Create a Neon account at https://neon.tech
2. Create a new database
3. Run the schema file:
   ```sql
   -- Execute the SQL from backend/db/schema.sql
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your credentials:
   ```
   DATABASE_URL=your_neon_database_url
   JWT_SECRET=your_jwt_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   FRONTEND_URL=http://localhost:3001
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

4. Update `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3000
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Backend Deployment (Render)

1. Create a Render account
2. Connect your GitHub repository
3. Create a new Web Service
4. Select the repository and configure:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
5. Add environment variables in Render dashboard
6. Deploy

### Frontend Deployment (Vercel)

1. Create a Vercel account
2. Import your GitHub repository
3. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: Your Render API URL
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
5. Deploy

### Database (Neon)

1. Use the connection string from Neon dashboard
2. Enable SSL mode
3. Add the connection string to Render environment variables

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Teachers
- `GET /api/teachers/profile` - Get teacher profile
- `PUT /api/teachers/profile` - Update teacher profile
- `POST /api/teachers/qualifications` - Add qualification
- `GET /api/teachers/classes` - Get teacher's classes
- `GET /api/teachers/earnings` - Get earnings

### Parents
- `GET /api/students` - Get parent's students
- `POST /api/students` - Add new student
- `GET /api/parents/profile` - Get parent profile

### Classes
- `POST /api/classes` - Create new class
- `GET /api/classes` - Get classes
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Cancel class

### Payments
- `POST /api/payments/create-payment-intent` - Create Stripe payment
- `POST /api/payments/webhook` - Stripe webhook handler

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Role-based authorization
- Input validation with Joi
- Rate limiting
- CORS protection
- Helmet security headers
- File upload validation

## Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@taalimx.com or open an issue in the GitHub repository.

## Acknowledgments

- Thanks to all contributors
- Special thanks to the Islamic education community
- Built with love using open-source technologies

## Future Enhancements

- Video call integration for online classes
- Real-time chat between teachers and parents
- Mobile applications (iOS/Android)
- Advanced reporting and analytics
- Multi-language support
- Automated scheduling system
- Parent-teacher messaging system
- Student progress tracking
- Homework submission system
- Parent reviews and ratings
