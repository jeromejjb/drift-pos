import Stripe from 'stripe';
import { ApiError } from './apiError';

let cached: Stripe | null = null;
let cachedKey: string | undefined;
let override: Stripe | null = null;

/** Test-only. Pass null to use the real client again. */
export function setStripeForTests(client: Stripe | null) {
  override = client;
}

export function stripeSecretKey(): string {
  return process.env.STRIPE_SECRET_KEY || '';
}

export function stripeConfigured(): boolean {
  const key = stripeSecretKey();
  return key.startsWith('sk_test_') || key.startsWith('sk_live_');
}

/** True when the configured secret is a test key. Live keys are refused outside production. */
export function isStripeTestMode(): boolean {
  return stripeSecretKey().startsWith('sk_test_');
}

export function getStripe(): Stripe {
  if (override) return override;

  const key = stripeSecretKey();
  if (!key.startsWith('sk_test_') && !key.startsWith('sk_live_')) {
    throw new ApiError(
      503,
      'STRIPE_NOT_CONFIGURED',
      'Set STRIPE_SECRET_KEY to a Stripe secret key. Local development uses a test key (sk_test_...).'
    );
  }
  if (key.startsWith('sk_live_') && process.env.NODE_ENV !== 'production' && process.env.STRIPE_ALLOW_LIVE !== '1') {
    throw new ApiError(
      503,
      'STRIPE_LIVE_BLOCKED',
      'Refusing to use a live Stripe key outside production. Use sk_test_... locally, or set STRIPE_ALLOW_LIVE=1 if you really mean it.'
    );
  }
  if (!cached || cachedKey !== key) {
    cached = new Stripe(key);
    cachedKey = key;
  }
  return cached;
}
