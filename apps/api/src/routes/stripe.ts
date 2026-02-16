import { Router } from 'express';
import Stripe from 'stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// 1. Create Stripe account for restaurant with embedded onboarding
router.post('/stripe/connect', async (req, res) => {
  try {
    const { email, name, restaurantId, tier } = req.body;
    
    console.log('🚀 Creating Stripe Connect account for:', { email, name, restaurantId, tier });
    
    // Create connected account
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_profile: { 
        name,
        url: `https://driftpos.com/r/${restaurantId}` // Optional: link to their Drift page
      },
      metadata: { 
        restaurantId,
        tier,
        platform: 'Drift POS'
      }
    });
    
    // Create an ACCOUNT SESSION for embedded onboarding
    const session = await stripe.accountSessions.create({
      account: account.id,
      components: {
        account_onboarding: {
          enabled: true,
          features: {
            external_account_collection: true, // Collect bank details
          },
        },
      },
    });
    
    console.log('✅ Stripe account created:', account.id);
    
    // Return client secret for the frontend to use with Connect.js
    res.json({ 
      clientSecret: session.client_secret,
      accountId: account.id 
    });
    
  } catch (error) {
    console.error('❌ Stripe connect error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Check account status (to verify onboarding completion)
router.get('/stripe/account-status/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    console.log('🔍 Checking account status for:', accountId);
    
    const account = await stripe.accounts.retrieve(accountId);
    
    // Return relevant status information
    res.json({
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
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
    res.status(500).json({ error: error.message });
  }
});

// 3. Get account balance (for dashboard)
router.get('/stripe/balance/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId
    });
    
    res.json({
      available: balance.available,
      pending: balance.pending
    });
    
  } catch (error) {
    console.error('❌ Error fetching balance:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Create a login link for the restaurant to access their Stripe dashboard (optional)
router.post('/stripe/login-link/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    
    res.json({ url: loginLink.url });
    
  } catch (error) {
    console.error('❌ Error creating login link:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Process payment (for diner app)
router.post('/stripe/payment', async (req, res) => {
  try {
    const { amount, restaurantStripeId, currency = 'usd' } = req.body;
    
    // Calculate fee based on tier (you'd get this from your database)
    // For now, using 3.5% as default
    const feePercentage = 0.035;
    const applicationFee = Math.round(amount * 100 * feePercentage);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      transfer_data: {
        destination: restaurantStripeId,
      },
      application_fee_amount: applicationFee,
      metadata: {
        platform: 'Drift POS'
      }
    });
    
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
    
  } catch (error) {
    console.error('❌ Payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Webhook to handle Stripe events (payouts, disputes, etc.)
router.post('/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    return res.status(400).json({ error: 'Webhook secret not configured' });
  }
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig!, webhookSecret);
    
    switch (event.type) {
      case 'account.updated':
        const account = event.data.object;
        console.log('🔄 Account updated:', account.id);
        // Update your database with account status
        break;
        
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('💰 Payment succeeded:', paymentIntent.id);
        // Update order status in your database
        break;
        
      case 'payout.paid':
        const payout = event.data.object;
        console.log('💸 Payout paid:', payout.id);
        // Update payout records
        break;
        
      case 'charge.dispute.created':
        const dispute = event.data.object;
        console.log('⚠️ Dispute created:', dispute.id);
        // Notify restaurant
        break;
    }
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
});

export default router;