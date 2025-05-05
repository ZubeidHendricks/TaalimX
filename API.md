# TaalimX API Documentation

Base URL: `https://your-api-url.com/api`

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register New User
```http
POST /auth/register
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "parent" | "teacher",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "parent"
  },
  "token": "jwt_token_here"
}
```

#### Login
```http
POST /auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "parent"
  },
  "token": "jwt_token_here"
}
```

#### Get Current User
```http
GET /auth/me
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "parent"
  },
  "profile": {
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+1234567890"
  }
}
```

### Teachers

#### Get Teacher Profile
```http
GET /teachers/profile
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "teacher@example.com",
  "status": "approved",
  "qualifications": [
    {
      "id": 1,
      "institution": "University of Cape Town",
      "qualification": "Bachelor of Islamic Studies",
      "year_completed": 2020
    }
  ]
}
```

#### Update Teacher Profile
```http
PUT /teachers/profile
```

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "idNumber": "9001015009087",
  "phoneNumber": "+27123456789",
  "address": "123 Main St, Cape Town",
  "driversLicenseNumber": "DL123456",
  "driversLicenseExpiry": "2025-12-31",
  "policeClearanceNumber": "PC123456",
  "policeClearanceExpiry": "2025-06-30"
}
```

#### Add Qualification
```http
POST /teachers/qualifications
```

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "institution": "University of Cape Town",
  "qualification": "Bachelor of Islamic Studies",
  "yearCompleted": 2020
}
```

#### Get Teacher's Classes
```http
GET /teachers/classes
```

**Query Parameters:**
- `status`: Filter by class status (scheduled, completed, cancelled)
- `startDate`: Filter by start date (ISO format)
- `endDate`: Filter by end date (ISO format)

**Response:**
```json
[
  {
    "id": 1,
    "student_first_name": "Ahmed",
    "student_last_name": "Hassan",
    "subject": "Quran Recitation",
    "start_time": "2024-01-15T10:00:00Z",
    "end_time": "2024-01-15T11:00:00Z",
    "status": "scheduled",
    "price_per_lesson": 150.00
  }
]
```

#### Get Teacher's Earnings
```http
GET /teachers/earnings
```

**Query Parameters:**
- `startDate`: Filter by start date (ISO format)
- `endDate`: Filter by end date (ISO format)

**Response:**
```json
[
  {
    "month": "2024-01-01T00:00:00Z",
    "lesson_count": 12,
    "total_earned": "1800.00",
    "paid_amount": "1500.00",
    "pending_amount": "300.00"
  }
]
```

### Parents

#### Get Parent Profile
```http
GET /parents/profile
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "parent@example.com",
  "phone_number": "+27123456789"
}
```

#### Update Parent Profile
```http
PUT /parents/profile
```

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+27123456789",
  "address": "456 Oak St, Johannesburg"
}
```

### Students

#### Get All Students (Parent)
```http
GET /students
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": 1,
    "first_name": "Ahmed",
    "last_name": "Hassan",
    "date_of_birth": "2010-05-15",
    "school_name": "Green Valley School",
    "grade": "8",
    "arabic_recitation_level": "intermediate"
  }
]
```

#### Add New Student
```http
POST /students
```

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "firstName": "Ahmed",
  "lastName": "Hassan",
  "dateOfBirth": "2010-05-15",
  "schoolName": "Green Valley School",
  "grade": "8",
  "arabicRecitationLevel": "intermediate"
}
```

#### Get Specific Student
```http
GET /students/:studentId
```

**Headers:** `Authorization: Bearer <token>`

#### Update Student
```http
PUT /students/:studentId
```

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "firstName": "Ahmed",
  "lastName": "Hassan",
  "dateOfBirth": "2010-05-15",
  "schoolName": "Green Valley School",
  "grade": "9",
  "arabicRecitationLevel": "advanced"
}
```

#### Delete Student
```http
DELETE /students/:studentId
```

**Headers:** `Authorization: Bearer <token>`

### Classes

#### Create New Class
```http
POST /classes
```

**Headers:** `Authorization: Bearer <token>` (Parent only)

**Body:**
```json
{
  "teacherId": 1,
  "studentId": 1,
  "subject": "Quran Recitation",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T11:00:00Z",
  "pricePerLesson": 150.00
}
```

#### Get Classes
```http
GET /classes
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status`: Filter by status (scheduled, completed, cancelled)
- `startDate`: Filter by start date
- `endDate`: Filter by end date

**Response (for Parents):**
```json
[
  {
    "id": 1,
    "student_first_name": "Ahmed",
    "student_last_name": "Hassan",
    "teacher_first_name": "Jane",
    "teacher_last_name": "Smith",
    "subject": "Quran Recitation",
    "start_time": "2024-01-15T10:00:00Z",
    "end_time": "2024-01-15T11:00:00Z",
    "status": "scheduled",
    "price_per_lesson": 150.00
  }
]
```

#### Get Specific Class
```http
GET /classes/:classId
```

**Headers:** `Authorization: Bearer <token>`

#### Update Class
```http
PUT /classes/:classId
```

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "startTime": "2024-01-15T11:00:00Z",
  "endTime": "2024-01-15T12:00:00Z",
  "status": "scheduled"
}
```

#### Cancel Class
```http
POST /classes/:classId/cancel
```

**Headers:** `Authorization: Bearer <token>`

#### Complete Class (Teacher Only)
```http
POST /classes/:classId/complete
```

**Headers:** `Authorization: Bearer <token>`

### Payments

#### Create Payment Intent
```http
POST /payments/create-payment-intent
```

**Headers:** `Authorization: Bearer <token>` (Parent only)

**Body:**
```json
{
  "classId": 1
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx"
}
```

#### Get Payment History (Teacher)
```http
GET /payments/history
```

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `startDate`: Filter by start date
- `endDate`: Filter by end date
- `status`: Filter by status (pending, completed, failed)

**Response:**
```json
[
  {
    "id": 1,
    "amount": "150.00",
    "payment_date": "2024-01-15T12:00:00Z",
    "status": "completed",
    "subject": "Quran Recitation",
    "student_first_name": "Ahmed",
    "student_last_name": "Hassan"
  }
]
```

#### Get Payment Summary (Teacher)
```http
GET /payments/summary
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "completed_payments": 25,
  "pending_payments": 3,
  "failed_payments": 1,
  "total_earned": "3750.00",
  "total_pending": "450.00",
  "current_month_earned": "900.00"
}
```

#### Stripe Webhook
```http
POST /payments/webhook
```

**Headers:** `Stripe-Signature: <stripe_signature>`

**Body:** Raw Stripe webhook payload

### File Uploads

#### Upload Teacher Documents
```http
POST /uploads/teacher-documents
```

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Body (Form Data):**
- `file`: The file to upload
- `type`: Document type ('cv', 'id', 'police_clearance')

**Response:**
```json
{
  "message": "File uploaded successfully",
  "fileUrl": "/uploads/cv-1642345678-123456789.pdf",
  "type": "cv"
}
```

## Error Responses

All error responses follow this format:
```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

API requests are limited to 100 requests per 15-minute window per IP address.

## Pagination

For endpoints that return lists, pagination is handled with query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Example:
```http
GET /teachers?page=2&limit=20
```

Response includes pagination metadata:
```json
{
  "teachers": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "totalPages": 5,
    "totalCount": 95
  }
}
```

## Date Format

All dates should be in ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`

## File Upload Restrictions

- Maximum file size: 10MB
- Allowed file types:
  - CV: PDF, DOC, DOCX
  - ID Documents: PDF, JPG, PNG
  - Police Clearance: PDF, JPG, PNG

## Authentication Flow

1. User registers via `/auth/register`
2. User logs in via `/auth/login` and receives JWT token
3. Token is included in Authorization header for all authenticated requests
4. Token expires after 7 days (configurable via JWT_EXPIRY environment variable)

## Role-Based Access Control

Three user roles:
- `parent`: Can manage students, book classes, make payments
- `teacher`: Can manage profile, view classes, track earnings
- `admin`: Can approve teachers, manage platform

Each endpoint has specific role requirements enforced by the `authorize` middleware.
