import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

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
      user = await prisma.user.upsert({
        where: { email: authUser.email ?? undefined },
        update: { supabaseId: authUser.id, name: authUser.user_metadata?.name ?? authUser.email?.split('@')[0] },
        create: {
          email: authUser.email ?? undefined,
          name: authUser.user_metadata?.name ?? authUser.email?.split('@')[0] ?? 'User',
          supabaseId: authUser.id,
        },
      });
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

router.post('/p2p/create-intent', authenticateSupabase, async (req: Request & { dinerUser: DinerUser }, res) => {
  try {
    const prisma = await getPrisma();
    const { recipientEmail, amount, note } = req.body;
    const sender = req.dinerUser;
    if (!recipientEmail || !amount || typeof amount !== 'number' || amount < 0.5) {
      return res.status(400).json({ error: 'Recipient email and amount (min $0.50) required', code: 'MISSING_FIELDS' });
    }
    let recipient = await prisma.user.findUnique({ where: { email: recipientEmail.toLowerCase().trim() } });
    // In test mode, allow sending to a configured test recipient email; create placeholder if missing
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
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found. They need to sign up on Drift first.', code: 'RECIPIENT_NOT_FOUND' });
    }
    if (recipient.id === sender.id) {
      return res.status(400).json({ error: "You can't send money to yourself", code: 'SELF_TRANSFER' });
    }
    const amountCents = Math.round(amount * 100);
    const feeCents = 0;
    const totalCents = amountCents;

    const senderUser = await prisma.user.findUnique({ where: { id: sender.id } });
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
    if (senderUser?.stripeCustomerId) {
      piParams.customer = senderUser.stripeCustomerId;
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
