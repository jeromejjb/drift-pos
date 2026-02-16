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
      type: 'express',
      email,
      business_profile: { name },
      metadata: { restaurantId }
    });
    
    // 🔒 FORCE HTTPS for the URLs
    let appUrl = process.env.APP_URL || 'https://drift-restaurant.onrender.com';
    appUrl = appUrl.replace('http://', 'https://');
    
    // Create onboarding link with HTTPS URLs
    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${appUrl}/onboarding?step=stripe`,
      return_url: `${appUrl}/onboarding?step=complete`,
      type: 'account_onboarding',
    });
    
    res.json({ url: link.url, accountId: account.id });
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