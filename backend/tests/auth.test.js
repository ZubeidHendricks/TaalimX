const request = require('supertest');
const app = require('../index');
const { pool } = require('../db');

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    // Setup test database
    // You might want to run migrations here or set up test data
  });

  afterAll(async () => {
    // Clean up test data
    await pool.end();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new parent', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testparent@example.com',
          password: 'password123',
          role: 'parent',
          firstName: 'Test',
          lastName: 'Parent',
          phoneNumber: '+1234567890'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'testparent@example.com');
      expect(response.body.user).toHaveProperty('role', 'parent');
    });

    it('should register a new teacher', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testteacher@example.com',
          password: 'password123',
          role: 'teacher',
          firstName: 'Test',
          lastName: 'Teacher',
          phoneNumber: '+1234567890'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'testteacher@example.com');
      expect(response.body.user).toHaveProperty('role', 'teacher');
    });

    it('should not register a user with existing email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testparent@example.com',
          password: 'password123',
          role: 'parent',
          firstName: 'Test',
          lastName: 'Parent',
          phoneNumber: '+1234567890'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testparent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'testparent@example.com');
    });

    it('should not login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testparent@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });
  });
});
