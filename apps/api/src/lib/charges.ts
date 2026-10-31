import type { PrismaClient } from '@prisma/client';
import type Stripe from 'stripe';
import { applicationFeeCents, marginRate } from './rates';

/** Charge is food/tax (`total`) plus a separate tip. Tip is not already inside `total`. */
export function chargeAmountCents(total: number, tipAmount: number | null | undefined): number {
  const dollars = Number(total) + Number(tipAmount ?? 0);
  if (!Number.isFinite(dollars) || dollars <= 0) return 0;
  return Math.round(dollars * 100);
}

export async function feeRateForRestaurant(
  prisma: PrismaClient,
  restaurantId: string,
  restaurantOverride?: number | null
): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const result = await prisma.order.aggregate({
    where: {
      restaurantId,
      paymentStatus: 'PAID',
      createdAt: { gte: startOfMonth },
    },
    _sum: { total: true },
  });
  return marginRate(result._sum.total ?? 0, restaurantOverride);
}

/**
 * Direct charge on the connected account. Stripe bills that account for
 * card processing. application_fee_amount is Drift's margin only.
 */
export function buildDirectCharge(input: {
  amountCents: number;
  destination: string;
  feeRate: number;
  orderId: string;
  restaurantId: string;
  customerId?: string;
}): { params: Stripe.PaymentIntentCreateParams; options: Stripe.RequestOptions } {
  const fee = applicationFeeCents(input.amountCents, input.feeRate);
  const params: Stripe.PaymentIntentCreateParams = {
    amount: input.amountCents,
    currency: 'usd',
    payment_method_types: ['card'],
    metadata: {
      orderId: input.orderId,
      restaurantId: input.restaurantId,
      platform: 'Drift POS',
      chargeType: 'direct',
      applicationFeeCents: String(fee),
      feeRate: String(input.feeRate),
    },
  };
  if (fee > 0) params.application_fee_amount = fee;
  if (input.customerId) {
    params.customer = input.customerId;
    params.setup_future_usage = 'off_session';
  }
  return {
    params,
    options: { stripeAccount: input.destination },
  };
}
