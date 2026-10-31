import { describe, it, expect } from 'vitest';
import {
  BASE_RATE,
  VOLUME_RATE,
  VOLUME_THRESHOLD_MONTHLY,
  calcFeeCents,
  getRateForVolume,
} from './rates';

describe('rates', () => {
  describe('constants', () => {
    it('BASE_RATE is 2.5%', () => {
      expect(BASE_RATE).toBe(0.025);
    });
    it('VOLUME_RATE is 1.5%', () => {
      expect(VOLUME_RATE).toBe(0.015);
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
      expect(calcFeeCents(10_000, BASE_RATE)).toBe(250); // $100 * 2.5%
    });
    it('calculates fee for volume rate', () => {
      expect(calcFeeCents(10_000, VOLUME_RATE)).toBe(150); // $100 * 1.5%
    });
    it('rounds to nearest cent', () => {
      expect(calcFeeCents(333, BASE_RATE)).toBe(8); // 8.325 -> 8
    });
    it('adds a configurable flat fee', () => {
      process.env.PLATFORM_FEE_FIXED_CENTS = '15';
      expect(calcFeeCents(10_000, BASE_RATE)).toBe(265);
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
  });
});
