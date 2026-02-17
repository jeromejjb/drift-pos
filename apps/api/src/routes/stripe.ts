import { Router } from 'express';
import Stripe from 'stripe';
import express from 'express';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Create Stripe account with embedded onboarding
router.post('/stripe/connect', async (req, res) => {
  try {
    const { email, name, restaurantId, tier } = req.body;

    if (!email || !name || !restaurantId) {
      return res.status(400).json({ error: 'Missing required fields', code: 'MISSING_FIELDS' });
    }

    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_profile: { name, url: `https://driftpos.com/restaurant/${restaurantId}` },
      metadata: { restaurantId, tier: tier || 'free', platform: 'Drift POS' },
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    });

    const session = await stripe.accountSessions.create({
      account: account.id,
      components: { account_onboarding: { enabled: true, features: { external_account_collection: true } } },
    });

    res.json({ clientSecret: session.client_secret, accountId: account.id });
  } catch (error: any) {
    if (error.code === 'resource_already_exists') {
      return res.status(400).json({ error: 'Email already registered', code: 'duplicate_email' });
    }
    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({ error: 'Too many requests', code: 'rate_limit' });
    }
    res.status(500).json({ error: 'Failed to create account', code: 'server_error' });
  }
});

// Add this new endpoint for our simplified form
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
      bankAccount
    } = req.body;

    console.log('📝 Received account creation request:', { 
      restaurantId, 
      email, 
      businessName,
      hasBankAccount: !!bankAccount 
    });

    // Validate required fields
    if (!restaurantId || !email || !businessName || !fullName || !bankAccount) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        code: 'MISSING_FIELDS',
        missing: {
          restaurantId: !restaurantId,
          email: !email,
          businessName: !businessName,
          fullName: !fullName,
          bankAccount: !bankAccount
        }
      });
    }

    // Parse address components (simple parsing - you might want to improve this)
    const addressParts = address?.split(',') || [];
    const city = addressParts[1]?.trim() || 'Chicago';
    const state = addressParts[2]?.trim() || 'IL';
    const postalCode = address?.match(/\d{5}(?:-\d{4})?/)?.[0] || '60654';

    // Create Stripe connected account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email,
      business_type: 'individual',
      business_profile: {
        name: businessName,
        url: website || `https://driftpos.com/restaurant/${restaurantId}`,
        mcc: '5812', // Eating places and restaurants
      },
      individual: {
        first_name: fullName.split(' ')[0],
        last_name: fullName.split(' ').slice(1).join(' ') || fullName.split(' ')[0],
        email,
        phone,
        address: {
          line1: addressParts[0]?.trim() || address,
          city,
          state,
          postal_code: postalCode,
          country: 'US',
        },
        dob: {
          day: 1,
          month: 1,
          year: 1900,
        },
        id_number: taxId?.replace(/\D/g, '') || undefined,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        restaurantId,
        platform: 'Drift POS',
        createdAt: new Date().toISOString()
      },
    });

    console.log(`✅ Stripe account created: ${account.id}`);

    // Add bank account to the Stripe account
    if (bankAccount) {
      try {
        const bankAccountToken = await stripe.tokens.create({
          bank_account: {
            country: 'US',
            currency: 'usd',
            account_holder_name: bankAccount.accountHolderName,
            account_holder_type: 'individual',
            routing_number: bankAccount.routingNumber.replace(/\D/g, ''),
            account_number: bankAccount.accountNumber.replace(/\D/g, ''),
          },
        });

        await stripe.accounts.createExternalAccount(account.id, {
          external_account: bankAccountToken.id,
        });

        console.log(`✅ Bank account added to Stripe account`);
      } catch (bankError) {
        console.error('⚠️ Bank account addition failed:', bankError);
        // Continue even if bank account fails - can be added later
      }
    }

    // Save Stripe account ID to database
    try {
      // You'll need to import prisma at the top of this file
      const { prisma } = await import('../index');
      
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { 
          stripeAccountId: account.id,
          stripeAccount: account.id // Using the field from your schema
        }
      });
      console.log(`✅ Restaurant updated with Stripe account ID`);
    } catch (dbError) {
      console.error('⚠️ Database update failed:', dbError);
      // Account is created but we couldn't save the ID
    }

    res.json({ 
      success: true, 
      accountId: account.id,
      message: 'Stripe account created successfully' 
    });

  } catch (error: any) {
    console.error('❌ Stripe account creation error:', error);
    
    if (error.type === 'StripeInvalidRequestError') {
      if (error.code === 'resource_already_exists') {
        return res.status(400).json({ error: 'Email already registered with Stripe', code: 'duplicate_email' });
      }
      return res.status(400).json({ 
        error: error.message, 
        code: error.code || 'stripe_error' 
      });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({ error: 'Too many requests', code: 'rate_limit' });
    }
    
    res.status(500).json({ 
      error: 'Failed to create Stripe account', 
      code: 'server_error',
      message: error.message 
    });
  }
});


// Check account status
router.get('/stripe/account-status/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    if (!accountId) return res.status(400).json({ error: 'Account ID required', code: 'missing_account_id' });

    const account = await stripe.accounts.retrieve(accountId);
    res.json({
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      isOnboardingComplete: account.details_submitted && account.charges_enabled,
    });
  } catch (error: any) {
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

// Process payment
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
      application_fee_amount: Math.round(amountInCents * 0.035),
      metadata: { platform: 'Drift POS' }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: 'Payment failed', code: 'payment_error' });
  }
});

// Webhook
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) return res.status(400).json({ error: 'Webhook not configured' });

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig!, webhookSecret);
    // Handle webhook events as needed
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: 'Webhook error' });
  }
});

// Disconnect account
router.post('/stripe/disconnect/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    await stripe.accounts.update(accountId, {
      metadata: { disconnected_at: new Date().toISOString(), disconnected_by: 'platform' }
    });
    res.json({ success: true, message: 'Account disconnected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect account', code: 'server_error' });
  }
});

export default router;