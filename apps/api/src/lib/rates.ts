/**
 * Platform fee. Defaults are cheaper to change than Toast (~2.49% + 15¢) or
 * Square (~2.6% + 10¢): 2.5% with no fixed per-order fee, 1.5% after $50k/month.
 *
 * All values are read from the environment on each call so pricing can change
 * without a code deploy:
 *   PLATFORM_FEE_RATE            fraction, default 0.025 (2.5%)
 *   PLATFORM_VOLUME_FEE_RATE     fraction, default 0.015 (1.5%)
 *   PLATFORM_VOLUME_THRESHOLD    dollars of completed volume / month, default 50000
 *   PLATFORM_FEE_FIXED_CENTS     flat cents added to every order, default 0
 */
export const BASE_RATE = 0.025;
export const VOLUME_RATE = 0.015;
export const VOLUME_THRESHOLD_MONTHLY = 50_000;

function readFraction(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n >= 1) {
    console.warn(`[rates] Ignoring ${name}=${raw}; expected a fraction between 0 and 1 (0.025 = 2.5%).`);
    return fallback;
  }
  return n;
}

function readDollars(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

/** Flat cents added on top of the percentage. 0 keeps Drift cheaper than a per-swipe fee. */
export function configuredFixedCents(): number {
  const raw = process.env.PLATFORM_FEE_FIXED_CENTS;
  if (raw == null || raw.trim() === '') return 0;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) return 0;
  return n;
}

export function configuredBaseRate(): number {
  return readFraction('PLATFORM_FEE_RATE', BASE_RATE);
}

export function configuredVolumeRate(): number {
  return readFraction('PLATFORM_VOLUME_FEE_RATE', VOLUME_RATE);
}

export function configuredVolumeThreshold(): number {
  return readDollars('PLATFORM_VOLUME_THRESHOLD', VOLUME_THRESHOLD_MONTHLY);
}

/** Percentage fee plus optional flat cents. */
export function calcFeeCents(amountCents: number, rate: number, fixedCents?: number): number {
  const fixed = fixedCents ?? configuredFixedCents();
  return Math.round(amountCents * rate) + fixed;
}

/**
 * Application fee actually sent to Stripe. Must be strictly less than the charge.
 * A 1-cent order cannot carry a fee.
 */
export function applicationFeeCents(amountCents: number, rate: number): number {
  if (amountCents <= 1) return 0;
  return Math.min(calcFeeCents(amountCents, rate), amountCents - 1);
}

/** Determine which rate applies based on monthly completed volume (dollars). */
export function getRateForVolume(monthlyTotal: number): number {
  return monthlyTotal >= configuredVolumeThreshold() ? configuredVolumeRate() : configuredBaseRate();
}
