import { Router } from 'express';
import Stripe from 'stripe';
import express from 'express'; // Add this for the webhook raw body

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// 1. Create Stripe account for restaurant with embedded onboarding
router.post('/stripe/connect', async (req, res) => {
  try {
    const { email, name, restaurantId, tier } = req.body;
    
    console.log('📦 Request body:', { email, name, restaurantId, tier });
    
    // Validate required fields
    if (!email || !name || !restaurantId) {
      console.log('❌ Missing fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Email, name, and restaurantId are required'
      });
    }

    console.log('🚀 Creating Stripe account...');
    
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_profile: { 
        name,
        url: `https://driftpos.com/restaurant/${restaurantId}`
      },
      metadata: { 
        restaurantId,
        tier: tier || 'free',
        platform: 'Drift POS',
        createdAt: new Date().toISOString()
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      tos_acceptance: {
        service_agreement: 'recipient',
      },
    });
    
    console.log('✅ Stripe account created:', account.id);
    
    const session = await stripe.accountSessions.create({
      account: account.id,
      components: {
        account_onboarding: {
          enabled: true,
          features: {
            external_account_collection: true,
          },
        },
      },
    });
    
    console.log('✅ Session created');
    
    res.json({ 
      clientSecret: session.client_secret,
      accountId: account.id 
    });
    
  } catch (error) {
    console.error('❌ FULL ERROR OBJECT:', error);
    console.error('❌ Error type:', error.type);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    if (error.raw) {
      console.error('❌ Raw error:', error.raw);
    }
    
    // Handle specific Stripe errors
    if (error.code === 'resource_already_exists') {
      return res.status(400).json({ 
        error: 'This email is already associated with a Stripe account. Please use a different email or sign in.',
        code: 'duplicate_email'
      });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.',
        code: 'rate_limit'
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to create Stripe account. Please try again.',
      code: 'server_error'
    });
  }
});

// 2. Check account status (to verify onboarding completion)
router.get('/stripe/account-status/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    console.log('🔍 Checking account status for:', accountId);
    
    if (!accountId) {
      return res.status(400).json({ 
        error: 'Account ID is required',
        code: 'missing_account_id'
      });
    }
    
    const account = await stripe.accounts.retrieve(accountId);
    
    const isOnboardingComplete = account.details_submitted && account.charges_enabled;
    const requiresMoreInfo = !account.details_submitted || account.requirements?.currently_due?.length > 0;
    
    res.json({
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      isOnboardingComplete,
      requiresMoreInfo,
      requirements: {
        currently_due: account.requirements?.currently_due || [],
        eventually_due: account.requirements?.eventually_due || [],
        past_due: account.requirements?.past_due || [],
        pending_verification: account.requirements?.pending_verification || []
      },
      capabilities: {
        card_payments: account.capabilities?.card_payments,
        transfers: account.capabilities?.transfers
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking account status:', error);
    
    if (error.code === 'resource_missing') {
      return res.status(404).json({ 
        error: 'Account not found',
        code: 'account_not_found'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to check account status',
      code: 'server_error'
    });
  }
});

// 3. Get account balance (for dashboard)
router.get('/stripe/balance/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    if (!accountId) {
      return res.status(400).json({ 
        error: 'Account ID is required',
        code: 'missing_account_id'
      });
    }
    
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId
    });
    
    res.json({
      available: balance.available.map(b => ({
        amount: b.amount / 100,
        currency: b.currency
      })),
      pending: balance.pending.map(b => ({
        amount: b.amount / 100,
        currency: b.currency
      }))
    });
    
  } catch (error) {
    console.error('❌ Error fetching balance:', error);
    res.status(500).json({ 
      error: 'Failed to fetch balance',
      code: 'server_error'
    });
  }
});

// 4. Create a login link for the restaurant to access their Stripe dashboard (optional)
router.post('/stripe/login-link/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    if (!accountId) {
      return res.status(400).json({ 
        error: 'Account ID is required',
        code: 'missing_account_id'
      });
    }
    
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    
    res.json({ url: loginLink.url });
    
  } catch (error) {
    console.error('❌ Error creating login link:', error);
    res.status(500).json({ 
      error: 'Failed to create login link',
      code: 'server_error'
    });
  }
});

// 5. Process payment (for diner app)
router.post('/stripe/payment', async (req, res) => {
  try {
    const { amount, restaurantStripeId, currency = 'usd', metadata = {} } = req.body;
    
    if (!amount || !restaurantStripeId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Amount and restaurantStripeId are required'
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ 
        error: 'Invalid amount',
        details: 'Amount must be greater than 0'
      });
    }
    
    // Calculate fee based on tier (you'd get this from your database)
    // For now, using 3.5% as default
    const feePercentage = 0.035;
    const amountInCents = Math.round(amount * 100);
    const applicationFee = Math.round(amountInCents * feePercentage);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      transfer_data: {
        destination: restaurantStripeId,
      },
      application_fee_amount: applicationFee,
      metadata: {
        platform: 'Drift POS',
        ...metadata
      }
    });
    
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountInCents,
      fee: applicationFee
    });
    
  } catch (error) {
    console.error('❌ Payment intent error:', error);
    res.status(500).json({ 
      error: 'Failed to process payment',
      code: 'payment_error'
    });
  }
});

// 6. Webhook to handle Stripe events
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('❌ Webhook secret not configured');
    return res.status(400).json({ error: 'Webhook secret not configured' });
  }
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig!, webhookSecret);
    
    console.log(`🔄 Webhook received: ${event.type}`, {
      id: event.id,
      type: event.type,
      created: new Date(event.created * 1000).toISOString()
    });
    
    switch (event.type) {
      case 'account.updated':
        const account = event.data.object;
        console.log('🔄 Account updated:', {
          id: account.id,
          details_submitted: account.details_submitted,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled
        });
        // Update your database with account status
        break;
        
      case 'account.application.authorized':
        console.log('✅ Account authorized:', event.data.object.id);
        break;
        
      case 'account.application.deauthorized':
        console.log('⚠️ Account deauthorized:', event.data.object.id);
        break;
        
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('💰 Payment succeeded:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          restaurant: paymentIntent.transfer_data?.destination
        });
        // Update order status in your database
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('❌ Payment failed:', failedPayment.id);
        break;
        
      case 'payout.paid':
        const payout = event.data.object;
        console.log('💸 Payout paid:', {
          id: payout.id,
          amount: payout.amount / 100,
          arrival: new Date(payout.arrival_date * 1000).toISOString()
        });
        // Update payout records
        break;
        
      case 'payout.failed':
        const failedPayout = event.data.object;
        console.log('❌ Payout failed:', failedPayout.id);
        break;
        
      case 'charge.dispute.created':
        const dispute = event.data.object;
        console.log('⚠️ Dispute created:', {
          id: dispute.id,
          amount: dispute.amount / 100,
          charge: dispute.charge
        });
        // Notify restaurant
        break;
        
      default:
        console.log(`🔄 Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
});

// 7. Delete/Disconnect account
router.post('/stripe/disconnect/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    if (!accountId) {
      return res.status(400).json({ 
        error: 'Account ID is required',
        code: 'missing_account_id'
      });
    }
    
    // Instead of deleting, we deactivate (can't delete accounts with balances)
    const account = await stripe.accounts.update(accountId, {
      metadata: {
        disconnected_at: new Date().toISOString(),
        disconnected_by: 'platform'
      }
    });
    
    res.json({ 
      success: true,
      message: 'Account disconnected successfully'
    });
    
  } catch (error) {
    console.error('❌ Error disconnecting account:', error);
    res.status(500).json({ 
      error: 'Failed to disconnect account',
      code: 'server_error'
    });
  }
});

export default router;