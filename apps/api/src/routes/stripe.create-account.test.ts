import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

describe('stripe create-account endpoint', () => {
  let app: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const mod = await import('../index');
    app = mod.app;
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/stripe/create-account')
      .send({}) // no body
      .expect(400);

    expect(res.body.code).toBe('MISSING_FIELDS');
    expect(Array.isArray(res.body.missing)).toBe(true);
    expect(res.body.missing).toContain('restaurantId');
    expect(res.body.missing).toContain('email');
    expect(res.body.missing).toContain('businessName');
    expect(res.body.missing).toContain('fullName');
    expect(res.body.missing).toContain('bankAccount');
    expect(res.body.missing).toContain('dob');
    expect(res.body.missing).toContain('ssnLast4');
  });

  it('returns 400 for invalid DOB', async () => {
    const res = await request(app)
      .post('/api/stripe/create-account')
      .send({
        restaurantId: 'rest_123',
        email: 'owner@example.com',
        businessName: 'Test Restaurant',
        fullName: 'Test Owner',
        bankAccount: { accountHolderName: 'Test Owner', routingNumber: '021000021', accountNumber: '12345678' },
        dob: { month: '13', day: '40', year: 'abcd' },
        ssnLast4: '1234',
      })
      .expect(400);

    expect(res.body.code).toBe('INVALID_DOB');
  });

  it('returns 400 for invalid SSN last 4', async () => {
    const res = await request(app)
      .post('/api/stripe/create-account')
      .send({
        restaurantId: 'rest_123',
        email: 'owner@example.com',
        businessName: 'Test Restaurant',
        fullName: 'Test Owner',
        bankAccount: { accountHolderName: 'Test Owner', routingNumber: '021000021', accountNumber: '12345678' },
        dob: { month: '1', day: '1', year: '1980' },
        ssnLast4: '12', // too short
      })
      .expect(400);

    expect(res.body.code).toBe('INVALID_SSN');
  });

  it('returns 400 for invalid address', async () => {
    const res = await request(app)
      .post('/api/stripe/create-account')
      .send({
        restaurantId: 'rest_123',
        email: 'owner@example.com',
        businessName: 'Test Restaurant',
        fullName: 'Test Owner',
        bankAccount: { accountHolderName: 'Test Owner', routingNumber: '021000021', accountNumber: '12345678' },
        dob: { month: '1', day: '1', year: '1980' },
        ssnLast4: '1234',
        address: { line1: '', city: '', state: '', postal_code: '12' },
      })
      .expect(400);

    expect(res.body.code).toBe('INVALID_ADDRESS');
  });
});

