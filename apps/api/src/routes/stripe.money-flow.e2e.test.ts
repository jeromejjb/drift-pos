import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

/**
 * Full money movement against Stripe test mode:
 * onboard a restaurant → diner pays → webhook marks the order paid → payout.
 *
 * Skipped unless RUN_STRIPE_E2E=1 and STRIPE_SECRET_KEY is a real sk_test_ key
 * (not the placeholder used by the offline suite). Never runs with a live key.
 */
const key = process.env.STRIPE_SECRET_KEY || '';
const enabled =
  process.env.RUN_STRIPE_E2E === '1' &&
  key.startsWith('sk_test_') &&
  !key.includes('placeholder') &&
  key.length >= 20;

(enabled ? describe : describe.skip)('stripe test-mode money flow', () => {
  let app: any;
  let prisma: any;
  let stripe: Stripe;
  let restaurantId = '';
  let userId = '';
  let accountId = '';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const mod = await import('../index');
    app = mod.app;
    prisma = mod.prisma;
    stripe = new Stripe(key);
  });

  afterAll(async () => {
    if (accountId) {
      try {
        await stripe.accounts.del(accountId);
      } catch {
        /* test accounts can already be closed */
      }
    }
    if (restaurantId) {
      await prisma.transaction.deleteMany({ where: { order: { restaurantId } } });
      await prisma.orderItem.deleteMany({ where: { order: { restaurantId } } });
      await prisma.order.deleteMany({ where: { restaurantId } });
      await prisma.payout.deleteMany({ where: { restaurantId } });
      await prisma.table.deleteMany({ where: { restaurantId } });
      await prisma.stripeEvent.deleteMany({ where: { id: { startsWith: 'evt_e2e_' } } });
      await prisma.restaurant.delete({ where: { id: restaurantId } }).catch(() => undefined);
    }
    if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
  });

  it('onboards a restaurant, takes a card payment, and pays the restaurant out', async () => {
    const ownerEmail = `e2e-${Date.now()}@example.com`;
    const restaurant = await prisma.restaurant.create({
      data: { name: 'E2E Kitchen', email: ownerEmail },
    });
    restaurantId = restaurant.id;
    const user = await prisma.user.create({ data: { email: `diner-${ownerEmail}`, name: 'E2E Diner' } });
    userId = user.id;
    const table = await prisma.table.create({ data: { restaurantId, number: 7 } });
    const order = await prisma.order.create({
      data: { restaurantId, tableId: table.id, userId, total: 18, tipAmount: 2, status: 'PENDING' },
    });

    const auth = jwt.sign(
      { userId: user.id, email: ownerEmail, restaurantId },
      process.env.JWT_SECRET!,
      { algorithm: 'HS256' }
    );

    const onboard = await request(app)
      .post('/api/stripe/create-account')
      .set('Authorization', `Bearer ${auth}`)
      .send({
        restaurantId,
        email: ownerEmail,
        businessName: 'E2E Kitchen',
        fullName: 'E2E Owner',
        completeInTestMode: true,
      });
    expect(onboard.status, JSON.stringify(onboard.body)).toBe(200);
    expect(onboard.body.chargesEnabled).toBe(true);
    accountId = onboard.body.accountId;

    const piRes = await request(app)
      .post(`/api/stripe/order/${order.id}/create-payment-intent`)
      .send({});
    expect(piRes.status, JSON.stringify(piRes.body)).toBe(200);
    const paymentIntentId = piRes.body.paymentIntentId as string;
    expect(piRes.body.amountCents).toBe(2000);
    expect(piRes.body.applicationFeeCents).toBeGreaterThan(0);

    const confirmed = await stripe.paymentIntents.confirm(
      paymentIntentId,
      { payment_method: 'pm_card_visa' },
      { stripeAccount: accountId }
    );
    expect(confirmed.status).toBe('succeeded');

    const payloadObject = {
      id: `evt_e2e_${paymentIntentId}`,
      object: 'event',
      type: 'payment_intent.succeeded',
      data: { object: confirmed },
    };
    const payload = JSON.stringify(payloadObject);
    const header = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET!,
    });
    const hook = await request(app)
      .post('/api/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', header)
      .send(payload);
    expect(hook.status, JSON.stringify(hook.body)).toBe(200);

    const again = await request(app)
      .post('/api/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', header)
      .send(payload);
    expect(again.body.duplicate).toBe(true);

    const paid = await prisma.order.findUnique({ where: { id: order.id } });
    expect(paid.paymentStatus).toBe('PAID');
    expect(paid.status).toBe('PENDING');
    expect(await prisma.transaction.count({ where: { orderId: order.id, status: 'SUCCEEDED' } })).toBe(1);

    const balance = await stripe.balance.retrieve({ stripeAccount: accountId });
    const available = balance.available.find((b) => b.currency === 'usd')?.amount ?? 0;
    const pending = balance.pending.find((b) => b.currency === 'usd')?.amount ?? 0;
    const existing = await stripe.payouts.list({ limit: 5 }, { stripeAccount: accountId });

    if (available > 0) {
      const payout = await request(app)
        .post(`/api/stripe/restaurants/${restaurantId}/payouts`)
        .set('Authorization', `Bearer ${auth}`)
        .send({});
      expect(payout.status, JSON.stringify(payout.body)).toBe(200);
      expect(payout.body.payout.amountCents).toBe(available);
    } else if (existing.data.length > 0) {
      expect(existing.data[0].amount).toBeGreaterThan(0);
    } else {
      expect(pending, 'connected account received neither available nor pending funds').toBeGreaterThan(0);
    }

    const refund = await stripe.refunds.create(
      { payment_intent: paymentIntentId },
      { stripeAccount: accountId }
    );
    const chargeId = typeof refund.charge === 'string' ? refund.charge : refund.charge?.id;
    const charge = await stripe.charges.retrieve(chargeId!);
    const refundEvent = {
      id: `evt_e2e_refund_${refund.id}`,
      object: 'event',
      type: 'charge.refunded',
      data: { object: charge },
    };
    const refundPayload = JSON.stringify(refundEvent);
    const refundHeader = Stripe.webhooks.generateTestHeaderString({
      payload: refundPayload,
      secret: process.env.STRIPE_WEBHOOK_SECRET!,
    });
    const refundHook = await request(app)
      .post('/api/stripe/webhook')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', refundHeader)
      .send(refundPayload);
    expect(refundHook.status, JSON.stringify(refundHook.body)).toBe(200);
    const refunded = await prisma.order.findUnique({ where: { id: order.id } });
    expect(['REFUNDED', 'PARTIALLY_REFUNDED']).toContain(refunded.paymentStatus);
  }, 90_000);
});
