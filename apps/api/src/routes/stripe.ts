import { Router } from 'express';
import Stripe from 'stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// 1. Create Stripe account for restaurant
router.post('/stripe/connect', async (req, res) => {
  try {
    const { email, name, restaurantId } = req.body;
    
    // Create connected account
    const account = await stripe.accounts.create({
      type: 'express', // SIMPLER than custom
      email,
      business_profile: { name },
      metadata: { restaurantId }
    });
    
    // Create onboarding link
    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.APP_URL}/onboarding?step=stripe`,
      return_url: `${process.env.APP_URL}/onboarding?step=complete`,
      type: 'account_onboarding',
    });
    
    res.json({ url: link.url, accountId: account.id });
  } catch (error) {
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
      // YOUR FEE - this is how you make money!
      application_fee_amount: Math.round(amount * 100 * 0.035), // 3.5%
    });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;