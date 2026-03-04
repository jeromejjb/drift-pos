/**
 * Loyalty points logic — 1 point per $1 spent.
 * Tiers: BRONZE 1x, SILVER 1.25x, GOLD 1.5x
 */

import type { PrismaClient } from '@prisma/client';

const POINTS_PER_DOLLAR = 1;
const TIER_MULTIPLIERS: Record<string, number> = {
  BRONZE: 1,
  SILVER: 1.25,
  GOLD: 1.5,
};

export async function awardLoyaltyPoints(
  prisma: PrismaClient,
  params: { restaurantId: string; userId: string; orderTotal: number; orderId: string; userEmail?: string }
) {
  const { restaurantId, userId, orderTotal, userEmail } = params;
  if (orderTotal <= 0) return;

  const loyalty = await prisma.dinerLoyalty.upsert({
    where: {
      restaurantId_userId: { restaurantId, userId },
    },
    create: {
      restaurantId,
      userId,
      email: userEmail ?? null,
      points: 0,
      tier: 'BRONZE',
      lastOrderAt: new Date(),
    },
    update: {
      lastOrderAt: new Date(),
    },
  });

  const multiplier = TIER_MULTIPLIERS[loyalty.tier] ?? 1;
  const earned = Math.floor(orderTotal * POINTS_PER_DOLLAR * multiplier);

  await prisma.dinerLoyalty.update({
    where: { id: loyalty.id },
    data: {
      points: { increment: earned },
      email: userEmail ?? loyalty.email,
    },
  });

  return earned;
}
