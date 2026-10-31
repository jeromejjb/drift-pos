/**
 * Drift's margin on a direct charge. The connected restaurant pays Stripe's
 * card processing fee (default 2.9% + 30¢). Drift only keeps the application
 * fee, so the platform cannot lose money on the processor's cut.
 *
 *   PLATFORM_FEE_RATE              Drift margin, default 0.015 (1.5%)
 *   PLATFORM_VOLUME_FEE_RATE       margin after the volume threshold, default 0.01
 *   PLATFORM_VOLUME_THRESHOLD      paid dollars / month, default 50000
 *   PLATFORM_FEE_FIXED_CENTS       extra flat cents on the application fee, default 0
 *   STRIPE_PROCESSING_RATE         estimate of the connected account's card rate, default 0.029
 *   STRIPE_PROCESSING_FIXED_CENTS  estimate of Stripe's fixed fee, default 30
 *
 * A restaurant.platformFeeRate override replaces the volume schedule.
 */
export const BASE_RATE = 0.015;
export const VOLUME_RATE = 0.01;
export const VOLUME_THRESHOLD_MONTHLY = 50_000;
export const STRIPE_PROCESSING_RATE = 0.029;
export const STRIPE_PROCESSING_FIXED_CENTS = 30;

function readFraction(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n >= 1) {
    console.warn(`[rates] Ignoring ${name}=${raw}; expected a fraction between 0 and 1 (0.015 = 1.5%).`);
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

/** Determine which Drift margin applies based on monthly paid volume (dollars). */
export function getRateForVolume(monthlyTotal: number): number {
  return monthlyTotal >= configuredVolumeThreshold() ? configuredVolumeRate() : configuredBaseRate();
}

/** A per-restaurant override wins. Otherwise the env volume schedule applies. */
export function marginRate(monthlyTotal: number, restaurantOverride?: number | null): number {
  if (restaurantOverride != null && Number.isFinite(restaurantOverride) && restaurantOverride >= 0 && restaurantOverride < 1) {
    return restaurantOverride;
  }
  return getRateForVolume(monthlyTotal);
}

export function stripeProcessingCents(amountCents: number): number {
  const rate = readFraction('STRIPE_PROCESSING_RATE', STRIPE_PROCESSING_RATE);
  const rawFixed = process.env.STRIPE_PROCESSING_FIXED_CENTS;
  let fixed = STRIPE_PROCESSING_FIXED_CENTS;
  if (rawFixed != null && rawFixed.trim() !== '') {
    const n = Number(rawFixed);
    if (Number.isInteger(n) && n >= 0) fixed = n;
  }
  return Math.round(amountCents * rate) + fixed;
}

/**
 * Direct-charge economics. Drift nets the application fee. The restaurant
 * pays Stripe's processing fee from the connected account balance.
 */
export function quoteOrderFees(amountCents: number, margin: number) {
  const feeCents = applicationFeeCents(amountCents, margin);
  const processingCents = stripeProcessingCents(amountCents);
  return {
    amountCents,
    marginRate: margin,
    applicationFeeCents: feeCents,
    stripeProcessingCents: processingCents,
    driftNetCents: feeCents,
    restaurantNetCents: amountCents - processingCents - feeCents,
    model: 'direct_charge' as const,
  };
}
