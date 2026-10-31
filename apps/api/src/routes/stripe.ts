import { Router } from 'express';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type Stripe from 'stripe';
import { ApiError } from '../lib/apiError';
import {
  buildDirectCharge,
  chargeAmountCents,
  feeRateForRestaurant,
} from '../lib/charges';
import { dollarsToCents, repriceTip } from '../lib/pricing';
import {
  destinationChargeBlocker,
  provisionTestMerchant,
  startExpressOnboarding,
} from '../lib/connect';
import { configuredBaseRate } from '../lib/rates';
import { createConnectedPayout, readBalanceAndPayouts } from '../lib/payouts';
import { getStripe, isStripeTestMode, stripeConfigured } from '../lib/stripeClient';
import { applyStripeEvent } from '../lib/webhookEvents';

const router = Router();

type Authed = { userId: string; restaurantId: string; email?: string };

function requireRestaurant(req: Request, res: Response): Authed | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return null;
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Server auth is not configured', code: 'SERVER_ERROR' });
    return null;
  }
  try {
    const payload = jwt.verify(header.slice(7), secret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    if (!payload.restaurantId || typeof payload.restaurantId !== 'string') {
      res.status(403).json({ error: 'This login is not tied to a restaurant', code: 'FORBIDDEN' });
      return null;
    }
    return {
      userId: String(payload.userId || ''),
      restaurantId: payload.restaurantId,
      email: typeof payload.email === 'string' ? payload.email : undefined,
    };
  } catch {
    res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    return null;
  }
}

async function prisma() {
  const mod = await import('../index');
  return mod;
}

function sendError(res: Response, error: any) {
  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: error.message, code: error.code });
  }
  if (error?.type === 'StripeInvalidRequestError') {
    const message = String(error.message || 'Stripe rejected the request');
    const customDisabled = /custom accounts are not enabled|requested account type/i.test(message);
    if (customDisabled) {
      return res.status(400).json({
        error:
          'Stripe test merchants need Custom accounts enabled. In the Dashboard open Settings → Connect → Account types and enable Custom, or finish Express onboarding in the browser instead.',
        code: 'TEST_ACCOUNT_UNAVAILABLE',
      });
    }
    return res.status(400).json({ error: message, code: error.code || 'stripe_error' });
  }
  console.error('[stripe]', error);
  return res.status(500).json({
    error: 'Payment request failed',
    code: 'server_error',
    message: process.env.NODE_ENV === 'development' ? error?.message : undefined,
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.get('/stripe/mode', (_req, res) => {
  res.json({
    configured: stripeConfigured(),
    testMode: isStripeTestMode(),
    feeRate: configuredBaseRate(),
  });
});

router.post('/stripe/connect', async (req, res) => {
  try {
    const user = requireRestaurant(req, res);
    if (!user) return;
    const { email, name, restaurantId } = req.body || {};
    if (!email || !name || !restaurantId) {
      return res.status(400).json({ error: 'Missing required fields', code: 'MISSING_FIELDS' });
    }
    if (restaurantId !== user.restaurantId) {
      return res.status(403).json({ error: 'Unauthorized', code: 'FORBIDDEN' });
    }
    const { prisma: db } = await prisma();
    const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found', code: 'NOT_FOUND' });
    const session = await startExpressOnboarding(getStripe(), db, restaurant, {
      restaurantId,
      email: String(email),
      businessName: String(name),
    });
    res.json({ clientSecret: session.embeddedClientSecret, accountId: session.accountId, onboardingUrl: session.onboardingUrl });
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/stripe/create-account', async (req, res) => {
  try {
    const {
      restaurantId,
      email,
      businessName,
      fullName,
      completeInTestMode,
    } = req.body || {};

    const missing: string[] = [];
    if (!restaurantId) missing.push('restaurantId');
    if (!email) missing.push('email');
    if (!businessName) missing.push('businessName');
    if (missing.length) {
      return res.status(400).json({ error: 'Missing required fields', code: 'MISSING_FIELDS', missing });
    }
    if (!EMAIL_RE.test(String(email))) {
      return res.status(400).json({ error: 'Invalid email', code: 'INVALID_EMAIL' });
    }

    const user = requireRestaurant(req, res);
    if (!user) return;
    if (restaurantId !== user.restaurantId) {
      return res.status(403).json({ error: 'Unauthorized', code: 'FORBIDDEN' });
    }

    const { prisma: db } = await prisma();
    const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found', code: 'NOT_FOUND' });

    const stripe = getStripe();
    const profile = {
      restaurantId: String(restaurantId),
      email: String(email),
      businessName: String(businessName),
      fullName: fullName ? String(fullName) : undefined,
    };

    if (restaurant.stripeAccount) {
      const existing = await stripe.accounts.retrieve(restaurant.stripeAccount);
      if (existing.charges_enabled) {
        const { linkRestaurantAccount } = await import('../lib/connect');
        await linkRestaurantAccount(db, restaurant.id, existing);
        return res.json({
          success: true,
          accountId: existing.id,
          chargesEnabled: true,
          payoutsEnabled: !!existing.payouts_enabled,
          mode: 'existing',
          message: 'Payment account is already ready.',
        });
      }
    }

    if (completeInTestMode === true) {
      const account = await provisionTestMerchant(stripe, db, restaurant.id, {
        ...profile,
        ip: req.ip || '127.0.0.1',
      });
      return res.json({
        success: true,
        accountId: account.id,
        chargesEnabled: !!account.charges_enabled,
        payoutsEnabled: !!account.payouts_enabled,
        detailsSubmitted: !!account.details_submitted,
        mode: 'test',
        message: account.charges_enabled
          ? 'Test payment account is ready. No real money will move.'
          : 'Test account was created but Stripe has not enabled charges yet.',
      });
    }

    const session = await startExpressOnboarding(stripe, db, restaurant, profile);
    return res.json({
      success: true,
      accountId: session.accountId,
      onboardingUrl: session.onboardingUrl,
      embeddedClientSecret: session.embeddedClientSecret,
      chargesEnabled: session.chargesEnabled,
      payoutsEnabled: session.payoutsEnabled,
      mode: 'express',
      message: 'Continue in Stripe to finish verification. Drift does not store your bank account.',
    });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get('/stripe/account-status/:accountId', async (req, res) => {
  try {
    const user = requireRestaurant(req, res);
    if (!user) return;
    const { prisma: db } = await prisma();
    const restaurant = await db.restaurant.findUnique({ where: { id: user.restaurantId } });
    if (!restaurant || restaurant.stripeAccount !== req.params.accountId) {
      return res.status(404).json({ error: 'Account not found', code: 'account_not_found' });
    }
    const account = await getStripe().accounts.retrieve(req.params.accountId);
    const { linkRestaurantAccount } = await import('../lib/connect');
    await linkRestaurantAccount(db, restaurant.id, account);
    const requirements = (account.requirements || {}) as {
      currently_due?: string[];
      eventually_due?: string[];
      past_due?: string[];
      pending_verification?: string[];
    };
    res.json({
      details_submitted: !!account.details_submitted,
      charges_enabled: !!account.charges_enabled,
      payouts_enabled: !!account.payouts_enabled,
      isOnboardingComplete: !!(account.details_submitted && account.charges_enabled && account.payouts_enabled),
      requirements: {
        currently_due: requirements.currently_due || [],
        eventually_due: requirements.eventually_due || [],
        past_due: requirements.past_due || [],
        pending_verification: requirements.pending_verification || [],
      },
    });
  } catch (error: any) {
    if (error?.code === 'resource_missing') {
      return res.status(404).json({ error: 'Account not found', code: 'account_not_found' });
    }
    sendError(res, error);
  }
});

router.get('/stripe/restaurants/:restaurantId/payouts', async (req, res) => {
  try {
    const user = requireRestaurant(req, res);
    if (!user) return;
    if (req.params.restaurantId !== user.restaurantId) {
      return res.status(403).json({ error: 'Unauthorized', code: 'FORBIDDEN' });
    }
    const { prisma: db } = await prisma();
    const restaurant = await db.restaurant.findUnique({ where: { id: user.restaurantId } });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found', code: 'NOT_FOUND' });
    const summary = await readBalanceAndPayouts(getStripe(), db, restaurant);
    const feeRate = await feeRateForRestaurant(db, restaurant.id);
    res.json({ ...summary, feeRate });
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/stripe/restaurants/:restaurantId/payouts', async (req, res) => {
  try {
    const user = requireRestaurant(req, res);
    if (!user) return;
    if (req.params.restaurantId !== user.restaurantId) {
      return res.status(403).json({ error: 'Unauthorized', code: 'FORBIDDEN' });
    }
    const requested = req.body?.amountCents;
    if (requested != null && (!Number.isInteger(requested) || requested <= 0)) {
      return res.status(400).json({ error: 'amountCents must be a positive integer', code: 'INVALID_AMOUNT' });
    }
    const { prisma: db } = await prisma();
    const restaurant = await db.restaurant.findUnique({ where: { id: user.restaurantId } });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found', code: 'NOT_FOUND' });
    const result = await createConnectedPayout(getStripe(), db, restaurant, requested);
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
});

router.get('/stripe/balance/:accountId', async (req, res) => {
  try {
    const user = requireRestaurant(req, res);
    if (!user) return;
    const { prisma: db } = await prisma();
    const restaurant = await db.restaurant.findUnique({ where: { id: user.restaurantId } });
    if (!restaurant || restaurant.stripeAccount !== req.params.accountId) {
      return res.status(404).json({ error: 'Account not found', code: 'account_not_found' });
    }
    const balance = await getStripe().balance.retrieve({ stripeAccount: req.params.accountId });
    res.json({
      available: balance.available.map((b) => ({ amount: b.amount / 100, currency: b.currency })),
      pending: balance.pending.map((b) => ({ amount: b.amount / 100, currency: b.currency })),
    });
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/stripe/login-link/:accountId', async (req, res) => {
  try {
    const user = requireRestaurant(req, res);
    if (!user) return;
    const { prisma: db } = await prisma();
    const restaurant = await db.restaurant.findUnique({ where: { id: user.restaurantId } });
    if (!restaurant || restaurant.stripeAccount !== req.params.accountId) {
      return res.status(404).json({ error: 'Account not found', code: 'account_not_found' });
    }
    const loginLink = await getStripe().accounts.createLoginLink(req.params.accountId);
    res.json({ url: loginLink.url });
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/stripe/payment', async (req, res) => {
  try {
    const { amount, restaurantStripeId, currency = 'usd' } = req.body || {};
    if (!amount || !restaurantStripeId) {
      return res.status(400).json({ error: 'Missing required fields', code: 'MISSING_FIELDS' });
    }
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(restaurantStripeId);
    const blocker = destinationChargeBlocker(account);
    if (blocker) return res.status(400).json(blocker);
    const amountInCents = Math.round(Number(amount) * 100);
    const built = buildDirectCharge({
      amountCents: amountInCents,
      destination: restaurantStripeId,
      feeRate: configuredBaseRate(),
      orderId: 'ad-hoc',
      restaurantId: String(account.metadata?.restaurantId || ''),
    });
    built.params.currency = currency;
    const paymentIntent = await stripe.paymentIntents.create(built.params, built.options);
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      connectedAccountId: restaurantStripeId,
    });
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/stripe/order/:orderId/create-payment-intent', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { customerId, tipPercent } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'Order ID required', code: 'MISSING_ORDER_ID' });

    const { prisma: db } = await prisma();
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found', code: 'ORDER_NOT_FOUND' });
    if (order.paymentStatus === 'PAID' || order.paymentStatus === 'REFUNDED') {
      return res.status(409).json({ error: 'This order is already paid.', code: 'ORDER_ALREADY_PAID' });
    }

    if (tipPercent != null) {
      try {
        const repriced = repriceTip(dollarsToCents(order.subtotal), dollarsToCents(order.taxAmount), Number(tipPercent));
        await db.order.update({
          where: { id: order.id },
          data: { tipAmount: repriced.tipAmount, tipPercent: repriced.tipPercent },
        });
        order.tipAmount = repriced.tipAmount;
        order.tipPercent = repriced.tipPercent;
      } catch (err: any) {
        return res.status(400).json({ error: err.message || 'Invalid tip', code: err.code || 'INVALID_TIP' });
      }
    }

    const destination = order.restaurant.stripeAccount;
    if (!destination) {
      return res.status(400).json({
        error: 'Restaurant is not set up for payments yet.',
        code: 'RESTAURANT_NO_STRIPE',
      });
    }

    const stripe = getStripe();
    let account: Stripe.Account;
    try {
      account = await stripe.accounts.retrieve(destination);
    } catch {
      return res.status(400).json({
        error: 'Restaurant payment account not found or not accessible.',
        code: 'INVALID_DESTINATION_ACCOUNT',
      });
    }
    const blocker = destinationChargeBlocker(account);
    if (blocker) return res.status(400).json(blocker);

    const amountCents = chargeAmountCents(order.total, order.tipAmount);
    if (amountCents <= 0) {
      return res.status(400).json({ error: 'Order total must be greater than zero', code: 'INVALID_AMOUNT' });
    }

    const feeRate = await feeRateForRestaurant(db, order.restaurantId, order.restaurant.platformFeeRate);
    const built = buildDirectCharge({
      amountCents,
      destination,
      feeRate,
      orderId: order.id,
      restaurantId: order.restaurantId,
      customerId: typeof customerId === 'string' ? customerId : undefined,
    });
    const paymentIntent = await stripe.paymentIntents.create(built.params, {
      ...built.options,
      idempotencyKey: `order_${order.id}_${amountCents}`,
    });

    await db.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: paymentIntent.id, paymentStatus: 'PROCESSING' },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amountCents,
      applicationFeeCents: built.params.application_fee_amount ?? 0,
      feeRate,
      connectedAccountId: destination,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      tipAmount: order.tipAmount,
      total: order.total,
      tipPercent: order.tipPercent,
    });
  } catch (error) {
    sendError(res, error);
  }
});

router.post('/stripe/webhook', async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).json({ error: 'Webhook not configured', code: 'WEBHOOK_NOT_CONFIGURED' });
  }
  const sig = req.headers['stripe-signature'];
  if (!sig || !Buffer.isBuffer(req.body)) {
    return res.status(400).json({ error: 'Invalid webhook payload', code: 'INVALID_PAYLOAD' });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (error) {
    console.error('[stripe] webhook signature failed:', error instanceof Error ? error.message : error);
    return res.status(400).json({ error: 'Invalid signature', code: 'INVALID_SIGNATURE' });
  }

  try {
    const { prisma: db, io } = await prisma();
    const result = await applyStripeEvent(event, db);
    if (result.orderId) {
      const order = await db.order.findUnique({ where: { id: result.orderId } });
      if (order) io.to(`restaurant:${order.restaurantId}`).emit('order-updated', order);
    }
    res.json({ received: true, duplicate: result.duplicate });
  } catch (error) {
    console.error('[stripe] webhook handler failed:', error);
    res.status(500).json({ error: 'Webhook handler failed', code: 'WEBHOOK_HANDLER_FAILED' });
  }
});

router.post('/stripe/disconnect/:accountId', async (req, res) => {
  try {
    const user = requireRestaurant(req, res);
    if (!user) return;
    const { prisma: db } = await prisma();
    const restaurant = await db.restaurant.findUnique({ where: { id: user.restaurantId } });
    if (!restaurant || restaurant.stripeAccount !== req.params.accountId) {
      return res.status(404).json({ error: 'Account not found', code: 'account_not_found' });
    }
    await getStripe().accounts.update(req.params.accountId, {
      metadata: { disconnected_at: new Date().toISOString(), disconnected_by: 'platform' },
    });
    await db.restaurant.update({
      where: { id: restaurant.id },
      data: { stripeAccount: null, chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false },
    });
    res.json({ success: true, message: 'Account disconnected' });
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
