import { Prisma, type PrismaClient } from '@prisma/client';
import type Stripe from 'stripe';
import { awardLoyaltyPoints } from './loyalty';

type Db = Prisma.TransactionClient;

export type WebhookResult = { duplicate: boolean; orderId?: string };

/**
 * Apply one verified Stripe event exactly once.
 * The event id is inserted in the same transaction as the side effects, so a
 * retry after a crash rolls the insert back and Stripe can deliver again.
 * A duplicate delivery returns without writing a second payment or payout.
 */
export async function applyStripeEvent(event: Stripe.Event, prisma: PrismaClient): Promise<WebhookResult> {
  const existing = await prisma.stripeEvent.findUnique({ where: { id: event.id } });
  if (existing) return { duplicate: true, orderId: orderIdFromEvent(event) };

  try {
    const orderId = await prisma.$transaction(async (tx) => {
      await tx.stripeEvent.create({ data: { id: event.id, type: event.type } });
      return dispatch(event, tx);
    });
    return { duplicate: false, orderId };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { duplicate: true, orderId: orderIdFromEvent(event) };
    }
    throw err;
  }
}

function orderIdFromEvent(event: Stripe.Event): string | undefined {
  const obj = event.data?.object as { metadata?: { orderId?: string }; payment_intent?: unknown } | undefined;
  if (obj?.metadata?.orderId) return obj.metadata.orderId;
  return undefined;
}

async function dispatch(event: Stripe.Event, tx: Db): Promise<string | undefined> {
  switch (event.type) {
    case 'account.updated':
      await onAccountUpdated(event.data.object as Stripe.Account, tx);
      return undefined;
    case 'payment_intent.succeeded':
      return onPaymentSucceeded(event.data.object as Stripe.PaymentIntent, tx);
    case 'payment_intent.payment_failed':
    case 'payment_intent.canceled':
      return onPaymentFailed(event.data.object as Stripe.PaymentIntent, tx);
    case 'charge.refunded':
      return onChargeRefunded(event.data.object as Stripe.Charge, tx);
    case 'refund.created':
    case 'refund.updated':
      return onRefund(event.data.object as Stripe.Refund, tx);
    case 'payout.created':
    case 'payout.paid':
    case 'payout.failed':
    case 'payout.canceled':
    case 'payout.updated':
      await onPayout(event, event.data.object as Stripe.Payout, tx);
      return undefined;
    default:
      return undefined;
  }
}

async function onAccountUpdated(account: Stripe.Account, tx: Db) {
  await tx.restaurant.updateMany({
    where: { stripeAccount: account.id },
    data: {
      chargesEnabled: !!account.charges_enabled,
      payoutsEnabled: !!account.payouts_enabled,
      detailsSubmitted: !!account.details_submitted,
    },
  });

  const userId = account.metadata?.driftUserId;
  if (userId && account.payouts_enabled) {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (user) {
      await tx.user.update({
        where: { id: userId },
        data: { stripeAccountId: account.id },
      });
    }
  }
}

async function onPaymentSucceeded(pi: Stripe.PaymentIntent, tx: Db): Promise<string | undefined> {
  const meta = pi.metadata || {};
  if (meta.p2p === '1' && meta.senderId && meta.recipientId) {
    const amountCents = parseInt(meta.amountCents || '0', 10);
    const already = await tx.p2PTransfer.findUnique({ where: { stripePaymentIntentId: pi.id } });
    if (amountCents > 0 && !already) {
      await tx.p2PTransfer.create({
        data: {
          senderId: meta.senderId,
          recipientId: meta.recipientId,
          amountCents,
          feeCents: parseInt(meta.feeCents || '0', 10),
          note: meta.note || null,
          stripePaymentIntentId: pi.id,
          status: 'SUCCEEDED',
        },
      });
      await tx.user.update({
        where: { id: meta.recipientId },
        data: { balanceCents: { increment: amountCents } },
      });
    }
    return undefined;
  }

  const orderId = meta.orderId;
  if (!orderId) return undefined;
  const order = await tx.order.findUnique({ where: { id: orderId } });
  if (!order) return undefined;

  const alreadyPaid = order.paymentStatus === 'PAID';
  const fee = parseInt(meta.applicationFeeCents || '', 10);
  await tx.transaction.upsert({
    where: { stripePaymentId: pi.id },
    create: {
      orderId: order.id,
      userId: order.userId,
      amount: pi.amount / 100,
      currency: pi.currency || 'usd',
      status: 'SUCCEEDED',
      stripePaymentId: pi.id,
      succeededAt: new Date(),
      type: 'PAYMENT',
      applicationFeeCents: Number.isFinite(fee) ? fee : null,
    },
    update: {
      status: 'SUCCEEDED',
      succeededAt: new Date(),
      applicationFeeCents: Number.isFinite(fee) ? fee : undefined,
    },
  });

  await tx.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'PAID',
      stripePaymentIntentId: pi.id,
      status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
    },
  });

  if (!alreadyPaid) {
    try {
      const user = await tx.user.findUnique({ where: { id: order.userId } });
      await awardLoyaltyPoints(tx, {
        restaurantId: order.restaurantId,
        userId: order.userId,
        orderTotal: order.total + (order.tipAmount ?? 0),
        orderId: order.id,
        userEmail: user?.email ?? undefined,
      });
    } catch (err) {
      console.warn('[stripe] loyalty award failed:', err instanceof Error ? err.message : err);
    }
  }

  return order.id;
}

async function onPaymentFailed(pi: Stripe.PaymentIntent, tx: Db): Promise<string | undefined> {
  const orderId = pi.metadata?.orderId;
  if (!orderId) return undefined;
  const order = await tx.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentStatus === 'PAID' || order.paymentStatus === 'REFUNDED') return order?.id;

  await tx.transaction.upsert({
    where: { stripePaymentId: pi.id },
    create: {
      orderId: order.id,
      userId: order.userId,
      amount: pi.amount / 100,
      currency: pi.currency || 'usd',
      status: 'FAILED',
      stripePaymentId: pi.id,
      type: 'PAYMENT',
    },
    update: { status: 'FAILED' },
  });
  await tx.order.update({
    where: { id: order.id },
    data: { paymentStatus: 'FAILED', stripePaymentIntentId: pi.id },
  });
  return order.id;
}

async function onChargeRefunded(charge: Stripe.Charge, tx: Db): Promise<string | undefined> {
  const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  if (!piId) return undefined;
  const refundId = charge.refunds?.data?.[0]?.id;
  const full = charge.refunded || (charge.amount > 0 && charge.amount_refunded >= charge.amount);
  return markRefunded(tx, piId, full, refundId);
}

async function onRefund(refund: Stripe.Refund, tx: Db): Promise<string | undefined> {
  if (refund.status !== 'succeeded') return undefined;
  const piId = typeof refund.payment_intent === 'string' ? refund.payment_intent : refund.payment_intent?.id;
  if (!piId) return undefined;
  const txn = await tx.transaction.findUnique({ where: { stripePaymentId: piId } });
  if (!txn) return undefined;
  const full = Math.round(refund.amount) >= Math.round(txn.amount * 100);
  return markRefunded(tx, piId, full, refund.id);
}

async function markRefunded(tx: Db, piId: string, full: boolean, refundId?: string): Promise<string | undefined> {
  const order = await tx.order.findFirst({ where: { stripePaymentIntentId: piId } });
  const status = full ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
  await tx.transaction.updateMany({
    where: { stripePaymentId: piId },
    data: {
      status,
      stripeRefundId: refundId,
      type: full ? 'REFUND' : 'PARTIAL_REFUND',
    },
  });
  if (!order) return undefined;
  await tx.order.update({
    where: { id: order.id },
    data: { paymentStatus: status },
  });
  return order.id;
}

async function onPayout(event: Stripe.Event, payout: Stripe.Payout, tx: Db) {
  const accountId = event.account;
  if (!accountId) return;
  const restaurant = await tx.restaurant.findFirst({ where: { stripeAccount: accountId } });
  if (!restaurant) return;
  const arrival = payout.arrival_date ? new Date(payout.arrival_date * 1000) : null;
  await tx.payout.upsert({
    where: { stripePayoutId: payout.id },
    create: {
      restaurantId: restaurant.id,
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
    },
  });
}
