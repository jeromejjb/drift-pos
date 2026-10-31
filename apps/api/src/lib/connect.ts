import type Stripe from 'stripe';
import type { PrismaClient } from '@prisma/client';
import { ApiError } from './apiError';
import { isStripeTestMode } from './stripeClient';

/**
 * Restaurants onboard as Stripe Connect Express accounts.
 *
 * Express is the fit for this codebase: the API already created `type: 'express'`
 * accounts, and the restaurant app already loads Connect embedded onboarding.
 * Stripe collects identity and the bank account. Drift must not send
 * `individual`, `external_account`, or `tos_acceptance` — Express rejects those
 * when Stripe is the requirement collector, which is what broke onboarding.
 *
 * A fully verified Custom account is used only in test mode (`completeInTestMode`)
 * so automated tests and local seed data can charge and pay out without clicking
 * through Stripe's hosted KYC. That path is refused for live keys.
 */

export type ConnectProfile = {
  restaurantId: string;
  email: string;
  businessName: string;
  fullName?: string;
};

export function restaurantAppBaseUrl(): string {
  return (
    process.env.RESTAURANT_ONBOARDING_BASE_URL ||
    process.env.RESTAURANT_URL ||
    process.env.RESTAURANT_WEB_URL ||
    'http://localhost:5175'
  );
}

export function expressAccountCreateParams(input: ConnectProfile): Stripe.AccountCreateParams {
  return {
    type: 'express',
    country: 'US',
    email: input.email,
    business_profile: {
      name: input.businessName,
      mcc: '5812',
      url: `https://driftpos.com/restaurant/${input.restaurantId}`,
      product_description: 'Restaurant food and beverage',
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      restaurantId: input.restaurantId,
      platform: 'Drift POS',
    },
  };
}

/** Stripe's documented test values. `address_full_match` and SSN 000000000 verify immediately. */
export function testConnectedAccountParams(input: ConnectProfile & { ip?: string }): Stripe.AccountCreateParams {
  const parts = (input.fullName || 'Demo Owner').trim().split(/\s+/);
  const firstName = parts[0] || 'Demo';
  const lastName = parts.slice(1).join(' ') || 'Owner';
  return {
    type: 'custom',
    country: 'US',
    email: input.email,
    business_type: 'individual',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: {
      name: input.businessName,
      mcc: '5812',
      url: 'https://accessible.stripe.com',
      product_description: 'Restaurant food and beverage',
    },
    individual: {
      first_name: firstName,
      last_name: lastName,
      email: input.email,
      phone: '0000000000',
      dob: { day: 1, month: 1, year: 1901 },
      ssn_last_4: '0000',
      id_number: '000000000',
      address: {
        line1: 'address_full_match',
        city: 'South San Francisco',
        state: 'CA',
        postal_code: '94080',
        country: 'US',
      },
    },
    external_account: {
      object: 'bank_account',
      country: 'US',
      currency: 'usd',
      routing_number: '110000000',
      account_number: '000123456789',
    },
    tos_acceptance: {
      date: Math.floor(Date.now() / 1000),
      ip: input.ip || '127.0.0.1',
    },
    settings: {
      payouts: { schedule: { interval: 'manual' } },
    },
    metadata: {
      restaurantId: input.restaurantId,
      platform: 'Drift POS',
      testProvisioned: 'true',
    },
  };
}

type AccountFlags = {
  id: string;
  charges_enabled?: boolean | null;
  payouts_enabled?: boolean | null;
  details_submitted?: boolean | null;
  capabilities?: {
    transfers?: string | null;
    legacy_payments?: string | null;
  } | null;
};

export async function linkRestaurantAccount(prisma: PrismaClient, restaurantId: string, account: AccountFlags) {
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      stripeAccount: account.id,
      chargesEnabled: !!account.charges_enabled,
      payoutsEnabled: !!account.payouts_enabled,
      detailsSubmitted: !!account.details_submitted,
    },
  });
}

/**
 * Direct charges run on the connected account, so it must be allowed to
 * accept card payments. Transfers are not required for this charge type.
 */
export function destinationChargeBlocker(account: AccountFlags & {
  capabilities?: { transfers?: string | null; legacy_payments?: string | null; card_payments?: string | null } | null;
}): { code: string; error: string } | null {
  if (account.charges_enabled) return null;
  return {
    code: 'CHARGES_NOT_ENABLED',
    error:
      'This restaurant cannot take card payments yet. Finish Stripe Connect onboarding so charges are enabled.',
  };
}

export async function startExpressOnboarding(
  stripe: Stripe,
  prisma: PrismaClient,
  restaurant: { id: string; stripeAccount: string | null },
  input: ConnectProfile
) {
  let account: Stripe.Account;
  if (restaurant.stripeAccount) {
    account = await stripe.accounts.retrieve(restaurant.stripeAccount);
  } else {
    account = await stripe.accounts.create(expressAccountCreateParams(input));
    await linkRestaurantAccount(prisma, restaurant.id, account);
  }

  const base = restaurantAppBaseUrl();
  const rid = encodeURIComponent(restaurant.id);
  let onboardingUrl: string | undefined;
  let embeddedClientSecret: string | undefined;

  try {
    const link = await stripe.accountLinks.create({
      account: account.id,
      type: 'account_onboarding',
      refresh_url: `${base}/onboarding?restaurantId=${rid}&step=bank`,
      return_url: `${base}/onboarding?restaurantId=${rid}&step=complete`,
    });
    onboardingUrl = link.url;
  } catch (err) {
    console.error('[stripe] account link failed:', err instanceof Error ? err.message : err);
  }

  try {
    const session = await stripe.accountSessions.create({
      account: account.id,
      components: {
        account_onboarding: {
          enabled: true,
          features: { external_account_collection: true },
        },
      },
    });
    embeddedClientSecret = session.client_secret ?? undefined;
  } catch (err) {
    console.error('[stripe] embedded onboarding session failed:', err instanceof Error ? err.message : err);
  }

  if (!onboardingUrl && !embeddedClientSecret && !account.charges_enabled) {
    throw new ApiError(
      502,
      'ONBOARDING_UNAVAILABLE',
      'Stripe did not return an onboarding link. In the Dashboard, enable Connect Express accounts (Settings → Connect).'
    );
  }

  return {
    accountId: account.id,
    onboardingUrl,
    embeddedClientSecret,
    chargesEnabled: !!account.charges_enabled,
    payoutsEnabled: !!account.payouts_enabled,
    detailsSubmitted: !!account.details_submitted,
    mode: 'express' as const,
  };
}

export async function provisionTestMerchant(
  stripe: Stripe,
  prisma: PrismaClient,
  restaurantId: string,
  input: ConnectProfile & { ip?: string }
) {
  if (!isStripeTestMode()) {
    throw new ApiError(
      400,
      'TEST_MODE_ONLY',
      'A fully verified test merchant can only be created with a Stripe test secret key (sk_test_...).'
    );
  }

  const created = await stripe.accounts.create(testConnectedAccountParams(input));
  let account = created;
  for (let i = 0; i < 8 && !account.charges_enabled; i++) {
    await new Promise((r) => setTimeout(r, 400));
    account = await stripe.accounts.retrieve(created.id);
  }
  await linkRestaurantAccount(prisma, restaurantId, account);
  return account;
}
