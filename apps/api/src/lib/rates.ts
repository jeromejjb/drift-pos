/**
 * Platform fee rates: 2.5% base, 1.5% at volume ($50k+/month)
 */
export const BASE_RATE = 0.025;
export const VOLUME_RATE = 0.015;
export const VOLUME_THRESHOLD_MONTHLY = 50_000;

/** Calculate platform fee in cents for a given amount and rate. */
export function calcFeeCents(amountCents: number, rate: number): number {
  return Math.round(amountCents * rate);
}

/** Determine which rate applies based on monthly volume. */
export function getRateForVolume(monthlyTotal: number): number {
  return monthlyTotal >= VOLUME_THRESHOLD_MONTHLY ? VOLUME_RATE : BASE_RATE;
}
