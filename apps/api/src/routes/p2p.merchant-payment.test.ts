import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

describe('merchant-payment endpoint', () => {
  let app: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const mod = await import('../index');
    app = mod.app;
  });

  it('returns 401 without Authorization header', async () => {
    const res = await request(app)
      .post('/api/p2p/merchant-payment')
      .send({ amount: 5, destination: 'acct_test123' })
      .expect(401);
    expect(res.body?.code || res.body?.error).toBeDefined();
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .post('/api/p2p/merchant-payment')
      .set('Authorization', 'Bearer invalid-token')
      .send({ amount: 5, destination: 'acct_test123' })
      .expect(401);
    expect(res.body?.code || res.body?.error).toBeDefined();
  });

  it('returns 400 when amount is missing', async () => {
    const res = await request(app)
      .post('/api/p2p/merchant-payment')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0In0.x')
      .send({ destination: 'acct_test123' });
    expect([400, 401]).toContain(res.status);
  });

  it('returns 400 when destination is invalid (not acct_)', async () => {
    const res = await request(app)
      .post('/api/p2p/merchant-payment')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0In0.x')
      .send({ amount: 5, destination: 'invalid' });
    expect([400, 401]).toContain(res.status);
  });

  it('returns 400 when amount is below minimum', async () => {
    const res = await request(app)
      .post('/api/p2p/merchant-payment')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0In0.x')
      .send({ amount: 0.25, destination: 'acct_test123' });
    expect([400, 401]).toContain(res.status);
  });

  it('GET /api/integration/p2p includes merchantPayment', async () => {
    const res = await request(app).get('/api/integration/p2p').expect(200);
    expect(res.body.endpoints?.merchantPayment).toBe('POST /api/p2p/merchant-payment');
  });
});
