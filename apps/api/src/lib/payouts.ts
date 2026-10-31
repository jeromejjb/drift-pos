import type { PrismaClient } from '@prisma/client';
import type Stripe from 'stripe';
import { ApiError } from './apiError';

type RestaurantRow = {
  id: string;
  stripeAccount: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
};

function usdCents(entries: Stripe.Balance.Available[] | undefined): number {
  return entries?.find((b) => b.currency === 'usd')?.amount ?? 0;
}

export async function syncPayout(prisma: PrismaClient, restaurantId: string, payout: Stripe.Payout) {
  const arrival = payout.arrival_date ? new Date(payout.arrival_date * 1000) : null;
  return prisma.payout.upsert({
    where: { stripePayoutId: payout.id },
    create: {
      restaurantId,
      stripePayoutId: payout.id,
      amountCents: payout.amount,
      currency: payout.currency || 'usd',
      status: payout.status,
      arrivalDate: arrival,
      failureMessage: payout.failure_message || null,
    },
    update: {
      status: payout.status,
      arrivalDate: arrival,
      failureMessage: payout.failure_message || null,
      amountCents: payout.amount,
    },
  });
}

export async function readBalanceAndPayouts(stripe: Stripe, prisma: PrismaClient, restaurant: RestaurantRow) {
  if (!restaurant.stripeAccount) {
    throw new ApiError(400, 'RESTAURANT_NO_STRIPE', 'This restaurant has not connected a payout account yet.');
  }
  const accountId = restaurant.stripeAccount;
  const [balance, list, account] = await Promise.all([
    stripe.balance.retrieve({ stripeAccount: accountId }),
    stripe.payouts.list({ limit: 20 }, { stripeAccount: accountId }),
    stripe.accounts.retrieve(accountId),
  ]);

  await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: {
      chargesEnabled: !!account.charges_enabled,
      payoutsEnabled: !!account.payouts_enabled,
      detailsSubmitted: !!account.details_submitted,
    },
  });

  const payouts = [];
  for (const payout of list.data) {
    payouts.push(await syncPayout(prisma, restaurant.id, payout));
  }

  return {
    availableCents: usdCents(balance.available),
    pendingCents: usdCents(balance.pending),
    currency: 'usd',
    chargesEnabled: !!account.charges_enabled,
    payoutsEnabled: !!account.payouts_enabled,
    payouts: payouts.map(serializePayout),
  };
}

export async function createConnectedPayout(
  stripe: Stripe,
  prisma: PrismaClient,
  restaurant: RestaurantRow,
  requestedCents?: number
) {
  if (!restaurant.stripeAccount) {
    throw new ApiError(400, 'RESTAURANT_NO_STRIPE', 'This restaurant has not connected a payout account yet.');
  }
  const accountId = restaurant.stripeAccount;
  const balance = await stripe.balance.retrieve({ stripeAccount: accountId });
  const available = usdCents(balance.available);
  const pending = usdCents(balance.pending);
  const amount = requestedCents == null ? available : requestedCents;

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new ApiError(
      400,
      'NO_AVAILABLE_BALANCE',
      pending > 0
        ? `$${(pending / 100).toFixed(2)} is still pending at Stripe and cannot be paid out yet.`
        : 'There is no available balance to pay out.'
    );
  }
  if (amount > available) {
    throw new ApiError(400, 'AMOUNT_EXCEEDS_AVAILABLE', 'That amount is higher than the available balance.');
  }

  let payout: Stripe.Payout;
  try {
    payout = await stripe.payouts.create(
      { amount, currency: 'usd', description: 'Drift POS payout' },
      { stripeAccount: accountId }
    );
  } catch (err: any) {
    const message = String(err?.message || 'Payout failed');
    const schedule =
      /manual/i.test(message) || err?.code === 'payouts_not_allowed' || /not allowed/i.test(message);
    if (schedule) {
      throw new ApiError(
        400,
        'PAYOUT_SCHEDULE_AUTOMATIC',
        'Stripe is paying this account out on its own schedule. Open the Express dashboard to see deposits, or switch the account to a manual payout schedule.'
      );
    }
    if (err?.code === 'balance_insufficient') {
      throw new ApiError(400, 'NO_AVAILABLE_BALANCE', message);
    }
    throw new ApiError(400, err?.code || 'PAYOUT_FAILED', message);
  }

  const row = await syncPayout(prisma, restaurant.id, payout);
  return {
    availableCents: available - amount,
    pendingCents: pending,
    payout: serializePayout(row),
  };
}

function serializePayout(row: {
  id: string;
  stripePayoutId: string;
  amountCents: number;
  currency: string;
  status: string;
  arrivalDate: Date | null;
  failureMessage: string | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    stripePayoutId: row.stripePayoutId,
    amountCents: row.amountCents,
    currency: row.currency,
    status: row.status,
    arrivalDate: row.arrivalDate,
    failureMessage: row.failureMessage,
    createdAt: row.createdAt,
  };
}
