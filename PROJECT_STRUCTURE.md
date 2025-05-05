# TaalimX Project Structure

```
taalimx/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI/CD workflow
├── backend/
│   ├── db/
│   │   ├── index.js              # Database connection and helpers
│   │   ├── migrate.js            # Database migration script
│   │   └── schema.sql            # Database schema definition
│   ├── middleware/
│   │   └── auth.js               # Authentication middleware
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   ├── teachers.js           # Teacher-related routes
│   │   ├── parents.js            # Parent-related routes
│   │   ├── students.js           # Student management routes
│   │   ├── classes.js            # Class scheduling routes
│   │   ├── payments.js           # Payment processing routes
│   │   └── uploads.js            # File upload routes
│   ├── tests/
│   │   └── auth.test.js          # Authentication tests
│   ├── uploads/                   # Directory for uploaded files
│   ├── .env.example              # Environment variables template
│   ├── index.js                  # Main server file
│   └── package.json              # Backend dependencies
├── frontend/
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── __tests__/
│   │   │   └── Home.test.tsx     # Homepage tests
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── sign-in/
│   │   │   │   │   └── page.tsx  # Sign in page
│   │   │   │   └── sign-up/
│   │   │   │       └── page.tsx  # Sign up page
│   │   │   ├── parent/
│   │   │   │   └── dashboard/
│   │   │   │       └── page.tsx  # Parent dashboard
│   │   │   ├── teacher/
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx  # Teacher dashboard
│   │   │   │   └── onboarding/
│   │   │   │       └── page.tsx  # Teacher onboarding
│   │   │   ├── globals.css       # Global styles
│   │   │   ├── layout.tsx        # Root layout
│   │   │   └── page.tsx          # Homepage
│   │   ├── components/
│   │   │   └── ui/               # Reusable UI components
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── input.tsx
│   │   │       ├── label.tsx
│   │   │       ├── progress.tsx
│   │   │       ├── radio-group.tsx
│   │   │       ├── select.tsx
│   │   │       ├── toast.tsx
│   │   │       ├── toaster.tsx
│   │   │       └── use-toast.ts
│   │   └── lib/
│   │       └── utils.ts          # Utility functions
│   ├── .env.example              # Frontend environment template
│   ├── jest.setup.js             # Jest configuration
│   ├── next.config.js            # Next.js configuration
│   ├── package.json              # Frontend dependencies
│   ├── tailwind.config.ts        # Tailwind CSS configuration
│   └── tsconfig.json             # TypeScript configuration
├── .gitignore                    # Git ignore file
├── DEPLOYMENT.md                 # Deployment documentation
├── PROJECT_STRUCTURE.md          # This file
├── README.md                     # Project documentation
├── render.yaml                   # Render deployment config
└── vercel.json                   # Vercel deployment config
```

## Key Files and Their Purposes

### Backend Files

- **`index.js`**: Main Express server setup with middleware and route configuration
- **`db/schema.sql`**: Complete database schema with tables, indexes, and triggers
- **`db/migrate.js`**: Database migration script that creates schema and seed data
- **`middleware/auth.js`**: JWT authentication and role-based authorization
- **`routes/*.js`**: API endpoints organized by feature (auth, teachers, students, etc.)

### Frontend Files

- **`app/layout.tsx`**: Root layout with global providers and metadata
- **`app/page.tsx`**: Homepage with hero section and feature highlights
- **`app/(auth)/*`**: Authentication pages for sign-in and sign-up
- **`app/teacher/*`**: Teacher-specific pages including dashboard and onboarding
- **`app/parent/*`**: Parent-specific pages for managing students and classes
- **`components/ui/*`**: Reusable UI components built with Radix UI and Tailwind

### Configuration Files

- **`.env.example`**: Template for environment variables (both frontend and backend)
- **`render.yaml`**: Render deployment configuration for backend
- **`vercel.json`**: Vercel deployment configuration for frontend
- **`.github/workflows/ci.yml`**: GitHub Actions CI/CD pipeline

### Documentation

- **`README.md`**: Project overview, setup instructions, and API documentation
- **`DEPLOYMENT.md`**: Detailed deployment guide for all services
- **`PROJECT_STRUCTURE.md`**: This file explaining the project organization

## Directory Purposes

### Backend Directories

- **`db/`**: Database connection, schema, and migration files
- **`middleware/`**: Express middleware for authentication, validation, etc.
- **`routes/`**: API route handlers organized by feature
- **`tests/`**: Jest test files for backend functionality
- **`uploads/`**: Storage for uploaded files (CVs, documents, etc.)

### Frontend Directories

- **`app/`**: Next.js 13+ app directory with page components
- **`components/`**: Reusable React components
- **`lib/`**: Utility functions and helpers
- **`public/`**: Static assets (images, fonts, etc.)
- **`__tests__/`**: Jest test files for frontend components

## Key Technologies

### Backend
- Node.js with Express
- PostgreSQL (Neon)
- JWT authentication
- Stripe for payments
- Multer for file uploads
- Jest for testing

### Frontend
- Next.js 14 with App Router
- React 18
- TypeScript
- Tailwind CSS
- Radix UI components
- Axios for API calls
- React Hook Form
- Jest and React Testing Library

### Infrastructure
- Neon for database hosting
- Render for backend hosting
- Vercel for frontend hosting
- GitHub Actions for CI/CD
- Stripe for payment processing

## Development Workflow

1. Clone the repository
2. Set up environment variables from `.env.example`
3. Install dependencies in both directories
4. Run database migrations
5. Start development servers
6. Make changes and test locally
7. Commit and push changes
8. CI/CD pipeline runs tests
9. Automatic deployment on main branch

## Security Considerations

- JWT tokens for authentication
- Role-based access control
- Input validation with Joi
- File upload restrictions
- CORS configuration
- Rate limiting
- Helmet security headers
- SQL injection protection via parameterized queries

## Scalability Considerations

- Database connection pooling
- Stateless API design
- CDN for static assets
- Horizontal scaling on Render
- Automatic scaling on Vercel
- Caching strategies
- Load balancing
