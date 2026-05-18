import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { BASE_RATE } from '../lib/rates';

const router = Router();

async function getPrisma() {
  const { prisma } = await import('../index');
  return prisma;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// No fee on sender — monetize elsewhere (restaurant %, premium, etc.)
const P2P_FEE_PERCENT = 0;
const P2P_FEE_FIXED_CENTS = 0;

export type DinerUser = { id: string; email: string | null; name: string | null };

export async function authenticateSupabase(req: Request & { dinerUser?: DinerUser }, res: Response, next: () => void) {
  if (!supabase) {
    return res.status(503).json({ error: 'P2P is not configured', code: 'P2P_DISABLED' });
  }
  const token = req.headers['authorization']?.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return res.status(401).json({ error: 'Sign in to send money', code: 'UNAUTHORIZED' });
  }
  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) {
      return res.status(401).json({ error: 'Invalid or expired session', code: 'INVALID_TOKEN' });
    }
    const prisma = await getPrisma();
    let user = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
    if (!user) {
      const name = authUser.user_metadata?.name as string | undefined;
      if (authUser.email) {
        user = await prisma.user.upsert({
          where: { email: authUser.email },
          update: { supabaseId: authUser.id, name: name ?? authUser.email?.split('@')[0] },
          create: {
            email: authUser.email,
            name: name ?? authUser.email?.split('@')[0] ?? 'User',
            supabaseId: authUser.id,
          },
        });
      } else if (authUser.phone) {
        user = await prisma.user.upsert({
          where: { phone: authUser.phone },
          update: { supabaseId: authUser.id, name: name ?? undefined },
          create: {
            phone: authUser.phone,
            name: name ?? 'User',
            supabaseId: authUser.id,
          },
        });
      } else {
        user = await prisma.user.create({
          data: { name: name ?? 'User', supabaseId: authUser.id },
        });
      }
    } else if (!user.supabaseId) {
      await prisma.user.update({ where: { id: user.id }, data: { supabaseId: authUser.id } });
    }
    req.dinerUser = { id: user.id, email: user.email, name: user.name };
    next();
  } catch (e: any) {
    console.error('Supabase auth error:', e?.message);
    return res.status(401).json({ error: 'Authentication failed', code: 'AUTH_FAILED' });
  }
}

// UUID v4 regex for Supabase user IDs
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

router.post('/p2p/create-intent', authenticateSupabase, async (_req: Request & { dinerUser: DinerUser }, res) => {
  // P2P send-money is no longer supported with Stripe in this platform.
  return res.status(503).json({ error: 'P2P is disabled', code: 'P2P_DISABLED' });
});

// P2P recipient onboarding — create Stripe Connect Express account to receive payouts
router.post('/p2p/onboard', authenticateSupabase, async (_req: Request & { dinerUser: DinerUser }, res) => {
  // P2P payout onboarding is no longer supported with Stripe in this platform.
  return res.status(503).json({ error: 'P2P is disabled', code: 'P2P_DISABLED' });
});

// Legacy merchant-payment path (disabled).
router.post('/p2p/merchant-payment', authenticateSupabase, async (_req: Request & { dinerUser: DinerUser }, res) => {
  // External P2P merchant payments are no longer supported with Stripe in this platform.
  return res.status(503).json({ error: 'P2P is disabled', code: 'P2P_DISABLED' });
});

// Resolve recipient by Supabase User ID (for partner apps using recipient_id)
router.get('/p2p/recipient-info', authenticateSupabase, async (_req: Request & { dinerUser: DinerUser }, res) => {
  // P2P recipient lookup is no longer supported with Stripe in this platform.
  return res.status(503).json({ error: 'P2P is disabled', code: 'P2P_DISABLED' });
});

// Legacy balance path (disabled).
router.get('/p2p/balance', authenticateSupabase, async (_req: Request & { dinerUser: DinerUser }, res) => {
  // P2P balance is no longer supported with Stripe in this platform.
  return res.status(503).json({ error: 'P2P is disabled', code: 'P2P_DISABLED' });
});

// Withdraw balance to bank
router.post('/p2p/withdraw', authenticateSupabase, async (_req: Request & { dinerUser: DinerUser }, res) => {
  // P2P withdraw to bank is no longer supported with Stripe in this platform.
  return res.status(503).json({ error: 'P2P is disabled', code: 'P2P_DISABLED' });
});

// Check if user has payout account
router.get('/p2p/has-payout-account', authenticateSupabase, async (_req: Request & { dinerUser: DinerUser }, res) => {
  // P2P payout accounts are no longer supported with Stripe in this platform.
  return res.status(503).json({ error: 'P2P is disabled', code: 'P2P_DISABLED' });
});

// Create SetupIntent for saving card (onboarding)
router.post('/diner/setup-intent', authenticateSupabase, async (req: Request & { dinerUser: DinerUser }, res) => {
  try {
    const prisma = await getPrisma();
    let user = await prisma.user.findUnique({ where: { id: req.dinerUser.id } });
    if (!user) return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        metadata: { driftUserId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: { driftUserId: user.id },
    });

    res.json({ clientSecret: setupIntent.client_secret });
  } catch (e: any) {
    console.error('Diner setup-intent error:', e?.message);
    res.status(500).json({ error: e?.message || 'Failed to set up payment', code: 'SERVER_ERROR' });
  }
});

// Check if diner has saved payment method
router.get('/diner/has-payment-method', authenticateSupabase, async (req: Request & { dinerUser: DinerUser }, res) => {
  try {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({ where: { id: req.dinerUser.id } });
    if (!user?.stripeCustomerId) {
      return res.json({ hasPaymentMethod: false });
    }
    const methods = await stripe.paymentMethods.list({ customer: user.stripeCustomerId, type: 'card' });
    res.json({ hasPaymentMethod: methods.data.length > 0 });
  } catch (e: any) {
    console.error('Diner has-payment-method error:', e?.message);
    res.status(500).json({ error: 'Failed to check payment method', code: 'SERVER_ERROR' });
  }
});

// Get default payment method for diner (for one-tap pay)
router.get('/diner/default-payment-method', authenticateSupabase, async (req: Request & { dinerUser: DinerUser }, res) => {
  try {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({ where: { id: req.dinerUser.id } });
    if (!user?.stripeCustomerId) {
      return res.json({ paymentMethodId: null });
    }
    const methods = await stripe.paymentMethods.list({ customer: user.stripeCustomerId, type: 'card' });
    res.json({ paymentMethodId: methods.data[0]?.id ?? null });
  } catch (e: any) {
    console.error('Diner default-payment-method error:', e?.message);
    res.status(500).json({ error: 'Failed to get payment method', code: 'SERVER_ERROR' });
  }
});

// Get diner loyalty for a restaurant (requires sign-in)
router.get('/diner/loyalty', authenticateSupabase, async (req: Request & { dinerUser: DinerUser }, res) => {
  try {
    const restaurantId = req.query.restaurantId as string;
    if (!restaurantId) return res.status(400).json({ error: 'restaurantId required', code: 'MISSING_FIELDS' });
    const prisma = await getPrisma();
    const loyalty = await prisma.dinerLoyalty.findUnique({
      where: { restaurantId_userId: { restaurantId, userId: req.dinerUser.id } },
    });
    if (!loyalty) {
      return res.json({ points: 0, tier: 'BRONZE', pointsToNextReward: 50 });
    }
    const pointsToNextReward = 50 - (loyalty.points % 50); // Every 50 pts = reward
    res.json({
      points: loyalty.points,
      tier: loyalty.tier,
      pointsToNextReward: pointsToNextReward === 50 ? 50 : pointsToNextReward,
    });
  } catch (e: any) {
    console.error('Diner loyalty error:', e?.message);
    res.status(500).json({ error: 'Failed to load loyalty', code: 'SERVER_ERROR' });
  }
});

// Get diner profile (id for orders, stripeCustomerId for payment)
router.get('/diner/me', authenticateSupabase, async (req: Request & { dinerUser: DinerUser }, res) => {
  try {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: req.dinerUser.id },
      select: { id: true, email: true, name: true, stripeCustomerId: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    const methods = user.stripeCustomerId
      ? await stripe.paymentMethods.list({ customer: user.stripeCustomerId, type: 'card' })
      : { data: [] };
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      stripeCustomerId: user.stripeCustomerId,
      hasPaymentMethod: methods.data.length > 0,
    });
  } catch (e: any) {
    console.error('Diner me error:', e?.message);
    res.status(500).json({ error: 'Failed to get profile', code: 'SERVER_ERROR' });
  }
});

router.get('/p2p/transfers', authenticateSupabase, async (_req: Request & { dinerUser: DinerUser }, res) => {
  // P2P transfer history is no longer supported with Stripe in this platform.
  return res.status(503).json({ error: 'P2P is disabled', code: 'P2P_DISABLED' });
});

export default router;
