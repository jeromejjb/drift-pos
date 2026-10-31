import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import { setStripeForTests } from '../lib/stripeClient';

describe('stripe checkout, webhooks, and payouts', () => {
  let app: any;
  let prisma: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const mod = await import('../index');
    app = mod.app;
    prisma = mod.prisma;
  });

  afterEach(() => {
    setStripeForTests(null);
  });

  function token(restaurantId: string) {
    return jwt.sign(
      { userId: 'owner', email: 'owner@example.com', restaurantId },
      process.env.JWT_SECRET!,
      { algorithm: 'HS256' }
    );
  }

  async function seedPaidPath(label: string) {
    const restaurant = await prisma.restaurant.create({
      data: { name: label, email: `${label}@example.com`, stripeAccount: `acct_${label}` },
    });
    const user = await prisma.user.create({ data: { email: `${label}-diner@example.com`, name: 'Diner' } });
    const table = await prisma.table.create({ data: { restaurantId: restaurant.id, number: 1 } });
    const order = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        tableId: table.id,
        userId: user.id,
        total: 25,
        tipAmount: 5,
        status: 'PENDING',
      },
    });
    return { restaurant, user, table, order };
  }

  async function cleanup(restaurantId: string, userId: string) {
    await prisma.transaction.deleteMany({ where: { order: { restaurantId } } });
    await prisma.orderItem.deleteMany({ where: { order: { restaurantId } } });
    await prisma.order.deleteMany({ where: { restaurantId } });
    await prisma.payout.deleteMany({ where: { restaurantId } });
    await prisma.table.deleteMany({ where: { restaurantId } });
    await prisma.restaurant.delete({ where: { id: restaurantId } });
    await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
  }

  it('creates a destination PaymentIntent for a ready restaurant', async () => {
    const { restaurant, user, order } = await seedPaidPath('checkout');
    let created: any;
    setStripeForTests({
      accounts: {
        retrieve: async () => ({
          id: restaurant.stripeAccount,
          charges_enabled: true,
          payouts_enabled: true,
          capabilities: { transfers: 'active', card_payments: 'active' },
        }),
      },
      paymentIntents: {
        create: async (params: any, options: any) => {
          created = { params, options };
          return { id: 'pi_checkout', client_secret: 'pi_checkout_secret', amount: params.amount };
        },
      },
    } as any);

    try {
      const res = await request(app)
        .post(`/api/stripe/order/${order.id}/create-payment-intent`)
        .send({ tipPercent: 0 })
        .expect(200);

      expect(res.body.clientSecret).toBe('pi_checkout_secret');
      expect(res.body.amountCents).toBe(2500);
      expect(res.body.connectedAccountId).toBe(restaurant.stripeAccount);
      expect(created.params.application_fee_amount).toBe(Math.round(2500 * 0.015));
      expect(created.options.stripeAccount).toBe(restaurant.stripeAccount);
      expect(created.params.transfer_data).toBeUndefined();
      expect(created.params.metadata.orderId).toBe(order.id);

      const saved = await prisma.order.findUnique({ where: { id: order.id } });
      expect(saved.stripePaymentIntentId).toBe('pi_checkout');
      expect(saved.paymentStatus).toBe('PROCESSING');
      expect(saved.tipAmount).toBe(0);
    } finally {
      await prisma.stripeEvent.deleteMany({ where: { id: { startsWith: 'evt_' } } });
      await cleanup(restaurant.id, user.id);
    }
  });

  it('refuses checkout when the connected account cannot receive transfers', async () => {
    const { restaurant, user, order } = await seedPaidPath('blocked');
    setStripeForTests({
      accounts: {
        retrieve: async () => ({
          id: restaurant.stripeAccount,
          charges_enabled: false,
          payouts_enabled: false,
          capabilities: { transfers: 'inactive' },
        }),
      },
      paymentIntents: { create: async () => { throw new Error('should not charge'); } },
    } as any);
    try {
      const res = await request(app)
        .post(`/api/stripe/order/${order.id}/create-payment-intent`)
        .send({})
        .expect(400);
      expect(res.body.code).toBe('CHARGES_NOT_ENABLED');
    } finally {
      await cleanup(restaurant.id, user.id);
    }
  });

  it('saves an Express account before responding and does not send bank details', async () => {
    const restaurant = await prisma.restaurant.create({
      data: { name: 'Express Kitchen', email: 'express@example.com' },
    });
    let created: any;
    setStripeForTests({
      accounts: {
        create: async (params: any) => {
          created = params;
          return { id: 'acct_express', charges_enabled: false, payouts_enabled: false, details_submitted: false };
        },
      },
      accountLinks: { create: async () => ({ url: 'https://connect.stripe.com/express/onboard' }) },
      accountSessions: { create: async () => ({ client_secret: 'cs_test_embedded' }) },
    } as any);
    try {
      const res = await request(app)
        .post('/api/stripe/create-account')
        .set('Authorization', `Bearer ${token(restaurant.id)}`)
        .send({ restaurantId: restaurant.id, email: 'express@example.com', businessName: 'Express Kitchen' })
        .expect(200);
      expect(res.body.accountId).toBe('acct_express');
      expect(res.body.onboardingUrl).toContain('connect.stripe.com');
      expect(res.body.embeddedClientSecret).toBe('cs_test_embedded');
      expect(created.type).toBe('express');
      expect(created.external_account).toBeUndefined();
      expect(created.tos_acceptance).toBeUndefined();
      const saved = await prisma.restaurant.findUnique({ where: { id: restaurant.id } });
      expect(saved.stripeAccount).toBe('acct_express');
    } finally {
      await prisma.restaurant.delete({ where: { id: restaurant.id } });
    }
  });

  it('verifies webhook signatures, pays the order once, then records failure and refund', async () => {
    const { restaurant, user, order } = await seedPaidPath('hook');
    const failed = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        tableId: (await prisma.table.findFirst({ where: { restaurantId: restaurant.id } }))!.id,
        userId: user.id,
        total: 12,
        status: 'PENDING',
      },
    });

    const post = (event: Record<string, unknown>) => {
      const payload = JSON.stringify(event);
      const header = Stripe.webhooks.generateTestHeaderString({
        payload,
        secret: process.env.STRIPE_WEBHOOK_SECRET!,
      });
      return request(app)
        .post('/api/stripe/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', header)
        .send(payload);
    };

    try {
      const bad = await request(app)
        .post('/api/stripe/webhook')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 't=1,v1=deadbeef')
        .send(JSON.stringify({ id: 'evt_bad', object: 'event', type: 'payment_intent.succeeded', data: { object: {} } }));
      expect(bad.status).toBe(400);
      expect(bad.body.code).toBe('INVALID_SIGNATURE');

      const succeeded = {
        id: 'evt_paid_hook',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_hook',
            object: 'payment_intent',
            amount: 3000,
            currency: 'usd',
            metadata: { orderId: order.id, applicationFeeCents: '75' },
          },
        },
      };
      const first = await post(succeeded);
      expect(first.status).toBe(200);
      expect(first.body.duplicate).toBe(false);
      const second = await post(succeeded);
      expect(second.status).toBe(200);
      expect(second.body.duplicate).toBe(true);

      const paid = await prisma.order.findUnique({ where: { id: order.id } });
      expect(paid.paymentStatus).toBe('PAID');
      expect(paid.status).toBe('PENDING');
      const txns = await prisma.transaction.count({ where: { stripePaymentId: 'pi_hook' } });
      expect(txns).toBe(1);

      const failure = await post({
        id: 'evt_fail_hook',
        object: 'event',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_fail',
            object: 'payment_intent',
            amount: 1200,
            currency: 'usd',
            metadata: { orderId: failed.id },
          },
        },
      });
      expect(failure.status).toBe(200);
      const failedOrder = await prisma.order.findUnique({ where: { id: failed.id } });
      expect(failedOrder.paymentStatus).toBe('FAILED');
      expect(failedOrder.status).toBe('PENDING');

      await prisma.order.update({ where: { id: order.id }, data: { stripePaymentIntentId: 'pi_hook' } });
      const refund = await post({
        id: 'evt_refund_hook',
        object: 'event',
        type: 'charge.refunded',
        data: {
          object: {
            id: 'ch_hook',
            object: 'charge',
            amount: 3000,
            amount_refunded: 3000,
            refunded: true,
            payment_intent: 'pi_hook',
            refunds: { data: [{ id: 're_hook' }] },
          },
        },
      });
      expect(refund.status).toBe(200);
      const refunded = await prisma.order.findUnique({ where: { id: order.id } });
      expect(refunded.paymentStatus).toBe('REFUNDED');
      const refundTxn = await prisma.transaction.findUnique({ where: { stripePaymentId: 'pi_hook' } });
      expect(refundTxn.status).toBe('REFUNDED');
      expect(refundTxn.stripeRefundId).toBe('re_hook');
    } finally {
      await prisma.stripeEvent.deleteMany({
        where: { id: { in: ['evt_paid_hook', 'evt_fail_hook', 'evt_refund_hook'] } },
      });
      await cleanup(restaurant.id, user.id);
    }
  });

  it('pays out the available Connect balance and lists it', async () => {
    const restaurant = await prisma.restaurant.create({
      data: {
        name: 'Payout Kitchen',
        email: 'payout@example.com',
        stripeAccount: 'acct_payout',
        chargesEnabled: true,
        payoutsEnabled: true,
      },
    });
    setStripeForTests({
      accounts: {
        retrieve: async () => ({
          id: 'acct_payout',
          charges_enabled: true,
          payouts_enabled: true,
          details_submitted: true,
        }),
      },
      balance: {
        retrieve: async () => ({
          available: [{ amount: 4200, currency: 'usd' }],
          pending: [{ amount: 800, currency: 'usd' }],
        }),
      },
      payouts: {
        create: async (params: any) => ({
          id: 'po_test',
          amount: params.amount,
          currency: 'usd',
          status: 'paid',
          arrival_date: 1_700_000_000,
          failure_message: null,
        }),
        list: async () => ({
          data: [{
            id: 'po_test',
            amount: 4200,
            currency: 'usd',
            status: 'paid',
            arrival_date: 1_700_000_000,
            failure_message: null,
          }],
        }),
      },
    } as any);

    try {
      const created = await request(app)
        .post(`/api/stripe/restaurants/${restaurant.id}/payouts`)
        .set('Authorization', `Bearer ${token(restaurant.id)}`)
        .send({})
        .expect(200);
      expect(created.body.payout.amountCents).toBe(4200);
      expect(created.body.payout.status).toBe('paid');

      const listed = await request(app)
        .get(`/api/stripe/restaurants/${restaurant.id}/payouts`)
        .set('Authorization', `Bearer ${token(restaurant.id)}`)
        .expect(200);
      expect(listed.body.availableCents).toBe(4200);
      expect(listed.body.pendingCents).toBe(800);
      expect(listed.body.payouts).toHaveLength(1);
      expect(listed.body.payouts[0].stripePayoutId).toBe('po_test');
      expect(listed.body.feeRate).toBe(0.015);
    } finally {
      await prisma.payout.deleteMany({ where: { restaurantId: restaurant.id } });
      await prisma.restaurant.delete({ where: { id: restaurant.id } });
    }
  });
});
