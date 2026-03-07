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

router.post('/p2p/create-intent', authenticateSupabase, async (req: Request & { dinerUser: DinerUser }, res) => {
  try {
    const prisma = await getPrisma();
    const { recipientEmail, recipientId, amount, note } = req.body;
    const sender = req.dinerUser;
    if (!amount || typeof amount !== 'number' || amount < 0.5) {
      return res.status(400).json({ error: 'Amount (min $0.50) required', code: 'MISSING_FIELDS' });
    }
    let recipient: { id: string; email: string | null; stripeAccountId: string | null } | null = null;
    if (recipientId && typeof recipientId === 'string' && UUID_REGEX.test(recipientId.trim())) {
      recipient = await prisma.user.findUnique({ where: { supabaseId: recipientId.trim() } });
    }
    if (!recipient && recipientEmail && typeof recipientEmail === 'string' && recipientEmail.includes('@')) {
      recipient = await prisma.user.findUnique({ where: { email: recipientEmail.toLowerCase().trim() } });
      const testRecipientEmail = process.env.TEST_P2P_RECIPIENT_EMAIL?.toLowerCase().trim();
      const isTestEnv = (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_test_');
      if (!recipient && isTestEnv && testRecipientEmail && recipientEmail.toLowerCase().trim() === testRecipientEmail) {
      recipient = await prisma.user.upsert({
        where: { email: testRecipientEmail },
        update: {},
        create: {
          email: testRecipientEmail,
          name: 'Test Recipient',
        },
      });
      }
    }
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found. They need to sign up on Drift first.', code: 'RECIPIENT_NOT_FOUND' });
    }
    if (recipient.id === sender.id) {
      return res.status(400).json({ error: "You can't send money to yourself", code: 'SELF_TRANSFER' });
    }
    const amountCents = Math.round(amount * 100);
    const feeCents = 0;
    const totalCents = amountCents;

    const senderUser = await prisma.user.findUnique({ where: { id: sender.id }, select: { balanceCents: true, stripeCustomerId: true } });
    if (senderUser && (senderUser.balanceCents ?? 0) >= totalCents) {
      await prisma.$transaction([
        prisma.user.update({ where: { id: sender.id }, data: { balanceCents: { decrement: totalCents } } }),
        prisma.user.update({ where: { id: recipient.id }, data: { balanceCents: { increment: totalCents } } }),
        prisma.p2PTransfer.create({
          data: {
            senderId: sender.id,
            recipientId: recipient.id,
            amountCents: totalCents,
            feeCents: 0,
            note: (note || '').slice(0, 500) || null,
            status: 'SUCCEEDED',
          },
        }),
      ]);
      return res.json({ usedBalance: true, amountCents: totalCents });
    }

    const piParams: Stripe.PaymentIntentCreateParams = {
      amount: totalCents,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        p2p: '1',
        senderId: sender.id,
        recipientId: recipient.id,
        amountCents: String(amountCents),
        feeCents: String(feeCents),
        note: (note || '').slice(0, 500),
      },
    };
    const senderForStripe = await prisma.user.findUnique({ where: { id: sender.id }, select: { stripeCustomerId: true } });
    if (senderForStripe?.stripeCustomerId) {
      piParams.customer = senderForStripe.stripeCustomerId;
      piParams.setup_future_usage = 'off_session';
    }
    const paymentIntent = await stripe.paymentIntents.create(piParams);
    res.json({
      clientSecret: paymentIntent.client_secret,
      amountCents,
      feeCents,
      totalCents,
    });
  } catch (e: any) {
    console.error('P2P create-intent error:', e?.message);
    res.status(500).json({
      error: e?.message || 'Failed to create payment',
      code: 'SERVER_ERROR',
    });
  }
});

// P2P recipient onboarding — create Stripe Connect Express account to receive payouts
router.post('/p2p/onboard', authenticateSupabase, async (req: Request & { dinerUser: DinerUser }, res) => {
  try {
    const prisma = await getPrisma();
    const { returnUrl, refreshUrl } = req.body;
    const baseUrl = returnUrl || refreshUrl || 'http://localhost:5173';
    const return_url = returnUrl || `${baseUrl}/pay`;
    const refresh_url = refreshUrl || `${baseUrl}/pay`;
    const user = await prisma.user.findUnique({ where: { id: req.dinerUser.id } });
    if (!user) return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    if (user.stripeAccountId) {
      return res.json({ alreadyOnboarded: true, accountId: user.stripeAccountId });
    }
    const email = user.email || user.phone || `user-${user.id}@drift.local`;
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email,
      capabilities: { transfers: { requested: true } },
      metadata: { driftUserId: user.id, platform: 'Drift P2P' },
    });
    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refresh_url,
      return_url: return_url,
      type: 'account_onboarding',
    });
    res.json({ url: link.url, accountId: account.id });
  } catch (e: any) {
    console.error('P2P onboard error:', e?.message);
    res.status(500).json({ error: e?.message || 'Failed to start onboarding', code: 'SERVER_ERROR' });
  }
});

// Merchant payment — pay for things (beer app, etc.). Amount + destination Stripe Connect account.
router.post('/p2p/merchant-payment', authenticateSupabase, async (req: Request & { dinerUser: DinerUser }, res) => {
  try {
    const { amount, destination, metadata, currency = 'usd' } = req.body;
    if (!amount || typeof amount !== 'number' || amount < 0.5) {
      return res.status(400).json({ error: 'Amount required (min $0.50)', code: 'MISSING_FIELDS' });
    }
    const dest = typeof destination === 'string' ? destination.trim() : '';
    if (!dest || !dest.startsWith('acct_')) {
      return res.status(400).json({ error: 'Valid destination (Stripe Connect account ID) required', code: 'MISSING_FIELDS' });
    }
    const amountCents = Math.round(amount * 100);
    const feeCents = Math.round(amountCents * BASE_RATE);
    const piParams: Stripe.PaymentIntentCreateParams = {
      amount: amountCents,
      currency,
      payment_method_types: ['card'],
      transfer_data: { destination: dest },
      application_fee_amount: feeCents,
      metadata: {
        platform: 'Drift',
        source: 'integration',
        payerId: req.dinerUser.id,
        ...(typeof metadata === 'object' && metadata !== null ? metadata : {}),
      },
    };
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({ where: { id: req.dinerUser.id } });
    if (user?.stripeCustomerId) {
      piParams.customer = user.stripeCustomerId;
      piParams.setup_future_usage = 'off_session';
    }
    const paymentIntent = await stripe.paymentIntents.create(piParams);
    res.json({ clientSecret: paymentIntent.client_secret, amountCents });
  } catch (e: any) {
    console.error('Merchant payment error:', e?.message);
    res.status(500).json({ error: e?.message || 'Failed to create payment', code: 'SERVER_ERROR' });
  }
});

// Resolve recipient by Supabase User ID (for partner apps using recipient_id)
router.get('/p2p/recipient-info', authenticateSupabase, async (req: Request & { dinerUser: DinerUser }, res) => {
  try {
    const recipientId = req.query.recipient_id;
    if (!recipientId || typeof recipientId !== 'string' || !UUID_REGEX.test(recipientId.trim())) {
      return res.status(400).json({ error: 'Valid recipient_id (UUID) required', code: 'MISSING_FIELDS' });
    }
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({
      where: { supabaseId: recipientId.trim() },
      select: { email: true, name: true },
    });
    if (!user) {
      return res.status(404).json({ error: 'Recipient not found. They need to sign up on Drift first.', code: 'RECIPIENT_NOT_FOUND' });
    }
    res.json({ email: user.email, name: user.name });
  } catch (e: any) {
    console.error('P2P recipient-info error:', e?.message);
    res.status(500).json({ error: 'Failed to resolve recipient', code: 'SERVER_ERROR' });
  }
});

// Get user balance (for Taproom / Beer money)
router.get('/p2p/balance', authenticateSupabase, async (req: Request & { dinerUser: DinerUser }, res) => {
  try {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({ where: { id: req.dinerUser.id }, select: { balanceCents: true } });
    const balanceCents = user?.balanceCents ?? 0;
    res.json({ balanceCents, balance: balanceCents / 100, currency: 'usd' });
  } catch (e: any) {
    console.error('P2P balance error:', e?.message);
    res.status(500).json({ error: 'Failed to get balance', code: 'SERVER_ERROR' });
  }
});

// Withdraw balance to bank
router.post('/p2p/withdraw', authenticateSupabase, async (req: Request & { dinerUser: DinerUser }, res) => {
  try {
    const prisma = await getPrisma();
    const { amount } = req.body;
    const amountCents = typeof amount === 'number' ? Math.round(amount * 100) : Math.round((parseFloat(String(amount)) || 0) * 100);
    if (amountCents < 100) {
      return res.status(400).json({ error: 'Minimum withdraw is $1', code: 'MIN_AMOUNT' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.dinerUser.id }, select: { balanceCents: true, stripeAccountId: true } });
    if (!user) return res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' });
    if (!user.stripeAccountId) {
      return res.status(400).json({ error: 'Add a bank account in Settings to withdraw', code: 'NO_PAYOUT_ACCOUNT' });
    }
    if ((user.balanceCents ?? 0) < amountCents) {
      return res.status(400).json({ error: 'Insufficient balance', code: 'INSUFFICIENT_BALANCE' });
    }
    await stripe.transfers.create({
      amount: amountCents,
      currency: 'usd',
      destination: user.stripeAccountId,
      metadata: { driftUserId: req.dinerUser.id, type: 'withdraw' },
    });
    await prisma.user.update({
      where: { id: req.dinerUser.id },
      data: { balanceCents: { decrement: amountCents } },
    });
    res.json({ success: true, amountCents, message: 'Withdrawal initiated. Funds arrive in 2–3 business days.' });
  } catch (e: any) {
    console.error('P2P withdraw error:', e?.message);
    res.status(500).json({ error: e?.message || 'Withdrawal failed', code: 'SERVER_ERROR' });
  }
});

// Check if user has payout account
router.get('/p2p/has-payout-account', authenticateSupabase, async (req: Request & { dinerUser: DinerUser }, res) => {
  try {
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({ where: { id: req.dinerUser.id }, select: { stripeAccountId: true } });
    res.json({ hasPayoutAccount: !!user?.stripeAccountId });
  } catch (e: any) {
    console.error('P2P has-payout-account error:', e?.message);
    res.status(500).json({ error: 'Failed to check', code: 'SERVER_ERROR' });
  }
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

router.get('/p2p/transfers', authenticateSupabase, async (req: Request & { dinerUser: DinerUser }, res) => {
  try {
    const prisma = await getPrisma();
    const userId = req.dinerUser.id;
    const [sent, received] = await Promise.all([
      prisma.p2PTransfer.findMany({
        where: { senderId: userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { recipient: { select: { id: true, email: true, name: true } } },
      }),
      prisma.p2PTransfer.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { sender: { select: { id: true, email: true, name: true } } },
      }),
    ]);
    res.json({
      sent: sent.map((t) => ({
        id: t.id,
        recipient: t.recipient,
        amountCents: t.amountCents,
        feeCents: t.feeCents,
        note: t.note,
        status: t.status,
        createdAt: t.createdAt,
      })),
      received: received.map((t) => ({
        id: t.id,
        sender: t.sender,
        amountCents: t.amountCents,
        note: t.note,
        status: t.status,
        createdAt: t.createdAt,
      })),
    });
  } catch (e: any) {
    console.error('P2P transfers error:', e?.message);
    res.status(500).json({ error: 'Failed to load transfers', code: 'SERVER_ERROR' });
  }
});

export default router;
