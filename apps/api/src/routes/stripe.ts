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
      tosAcceptance
    } = req.body;

    console.log('📝 Received account creation request:', { 
      restaurantId, 
      email, 
      businessName,
      hasBankAccount: !!bankAccount,
      hasDob: !!dob,
      hasSsn: !!ssnLast4
    });

    // Validate required fields
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
        missing: missingFields
      });
    }

    // Validate date of birth
    const dobDate = new Date(
      parseInt(dob.year),
      parseInt(dob.month) - 1,
      parseInt(dob.day)
    );
    
    if (isNaN(dobDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date of birth', code: 'INVALID_DOB' });
    }
    
    const age = new Date().getFullYear() - parseInt(dob.year);
    if (age < 18) {
      return res.status(400).json({ error: 'Account holder must be at least 18 years old', code: 'AGE_RESTRICTION' });
    }

    // Validate SSN last 4
    const ssnDigits = safeString(ssnLast4).replace(/\D/g, '');
    if (ssnDigits.length !== 4) {
      return res.status(400).json({ error: 'Last 4 of SSN must be exactly 4 digits', code: 'INVALID_SSN' });
    }

    const rawTaxId = taxId?.replace(/\D/g, '');
    let idNumber = rawTaxId && rawTaxId.length >= 4 ? rawTaxId.slice(-9) : `0000${ssnDigits}`;
    if (idNumber.length === 8) idNumber = `0${idNumber}`;

    const isTestMode = (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_test_');
    const allSameDigit = /^(\d)\1+$/.test(idNumber);
    const sequential = /^123456789$/.test(idNumber) || /^987654321$/.test(idNumber);

    if (allSameDigit || sequential) {
      if (isTestMode) {
        idNumber = '000000000';
      } else {
        return res.status(400).json({
          error: 'That SSN or Tax ID is not accepted. Please use your real last 4 digits of SSN.',
          code: 'INVALID_TAX_ID',
        });
      }
    }

    if (isTestMode && (allSameDigit || sequential || idNumber === '000022222' || idNumber === '222222222')) {
      idNumber = '000000000';
    }

    // Parse name
    const { firstName, lastName } = extractNameParts(fullName);

    // Handle address (now expecting an object from frontend)
    const addressData = address || {};
    const individualAddress = {
      line1: safeString(addressData.line1) || '123 Main St',
      city: safeString(addressData.city) || 'Chicago',
      state: safeString(addressData.state) || 'IL',
      postal_code: safeString(addressData.postal_code) || '60654',
      country: 'US',
    };

    // Create Stripe connected account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: safeString(email),
      business_type: 'individual',
      business_profile: {
        name: safeString(businessName),
        url: website || `https://driftpos.com/restaurant/${safeString(restaurantId)}`,
        mcc: '5812',
      },
      individual: {
        first_name: firstName,
        last_name: lastName,
        email: safeString(email),
        phone: safeString(phone),
        address: individualAddress,
        dob: {
          day: parseInt(dob.day),
          month: parseInt(dob.month),
          year: parseInt(dob.year)
        },
        id_number: idNumber,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        restaurantId: safeString(restaurantId),
        platform: 'Drift POS',
        createdAt: new Date().toISOString()
      },
      tos_acceptance: tosAcceptance ? {
        date: tosAcceptance.date || Math.floor(Date.now() / 1000),
        ip: tosAcceptance.ip || req.ip || req.connection.remoteAddress || '0.0.0.0'
      } : undefined,
    });

    console.log(`✅ Stripe account created: ${account.id}`);

    // Add bank account to the Stripe account
    if (bankAccount) {
      try {
        const routingDigits = safeString(bankAccount.routingNumber).replace(/\D/g, '');
        if (routingDigits.length !== 9) {
          throw new Error('Routing number must be 9 digits');
        }

        const accountDigits = safeString(bankAccount.accountNumber).replace(/\D/g, '');
        if (accountDigits.length < 4 || accountDigits.length > 17) {
          throw new Error('Account number must be between 4 and 17 digits');
        }

        const bankAccountToken = await stripe.tokens.create({
          bank_account: {
            country: 'US',
            currency: 'usd',
            account_holder_name: safeString(bankAccount.accountHolderName) || firstName + ' ' + lastName,
            account_holder_type: 'individual',
            routing_number: routingDigits,
            account_number: accountDigits,
          },
        });

        await stripe.accounts.createExternalAccount(account.id, {
          external_account: bankAccountToken.id,
        });

        console.log(`✅ Bank account added to Stripe account`);
      } catch (bankError: any) {
        console.error('⚠️ Bank account addition failed:', bankError.message);
        await stripe.accounts.update(account.id, {
          metadata: {
            bank_account_error: bankError.message,
            bank_account_error_time: new Date().toISOString()
          }
        });
      }
    }

    // Respond immediately so the client doesn't wait for DB
    res.json({
      success: true,
      accountId: account.id,
      message: 'Payment account created successfully'
    });

    // Save Stripe account ID to database in background (non-blocking)
    const rid = safeString(restaurantId);
    const aid = account.id;
    setImmediate(async () => {
      try {
        const { prisma } = await import('../index');
        await prisma.restaurant.update({
          where: { id: rid },
          data: { stripeAccount: aid }
        });
        console.log(`✅ Restaurant updated with Stripe account ID`);
      } catch (dbError: any) {
        console.error('⚠️ Database update failed:', dbError.message);
        try {
          await stripe.accounts.update(aid, {
            metadata: {
              db_update_error: dbError.message,
              restaurantId: rid
            }
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
          error: 'That SSN or Tax ID is not accepted. Use your real last 4 digits of SSN, or in test mode use 0000.',
          code: 'invalid_tax_id'
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