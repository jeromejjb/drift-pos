import { Router } from 'express';
import Stripe from 'stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// 1. Create Stripe account for restaurant with embedded onboarding
router.post('/stripe/connect', async (req, res) => {
  try {
    const { email, name, restaurantId } = req.body;
    
    // Create connected account
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_profile: { name },
      metadata: { restaurantId }
    });
    
    // Create an ACCOUNT SESSION for embedded onboarding (not account links!)
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
    
    // Return client secret for the frontend to use with Connect.js
    res.json({ 
      clientSecret: session.client_secret,
      accountId: account.id 
    });
    
  } catch (error) {
    console.error('Stripe connect error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Process payment (for diner app)
router.post('/stripe/payment', async (req, res) => {
  try {
    const { amount, restaurantStripeId } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      transfer_data: {
        destination: restaurantStripeId,
      },
      application_fee_amount: Math.round(amount * 100 * 0.035), // 3.5%
    });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;