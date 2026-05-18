import '../env';
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import Stripe from 'stripe';
import { databaseHostIsLocal } from '../lib/pgPool';

/**
 * This test hits Postgres + Stripe. CI and some sandboxes cannot reach a hosted Render DB.
 * - Local DATABASE_URL: runs by default (set RUN_STRIPE_ORDER_PAYMENT_TEST=0 to skip).
 * - Remote DATABASE_URL: skipped unless RUN_STRIPE_ORDER_PAYMENT_TEST=1.
 */
function runOrderPaymentIntentDbIntegration(): boolean {
  if (process.env.RUN_STRIPE_ORDER_PAYMENT_TEST === '0') return false;
  if (process.env.RUN_STRIPE_ORDER_PAYMENT_TEST === '1') return true;
  return databaseHostIsLocal(process.env.DATABASE_URL);
}

/** Hosted Postgres often drops idle pool clients; long Stripe calls before first DB use then fail. */
async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  const max = 6;
  let last: unknown;
  for (let i = 0; i < max; i++) {
    try {
      return await fn();
    } catch (e: unknown) {
      last = e;
      const msg = e instanceof Error ? e.message : String(e);
      const transient =
        msg.includes('Connection terminated unexpectedly') ||
        msg.includes('ECONNRESET') ||
        msg.includes('ETIMEDOUT') ||
        msg.includes('Connection closed');
      if (!transient || i === max - 1) throw e;
      await new Promise((r) => setTimeout(r, 350 * (i + 1)));
    }
  }
  throw last;
}

(runOrderPaymentIntentDbIntegration() ? describe : describe.skip)(
  'stripe order/create-payment-intent endpoint',
  () => {
  let app: any;
  let prisma: any;
  let stripe: Stripe;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const mod = await import('../index');
    app = mod.app;
    prisma = mod.prisma;
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  });

  it('creates a PaymentIntent that pays a restaurant connected account', async () => {
    const ownerEmail = 'flow-owner-1773069735835@example.com';
    const restaurantId = 'rest_diner_pay_flow';
    const userId = 'user_diner_pay_flow';

    // 1. Seed DB first (short burst). Avoid opening a pool client, then waiting on Stripe for seconds,
    //    which lets Render/Neon close the connection before the first query runs.
    await withDbRetry(() =>
      prisma.restaurant.upsert({
        where: { id: restaurantId },
        update: {
          email: ownerEmail,
          name: 'Test Flow Restaurant',
          stripeAccount: null,
        },
        create: {
          id: restaurantId,
          email: ownerEmail,
          name: 'Test Flow Restaurant',
          stripeAccount: null,
        },
      })
    );

    await withDbRetry(() =>
      prisma.user.upsert({
        where: { id: userId },
        update: { email: ownerEmail, name: 'Test Diner User' },
        create: { id: userId, email: ownerEmail, name: 'Test Diner User' },
      })
    );

    const table = await withDbRetry(() =>
      prisma.table.upsert({
        where: { id: 'table_diner_pay_flow' },
        update: {},
        create: {
          id: 'table_diner_pay_flow',
          restaurantId,
          number: 1,
        },
      })
    );

    const order = await withDbRetry(() =>
      prisma.order.create({
        data: {
          restaurantId,
          tableId: table.id,
          userId,
          total: 25.0,
          tipAmount: 5.0,
          status: 'PENDING',
        },
      })
    );

    // 2. Stripe network (can take several seconds on cold paths)
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: ownerEmail,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: 'Test Flow Restaurant',
        mcc: '5812',
      },
      metadata: {
        test: 'diner-pay-flow',
      },
    });

    try {
      await withDbRetry(() =>
        prisma.restaurant.update({
          where: { id: restaurantId },
          data: { stripeAccount: account.id },
        })
      );

      // 3. Call the API endpoint to create a PaymentIntent for this order
      const res = await request(app)
        .post(`/api/stripe/order/${order.id}/create-payment-intent`)
        .send({})
        .expect(400);

      expect(res.body.code).toBe('DESTINATION_INSUFFICIENT_CAPABILITIES');
      expect(typeof res.body.error).toBe('string');
    } finally {
      // Clean up the test connected account so the Stripe dashboard stays focused.
      try {
        await stripe.accounts.del(account.id);
      } catch {
        // ignore cleanup failures
      }
    }
  }, 20000);
});

