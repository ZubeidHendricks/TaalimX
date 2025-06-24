const request = require('supertest');
const app = require('../index');
const { query } = require('../db');

// Mock PayPal SDK
jest.mock('@paypal/paypal-server-sdk', () => ({
  core: {
    SandboxEnvironment: jest.fn().mockImplementation(() => ({})),
    LiveEnvironment: jest.fn().mockImplementation(() => ({})),
    PayPalHttpClient: jest.fn().mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue({
        result: {
          id: 'PAYPAL_ORDER_123',
          status: 'COMPLETED',
          purchase_units: [{
            payments: {
              captures: [{
                id: 'CAPTURE_123'
              }]
            }
          }]
        }
      }))
    }))
  },
  orders: {
    OrdersCreateRequest: jest.fn().mockImplementation(() => ({
      prefer: jest.fn(),
      requestBody: jest.fn()
    })),
    OrdersCaptureRequest: jest.fn().mockImplementation(() => ({
      requestBody: jest.fn()
    }))
  }
}));

// Mock database
jest.mock('../db', () => ({
  query: jest.fn(),
  transaction: jest.fn()
}));

describe('PayPal Payments API', () => {
  const mockUser = {
    id: 1,
    email: 'parent@test.com',
    role: 'parent'
  };

  const mockClass = {
    id: 1,
    teacher_id: 1,
    student_id: 1,
    subject: 'Quran Recitation',
    price_per_lesson: 150.00,
    parent_id: 1,
    teacher_first_name: 'Ahmed',
    teacher_last_name: 'Ali',
    student_first_name: 'Fatima',
    student_last_name: 'Hassan'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = mockUser;
      next();
    });
  });

  describe('POST /api/payments/create-order', () => {
    it('should create PayPal order successfully', async () => {
      // Mock database queries
      query
        .mockResolvedValueOnce({ rows: [mockClass] }) // Get class details
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Get parent

      const response = await request(app)
        .post('/api/payments/create-order')
        .send({ classId: 1 })
        .expect(200);

      expect(response.body).toHaveProperty('orderID');
      expect(response.body.orderID).toBe('PAYPAL_ORDER_123');
    });

    it('should return 400 if classId is missing', async () => {
      const response = await request(app)
        .post('/api/payments/create-order')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Class ID is required');
    });

    it('should return 404 if class not found', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/payments/create-order')
        .send({ classId: 999 })
        .expect(404);

      expect(response.body.error).toBe('Class not found');
    });

    it('should return 403 if parent does not own student', async () => {
      const classWithDifferentParent = { ...mockClass, parent_id: 2 };
      
      query
        .mockResolvedValueOnce({ rows: [classWithDifferentParent] })
        .mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const response = await request(app)
        .post('/api/payments/create-order')
        .send({ classId: 1 })
        .expect(403);

      expect(response.body.error).toBe('Access denied');
    });
  });

  describe('POST /api/payments/capture-order', () => {
    it('should capture PayPal order successfully', async () => {
      // Mock database queries
      query
        .mockResolvedValueOnce({ rows: [] }) // Check existing payment
        .mockResolvedValueOnce({ rows: [{ teacher_id: 1, price_per_lesson: 150.00 }] }) // Get class details
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Insert payment

      const response = await request(app)
        .post('/api/payments/capture-order')
        .send({ 
          orderID: 'PAYPAL_ORDER_123',
          classId: 1 
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.orderID).toBe('PAYPAL_ORDER_123');
      expect(response.body.captureID).toBe('CAPTURE_123');
    });

    it('should return 400 if orderID or classId is missing', async () => {
      const response = await request(app)
        .post('/api/payments/capture-order')
        .send({ orderID: 'PAYPAL_ORDER_123' })
        .expect(400);

      expect(response.body.error).toBe('Order ID and Class ID are required');
    });

    it('should update existing payment record', async () => {
      // Mock existing payment
      query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const response = await request(app)
        .post('/api/payments/capture-order')
        .send({ 
          orderID: 'PAYPAL_ORDER_123',
          classId: 1 
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE payments'),
        expect.arrayContaining(['PAYPAL_ORDER_123', 1])
      );
    });
  });

  describe('GET /api/payments/history', () => {
    it('should return payment history for teacher', async () => {
      const mockPayments = [
        {
          id: 1,
          amount: 150.00,
          status: 'completed',
          payment_date: '2024-01-15',
          subject: 'Quran Recitation',
          student_first_name: 'Fatima',
          student_last_name: 'Hassan'
        }
      ];

      // Mock teacher user
      app.use((req, res, next) => {
        req.user = { ...mockUser, role: 'teacher' };
        next();
      });

      query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Get teacher ID
        .mockResolvedValueOnce({ rows: mockPayments }); // Get payment history

      const response = await request(app)
        .get('/api/payments/history')
        .expect(200);

      expect(response.body).toEqual(mockPayments);
    });

    it('should filter payments by date range', async () => {
      query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      await request(app)
        .get('/api/payments/history?startDate=2024-01-01&endDate=2024-01-31')
        .expect(200);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('payment_date >='),
        expect.arrayContaining(['2024-01-01', '2024-01-31'])
      );
    });
  });

  describe('GET /api/payments/summary', () => {
    it('should return payment summary for teacher', async () => {
      const mockSummary = {
        completed_payments: '10',
        pending_payments: '2',
        failed_payments: '1',
        total_earned: '1500.00',
        total_pending: '300.00',
        current_month_earned: '450.00'
      };

      // Mock teacher user
      app.use((req, res, next) => {
        req.user = { ...mockUser, role: 'teacher' };
        next();
      });

      query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Get teacher ID
        .mockResolvedValueOnce({ rows: [mockSummary] }); // Get summary

      const response = await request(app)
        .get('/api/payments/summary')
        .expect(200);

      expect(response.body).toEqual(mockSummary);
    });
  });

  describe('POST /api/payments/webhook', () => {
    it('should handle PayPal webhook events', async () => {
      const webhookEvent = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          supplementary_data: {
            related_ids: {
              order_id: 'PAYPAL_ORDER_123'
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .send(webhookEvent)
        .expect(200);

      expect(response.body.received).toBe(true);
    });

    it('should handle unknown webhook events', async () => {
      const webhookEvent = {
        event_type: 'UNKNOWN.EVENT.TYPE',
        resource: {}
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .send(webhookEvent)
        .expect(200);

      expect(response.body.received).toBe(true);
    });
  });
});

describe('PayPal Integration Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle PayPal API errors gracefully', async () => {
    // Mock PayPal SDK to throw error
    const mockClient = require('@paypal/paypal-server-sdk').core.PayPalHttpClient;
    mockClient.mockImplementation(() => ({
      execute: jest.fn().mockRejectedValue(new Error('PayPal API Error'))
    }));

    query
      .mockResolvedValueOnce({ rows: [{ id: 1, parent_id: 1, price_per_lesson: 150 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const response = await request(app)
      .post('/api/payments/create-order')
      .send({ classId: 1 })
      .expect(500);

    expect(response.body.error).toBe('Failed to create PayPal order');
  });

  it('should handle database errors', async () => {
    query.mockRejectedValue(new Error('Database connection error'));

    const response = await request(app)
      .post('/api/payments/create-order')
      .send({ classId: 1 })
      .expect(500);

    expect(response.body.error).toBe('Failed to create PayPal order');
  });
});