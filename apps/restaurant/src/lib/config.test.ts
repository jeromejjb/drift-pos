import { describe, it, expect } from 'vitest';
import { config } from './config';

describe('config', () => {
  it('routes.dashboard returns correct path', () => {
    expect(config.routes.dashboard('abc123')).toBe('/dashboard/abc123');
  });
  it('routes.onboarding returns correct path', () => {
    expect(config.routes.onboarding('abc123')).toBe('/onboarding?restaurantId=abc123');
  });
});
