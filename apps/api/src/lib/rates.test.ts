import { describe, it, expect } from 'vitest';
import {
  BASE_RATE,
  VOLUME_RATE,
  VOLUME_THRESHOLD_MONTHLY,
  calcFeeCents,
  getRateForVolume,
  marginRate,
  quoteOrderFees,
} from './rates';

describe('rates', () => {
  describe('constants', () => {
    it('BASE_RATE is the 1.5% margin', () => {
      expect(BASE_RATE).toBe(0.015);
    });
    it('VOLUME_RATE is 1%', () => {
      expect(VOLUME_RATE).toBe(0.01);
    });
    it('VOLUME_THRESHOLD_MONTHLY is $50,000', () => {
      expect(VOLUME_THRESHOLD_MONTHLY).toBe(50_000);
    });
  });

  describe('getRateForVolume', () => {
    it('returns BASE_RATE when below threshold', () => {
      expect(getRateForVolume(0)).toBe(BASE_RATE);
      expect(getRateForVolume(49_999)).toBe(BASE_RATE);
    });
    it('returns VOLUME_RATE when at or above threshold', () => {
      expect(getRateForVolume(50_000)).toBe(VOLUME_RATE);
      expect(getRateForVolume(100_000)).toBe(VOLUME_RATE);
    });
  });

  describe('calcFeeCents', () => {
    it('calculates fee for base rate', () => {
      expect(calcFeeCents(10_000, BASE_RATE)).toBe(150); // $100 * 1.5%
    });
    it('calculates fee for volume rate', () => {
      expect(calcFeeCents(10_000, VOLUME_RATE)).toBe(100); // $100 * 1%
    });
    it('rounds to nearest cent', () => {
      expect(calcFeeCents(333, 0.025)).toBe(8); // 8.325 -> 8
    });
    it('adds a configurable flat fee', () => {
      process.env.PLATFORM_FEE_FIXED_CENTS = '15';
      expect(calcFeeCents(10_000, BASE_RATE)).toBe(165);
      delete process.env.PLATFORM_FEE_FIXED_CENTS;
    });
  });

  describe('environment overrides', () => {
    it('reads PLATFORM_FEE_RATE as a fraction', () => {
      process.env.PLATFORM_FEE_RATE = '0.01';
      expect(getRateForVolume(0)).toBe(0.01);
      delete process.env.PLATFORM_FEE_RATE;
      expect(getRateForVolume(0)).toBe(BASE_RATE);
    });
    it('ignores a percent-style value such as 2.5', () => {
      process.env.PLATFORM_FEE_RATE = '2.5';
      expect(getRateForVolume(0)).toBe(BASE_RATE);
      delete process.env.PLATFORM_FEE_RATE;
    });
    it('uses a per-restaurant override instead of the volume schedule', () => {
      expect(marginRate(100_000, 0.02)).toBe(0.02);
      expect(marginRate(0, null)).toBe(BASE_RATE);
    });
    it('quotes a $40 direct charge so Drift nets the margin', () => {
      const quote = quoteOrderFees(4000, 0.015);
      expect(quote.stripeProcessingCents).toBe(146);
      expect(quote.applicationFeeCents).toBe(60);
      expect(quote.driftNetCents).toBe(60);
      expect(quote.restaurantNetCents).toBe(3794);
    });
  });
});
