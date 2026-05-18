import { Router } from 'express';
import Stripe from 'stripe';
import express from 'express';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

import { BASE_RATE, getRateForVolume } from '../lib/rates';

/** Returns the platform fee rate for a restaurant (volume discount if over threshold). */
async function getFeeRateForRestaurant(restaurantId: string): Promise<number> {
  const { prisma } = await import('../index');
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const result = await prisma.order.aggregate({
    where: {
      restaurantId,
      status: 'COMPLETED',
      completedAt: { gte: startOfMonth }
    },
    _sum: { total: true }
  });
  const monthlyTotal = result._sum.total ?? 0;
  return getRateForVolume(monthlyTotal);
}

// Helper function to safely parse strings
const safeString = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

// Helper function to extract name parts
const extractNameParts = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || firstName;
  return { firstName, lastName };
};

// Create Stripe account with embedded onboarding
router.post('/stripe/connect', async (req, res) => {
  try {
    const { email, name, restaurantId, tier } = req.body;

    if (!email || !name || !restaurantId) {
      return res.status(400).json({ error: 'Missing required fields', code: 'MISSING_FIELDS' });
    }

    const account = await stripe.accounts.create({
      type: 'express',
      email: safeString(email),
      business_profile: { 
        name: safeString(name), 
        url: `https://driftpos.com/restaurant/${safeString(restaurantId)}` 
      },
      metadata: { 
        restaurantId: safeString(restaurantId), 
        tier: tier || 'free', 
        platform: 'Drift POS' 
      },
      capabilities: { 
        card_payments: { requested: true }, 
        transfers: { requested: true } 
      },
    });

    const session = await stripe.accountSessions.create({
      account: account.id,
      components: { 
        account_onboarding: { 
          enabled: true, 
          features: { external_account_collection: true } 
        } 
      },
    });

    res.json({ clientSecret: session.client_secret, accountId: account.id });
  } catch (error: any) {
    console.error('❌ Stripe connect error:', error);
    
    if (error.code === 'resource_already_exists') {
      return res.status(400).json({ error: 'Email already registered', code: 'duplicate_email' });
    }
    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({ error: 'Too many requests', code: 'rate_limit' });
    }
    
    res.status(500).json({ 
      error: 'Failed to create account', 
      code: 'server_error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create Stripe account with simplified form (collects all required data)
router.post('/stripe/create-account', async (req, res) => {
  try {
    const {
      restaurantId,
      email,
      businessName,
      fullName,
      phone,
      address,
      taxId,
      website,
      bankAccount,
      dob,
      ssnLast4,
      tosAcceptance // kept for our own records if we want, but NOT sent to Stripe for Express accounts
    } = req.body;

    console.log('📝 Received account creation request:', { 
      restaurantId, 
      email, 
      businessName,
      hasBankAccount: !!bankAccount,
      hasDob: !!dob,
      hasSsn: !!ssnLast4
    });

    // Required fields for API contract & tests. Frontend should already validate,
    // but we also enforce on the server so behavior is consistent everywhere.
    const missingFields = [];
    if (!restaurantId) missingFields.push('restaurantId');
    if (!email) missingFields.push('email');
    if (!businessName) missingFields.push('businessName');
    if (!fullName) missingFields.push('fullName');
    if (!bankAccount) missingFields.push('bankAccount');
    if (!dob) missingFields.push('dob');
    if (!ssnLast4) missingFields.push('ssnLast4');
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        code: 'MISSING_FIELDS',
        missing: missingFields,
      });
    }

    // Validate DOB shape and reasonable range before touching Stripe.
    if (dob) {
      const monthNum = parseInt(String(dob.month), 10);
      const dayNum = parseInt(String(dob.day), 10);
      const yearNum = parseInt(String(dob.year), 10);
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 120;
      const maxYear = currentYear - 18;
      const invalidDob =
        Number.isNaN(monthNum) ||
        monthNum < 1 ||
        monthNum > 12 ||
        Number.isNaN(dayNum) ||
        dayNum < 1 ||
        dayNum > 31 ||
        Number.isNaN(yearNum) ||
        yearNum < minYear ||
        yearNum > maxYear;
      if (invalidDob) {
        return res.status(400).json({
          error: 'Invalid date of birth',
          code: 'INVALID_DOB',
        });
      }
    }

    // Validate SSN last 4 (must be exactly 4 digits).
    if (ssnLast4) {
      const ssnDigits = String(ssnLast4).replace(/\D/g, '');
      if (ssnDigits.length !== 4) {
        return res.status(400).json({
          error: 'Invalid SSN last 4',
          code: 'INVALID_SSN',
        });
      }
    }

    // Validate payout address basics; zip must be 5 or 9 digits.
    if (address) {
      const line1 = String(address.line1 || '').trim();
      const city = String(address.city || '').trim();
      const state = String(address.state || '').trim();
      const postal = String(address.postal_code || '');
      const zipDigits = postal.replace(/\D/g, '');
      const invalidAddress =
        !line1 ||
        !city ||
        !state ||
        (zipDigits.length !== 5 && zipDigits.length !== 9);
      if (invalidAddress) {
        return res.status(400).json({
          error: 'Invalid payout address',
          code: 'INVALID_ADDRESS',
        });
      }
    }

    // Create Stripe connected account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: safeString(email),
      business_profile: {
        name: safeString(businessName),
        url: website || `https://driftpos.com/restaurant/${safeString(restaurantId)}`,
        mcc: '5812',
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        restaurantId: safeString(restaurantId),
        platform: 'Drift POS',
        createdAt: new Date().toISOString(),
      },
      // For Express accounts, Stripe must collect and record TOS acceptance itself.
      // We do NOT send tos_acceptance here, or Stripe will reject the request when
      // controller[requirement_collection] is "stripe".
      tos_acceptance: undefined,
    });

    console.log(`✅ Stripe account created: ${account.id}`);

    // Create a one-time onboarding link so the restaurant can finish any remaining requirements.
    let onboardingUrl: string | undefined;
    let embeddedClientSecret: string | undefined;
    try {
      // Must match the restaurant web app (Stripe sends the user here after hosted onboarding).
      const restaurantBaseUrl =
        process.env.RESTAURANT_ONBOARDING_BASE_URL ||
        process.env.RESTAURANT_URL ||
        process.env.RESTAURANT_WEB_URL ||
        'http://localhost:5175';
      const link = await stripe.accountLinks.create({
        account: account.id,
        type: 'account_onboarding',
        refresh_url: `${restaurantBaseUrl}/onboarding?restaurantId=${encodeURIComponent(
          safeString(restaurantId)
        )}&step=bank`,
        return_url: `${restaurantBaseUrl}/onboarding?restaurantId=${encodeURIComponent(
          safeString(restaurantId)
        )}&step=complete`,
      });
      onboardingUrl = link.url;
      console.log('✅ Stripe onboarding link created for account', account.id);
    } catch (linkError: any) {
      console.error('⚠️ Stripe onboarding link error:', linkError?.message || linkError);
    }

    // Also create an embedded onboarding session so we can show Stripe onboarding
    // in a popup/modal without navigating away from Drift.
    try {
      const session = await stripe.accountSessions.create({
        account: account.id,
        components: {
          account_onboarding: {
            enabled: true,
            // Allow Stripe to collect external account (bank) details if needed.
            features: { external_account_collection: true },
          },
        },
      });
      embeddedClientSecret = session.client_secret ?? undefined;
      console.log('✅ Stripe embedded onboarding session created for account', account.id);
    } catch (sessionError: any) {
      console.error('⚠️ Stripe embedded onboarding session error:', sessionError?.message || sessionError);
    }

    // Respond immediately so the client doesn't wait for DB
    res.json({
      success: true,
      accountId: account.id,
      onboardingUrl,
      embeddedClientSecret,
      message: 'Payment account created successfully'
    });

    // Save Stripe account ID to database in background (non-blocking)
    const rid = safeString(restaurantId);
    const aid = account.id;
    setImmediate(async () => {
      try {
        const { prisma } = await import('../index');
        const result = await prisma.restaurant.updateMany({
          where: { id: rid },
          data: { stripeAccount: aid },
        });
        if (result.count === 0) {
          console.warn(
            `[stripe] No restaurant row for id "${rid}"; Connect account ${aid} was not linked in the database.`
          );
          try {
            await stripe.accounts.update(aid, {
              metadata: { db_link_missing: 'true', restaurantId: rid },
            });
          } catch (_) {}
        } else {
          console.log(`✅ Restaurant ${rid} updated with Stripe account ID`);
        }
      } catch (dbError: any) {
        console.error('⚠️ Database update failed:', dbError.message);
        try {
          await stripe.accounts.update(aid, {
            metadata: {
              db_update_error: dbError.message,
              restaurantId: rid,
            },
          });
        } catch (_) {}
      }
    });

  } catch (error: any) {
    console.error('❌ Stripe account creation error:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    if (error.type === 'StripeInvalidRequestError') {
      if (error.code === 'resource_already_exists') {
        return res.status(400).json({
          error: 'This email is already associated with another payment account.',
          code: 'duplicate_email'
        });
      }
      const msg = String(error.message || '');
      if (msg.includes('Invalid Tax ID') || msg.includes('not an allowed value')) {
        return res.status(400).json({
          error:
            process.env.NODE_ENV === 'production'
              ? 'That SSN or Tax ID was not accepted. Use the value Stripe requests in the verification step.'
              : 'That SSN or Tax ID is not accepted. Use your real last four digits, or in Stripe test mode try 0000 when Stripe allows it.',
          code: 'invalid_tax_id',
        });
      }
      return res.status(400).json({
        error: error.message,
        code: error.code || 'stripe_error'
      });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({ 
        error: 'Too many requests', 
        code: 'rate_limit' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create payment account', 
      code: 'server_error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Check account status - COMPLETELY FIXED TYPE ERRORS
router.get('/stripe/account-status/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    if (!accountId) return res.status(400).json({ error: 'Account ID required', code: 'missing_account_id' });

    const account = await stripe.accounts.retrieve(accountId);
    
    // Use type assertion to tell TypeScript the shape of requirements
    const requirements = (account.requirements || {}) as {
      currently_due?: string[];
      eventually_due?: string[];
      past_due?: string[];
      pending_verification?: string[];
    };
    
    // Safe access with fallbacks
    const currentlyDue = requirements.currently_due || [];
    const eventuallyDue = requirements.eventually_due || [];
    const pastDue = requirements.past_due || [];
    const pendingVerification = requirements.pending_verification || [];
    
    res.json({
      details_submitted: account.details_submitted || false,
      charges_enabled: account.charges_enabled || false,
      payouts_enabled: account.payouts_enabled || false,
      isOnboardingComplete: !!(account.details_submitted && account.charges_enabled && account.payouts_enabled),
      requirements: {
        currently_due: currentlyDue,
        eventually_due: eventuallyDue,
        past_due: pastDue,
        pending_verification: pendingVerification
      }
    });
  } catch (error: any) {
    console.error('❌ Account status error:', error);
    if (error.code === 'resource_missing') {
      return res.status(404).json({ error: 'Account not found', code: 'account_not_found' });
    }
    res.status(500).json({ error: 'Failed to check status', code: 'server_error' });
  }
});

// Get balance
router.get('/stripe/balance/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const balance = await stripe.balance.retrieve({ stripeAccount: accountId });
    res.json({
      available: balance.available.map(b => ({ amount: b.amount / 100, currency: b.currency })),
      pending: balance.pending.map(b => ({ amount: b.amount / 100, currency: b.currency }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch balance', code: 'server_error' });
  }
});

// Create login link
router.post('/stripe/login-link/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    res.json({ url: loginLink.url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create login link', code: 'server_error' });
  }
});

// Process payment (generic: amount + destination)
router.post('/stripe/payment', async (req, res) => {
  try {
    const { amount, restaurantStripeId, currency = 'usd' } = req.body;
    if (!amount || !restaurantStripeId) {
      return res.status(400).json({ error: 'Missing required fields', code: 'MISSING_FIELDS' });
    }

    // Validate that the destination account can actually receive transfers.
    // This avoids the opaque "insufficient_capabilities_for_transfer" Stripe errors.
    let account: any;
    try {
      account = await stripe.accounts.retrieve(restaurantStripeId);
    } catch (err: any) {
      console.error('❌ Failed to retrieve destination Stripe account:', err);
      return res.status(400).json({
        error: 'Destination payment account not found or not accessible.',
        code: 'INVALID_DESTINATION_ACCOUNT'
      });
    }

    const caps = account.capabilities || {};
    const hasTransferCapability =
      caps.transfers === 'active' ||
      caps.crypto_transfers === 'active' ||
      caps.legacy_payments === 'active';

    if (!hasTransferCapability) {
      console.warn('⚠️ Destination account lacks required transfer capabilities:', {
        accountId: account.id,
        capabilities: caps
      });
      return res.status(400).json({
        error:
          'This payment account is not fully enabled to receive transfers yet. Finish Stripe onboarding and enable payouts, then try again.',
        code: 'DESTINATION_INSUFFICIENT_CAPABILITIES'
      });
    }

    const amountInCents = Math.round(amount * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      transfer_data: { destination: restaurantStripeId },
      application_fee_amount: Math.round(amountInCents * BASE_RATE),
      metadata: { platform: 'Drift POS' }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('❌ Payment error:', error);
    res.status(500).json({
      error: 'Payment failed',
      code: 'payment_error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create a PaymentIntent for an existing order (diner checkout). Transfers to restaurant's connected account.
router.post('/stripe/order/:orderId/create-payment-intent', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { customerId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'Order ID required', code: 'MISSING_ORDER_ID' });

    const { prisma } = await import('../index');
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true }
    });
    if (!order) return res.status(404).json({ error: 'Order not found', code: 'ORDER_NOT_FOUND' });

    const stripeAccount = order.restaurant.stripeAccount ?? null;
    if (!stripeAccount) {
      return res.status(400).json({
        error: 'Restaurant is not set up for payments yet.',
        code: 'RESTAURANT_NO_STRIPE'
      });
    }

    // Ensure the restaurant's connected account can actually receive transfers.
    let account: any;
    try {
      account = await stripe.accounts.retrieve(stripeAccount);
    } catch (err: any) {
      console.error('❌ Failed to retrieve destination Stripe account for order:', orderId, err);
      return res.status(400).json({
        error: 'Restaurant payment account not found or not accessible.',
        code: 'INVALID_DESTINATION_ACCOUNT'
      });
    }

    const caps = account.capabilities || {};
    const hasTransferCapability =
      caps.transfers === 'active' ||
      caps.crypto_transfers === 'active' ||
      caps.legacy_payments === 'active';

    if (!hasTransferCapability) {
      console.warn('⚠️ Restaurant account lacks required transfer capabilities for order:', {
        orderId,
        accountId: account.id,
        capabilities: caps
      });
      return res.status(400).json({
        error:
          'This restaurant payment account is not fully enabled to receive transfers yet. Finish Stripe onboarding and enable payouts, then try again.',
        code: 'DESTINATION_INSUFFICIENT_CAPABILITIES'
      });
    }

    const amount = order.total + (order.tipAmount ?? 0);
    if (amount <= 0) return res.status(400).json({ error: 'Order total must be greater than zero', code: 'INVALID_AMOUNT' });

    const feeRate = await getFeeRateForRestaurant(order.restaurantId);
    const amountInCents = Math.round(amount * 100);
    const piParams: any = {
      amount: amountInCents,
      currency: 'usd',
      payment_method_types: ['card'],
      transfer_data: { destination: stripeAccount },
      application_fee_amount: Math.round(amountInCents * feeRate),
      metadata: { orderId, platform: 'Drift POS' }
    };
    if (customerId && typeof customerId === 'string') {
      piParams.customer = customerId;
      piParams.setup_future_usage = 'off_session';
    }
    const paymentIntent = await stripe.paymentIntents.create(piParams);

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('❌ Create payment intent error:', error);
    res.status(500).json({
      error: 'Failed to create payment',
      code: 'server_error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Webhook
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) return res.status(400).json({ error: 'Webhook not configured' });

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig!, webhookSecret);
    
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as { id: string; metadata?: { driftUserId?: string }; payouts_enabled?: boolean };
        const userId = account.metadata?.driftUserId;
        if (userId && account.payouts_enabled) {
          try {
            const { prisma } = await import('../index');
            await prisma.user.update({
              where: { id: userId },
              data: { stripeAccountId: account.id },
            });
            console.log('✅ P2P payout account linked:', userId, '->', account.id);
          } catch (dbErr: any) {
            console.error('❌ P2P account link failed:', dbErr.message);
          }
        } else {
          console.log('🔄 Account updated:', account.id);
        }
        break;
      }
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as {
          id: string;
          amount: number;
          metadata?: { orderId?: string; p2p?: string; senderId?: string; recipientId?: string; amountCents?: string; feeCents?: string; note?: string };
        };
        const meta = paymentIntent.metadata || {};
        if (meta.p2p === '1' && meta.senderId && meta.recipientId) {
          try {
            const { prisma } = await import('../index');
            const amountCents = parseInt(meta.amountCents || '0', 10);
            if (amountCents > 0) {
              await prisma.$transaction([
                prisma.p2PTransfer.create({
                  data: {
                    senderId: meta.senderId,
                    recipientId: meta.recipientId,
                    amountCents,
                    feeCents: parseInt(meta.feeCents || '0', 10),
                    note: meta.note || null,
                    stripePaymentIntentId: paymentIntent.id,
                    status: 'SUCCEEDED',
                  },
                }),
                prisma.user.update({
                  where: { id: meta.recipientId },
                  data: { balanceCents: { increment: amountCents } },
                }),
              ]);
            }
            console.log('💰 P2P transfer recorded + balance credited:', meta.senderId, '->', meta.recipientId);
          } catch (dbErr: any) {
            console.error('❌ P2P webhook DB failed:', dbErr.message);
          }
        } else if (meta.orderId) {
          try {
            const { prisma } = await import('../index');
            const order = await prisma.order.findUnique({ where: { id: meta.orderId } });
            if (order) {
              const amount = paymentIntent.amount / 100;
              await prisma.transaction.create({
                data: {
                  orderId: order.id,
                  userId: order.userId,
                  amount,
                  currency: 'usd',
                  status: 'SUCCEEDED',
                  stripePaymentId: paymentIntent.id,
                  succeededAt: new Date(),
                  type: 'PAYMENT'
                }
              });
              await prisma.order.update({
                where: { id: order.id },
                data: { completedAt: new Date(), status: 'COMPLETED' }
              });
              // Award loyalty points
              try {
                const { awardLoyaltyPoints } = await import('../lib/loyalty');
                const user = await prisma.user.findUnique({ where: { id: order.userId } });
                await awardLoyaltyPoints(prisma, {
                  restaurantId: order.restaurantId,
                  userId: order.userId,
                  orderTotal: order.total + (order.tipAmount ?? 0),
                  orderId: order.id,
                  userEmail: user?.email ?? undefined,
                });
              } catch (loyaltyErr: any) {
                console.warn('Loyalty award failed:', loyaltyErr.message);
              }
              console.log('💰 Payment succeeded: order', meta.orderId, 'updated');
            }
          } catch (dbErr: any) {
            console.error('❌ Webhook DB update failed:', dbErr.message);
          }
        } else {
          console.log('💰 Payment succeeded:', paymentIntent.id);
        }
        break;
      }
      default:
        console.log('📨 Unhandled webhook event:', event.type);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

// Disconnect account
router.post('/stripe/disconnect/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    await stripe.accounts.update(accountId, {
      metadata: { 
        disconnected_at: new Date().toISOString(), 
        disconnected_by: 'platform' 
      }
    });
    
    res.json({ success: true, message: 'Account disconnected' });
  } catch (error: any) {
    console.error('❌ Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect account', code: 'server_error' });
  }
});

export default router;