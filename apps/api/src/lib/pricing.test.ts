import { describe, expect, it } from 'vitest';
import { priceOrder, PricingError } from './pricing';

const menu = [
  { id: 'salmon', restaurantId: 'rest', name: 'Salmon', price: 24, isAvailable: true },
  { id: 'soda', restaurantId: 'rest', name: 'Soda', price: 3, isAvailable: false },
  { id: 'other', restaurantId: 'elsewhere', name: 'Steak', price: 40, isAvailable: true },
];

describe('server-side order pricing', () => {
  it('prices lines from the menu and ignores client amounts', () => {
    const quote = priceOrder({
      restaurantId: 'rest',
      lines: [{ menuItemId: 'salmon', quantity: 2, price: 0.01, total: 1 } as any],
      menu,
      taxRate: 0.1,
      tipPercent: 18,
    });
    expect(quote.items[0].price).toBe(24);
    expect(quote.subtotal).toBe(48);
    expect(quote.taxAmount).toBe(4.8);
    expect(quote.tipAmount).toBe(8.64);
    expect(quote.total).toBe(52.8);
    expect(quote.chargeCents).toBe(6144);
  });

  it('rejects an unknown item', () => {
    expect(() =>
      priceOrder({
        restaurantId: 'rest',
        lines: [{ menuItemId: 'missing', quantity: 1 }],
        menu,
        taxRate: 0,
        tipPercent: 0,
      })
    ).toThrow(PricingError);
  });

  it('rejects an item from another restaurant', () => {
    try {
      priceOrder({
        restaurantId: 'rest',
        lines: [{ menuItemId: 'other', quantity: 1 }],
        menu,
        taxRate: 0,
        tipPercent: 0,
      });
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(PricingError);
      expect((err as PricingError).code).toBe('UNKNOWN_ITEM');
    }
  });

  it('rejects an unavailable item', () => {
    try {
      priceOrder({
        restaurantId: 'rest',
        lines: [{ menuItemId: 'soda', quantity: 1 }],
        menu,
        taxRate: 0,
        tipPercent: 0,
      });
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as PricingError).code).toBe('ITEM_UNAVAILABLE');
    }
  });
});
