import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

describe('stripe create-account validation', () => {
  let app: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const mod = await import('../index');
    app = mod.app;
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/stripe/create-account').send({}).expect(400);
    expect(res.body.code).toBe('MISSING_FIELDS');
    expect(res.body.missing).toEqual(expect.arrayContaining(['restaurantId', 'email', 'businessName']));
    expect(res.body.missing).not.toContain('bankAccount');
    expect(res.body.missing).not.toContain('ssnLast4');
    expect(res.body.missing).not.toContain('dob');
  });

  it('returns 400 for an invalid email before any Stripe call', async () => {
    const res = await request(app)
      .post('/api/stripe/create-account')
      .send({ restaurantId: 'rest_123', email: 'not-an-email', businessName: 'Kitchen' })
      .expect(400);
    expect(res.body.code).toBe('INVALID_EMAIL');
  });

  it('requires a restaurant login once the payload is valid', async () => {
    const res = await request(app)
      .post('/api/stripe/create-account')
      .send({ restaurantId: 'rest_123', email: 'owner@example.com', businessName: 'Kitchen' })
      .expect(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});
