/**
 * Order money is computed here and only here. Client prices, tax, and totals
 * are ignored. Tip is a percent of the pre-tax subtotal, also applied here.
 */

export class PricingError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export type PricedLine = {
  menuItemId: string;
  name: string;
  quantity: number;
  /** Unit price in dollars, from the menu row. */
  price: number;
};

export type PricedOrder = {
  items: PricedLine[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  chargeCents: number;
  subtotal: number;
  taxAmount: number;
  tipAmount: number;
  total: number;
  taxRate: number;
  tipPercent: number;
};

export type MenuRow = {
  id: string;
  restaurantId: string;
  name: string;
  price: number;
  isAvailable: boolean;
};

export function dollarsToCents(dollars: number): number {
  return Math.round(Number(dollars) * 100);
}

export function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

/** Tax and fee rates are fractions. 0.08875 is 8.875%. */
export function normalizeTaxRate(rate: number): number {
  if (!Number.isFinite(rate) || rate < 0 || rate > 0.3) {
    throw new PricingError('INVALID_TAX_RATE', 'Tax rate must be between 0% and 30%.');
  }
  return rate;
}

export function normalizeTipPercent(percent: number): number {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new PricingError('INVALID_TIP', 'Tip must be between 0% and 100%.');
  }
  return percent;
}

export function priceOrder(input: {
  restaurantId: string;
  lines: { menuItemId?: string; quantity?: number }[];
  menu: MenuRow[];
  taxRate: number;
  tipPercent: number;
}): PricedOrder {
  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    throw new PricingError('EMPTY_ORDER', 'Add at least one item.');
  }
  const taxRate = normalizeTaxRate(input.taxRate);
  const tipPercent = normalizeTipPercent(input.tipPercent);
  const byId = new Map(input.menu.map((item) => [item.id, item]));

  let subtotalCents = 0;
  const items: PricedLine[] = [];
  for (const line of input.lines) {
    const quantity = line.quantity;
    if (!Number.isInteger(quantity) || quantity! < 1 || quantity! > 99) {
      throw new PricingError('INVALID_QUANTITY', 'Quantity must be a whole number from 1 to 99.');
    }
    const item = line.menuItemId ? byId.get(line.menuItemId) : undefined;
    if (!item || item.restaurantId !== input.restaurantId) {
      throw new PricingError('UNKNOWN_ITEM', 'That item is not on this menu.');
    }
    if (!item.isAvailable) {
      throw new PricingError('ITEM_UNAVAILABLE', `${item.name} is not available.`);
    }
    const unitCents = dollarsToCents(item.price);
    if (unitCents < 0) {
      throw new PricingError('INVALID_PRICE', `${item.name} has an invalid menu price.`);
    }
    subtotalCents += unitCents * quantity!;
    items.push({
      menuItemId: item.id,
      name: item.name,
      quantity: quantity!,
      price: centsToDollars(unitCents),
    });
  }

  const taxCents = Math.round(subtotalCents * taxRate);
  const tipCents = Math.round(subtotalCents * (tipPercent / 100));
  const totalCents = subtotalCents + taxCents;
  return {
    items,
    subtotalCents,
    taxCents,
    tipCents,
    totalCents,
    chargeCents: totalCents + tipCents,
    subtotal: centsToDollars(subtotalCents),
    taxAmount: centsToDollars(taxCents),
    tipAmount: centsToDollars(tipCents),
    total: centsToDollars(totalCents),
    taxRate,
    tipPercent,
  };
}

/** Recompute tip when the diner changes the percent. Food and tax stay put. */
export function repriceTip(subtotalCents: number, taxCents: number, tipPercent: number) {
  const percent = normalizeTipPercent(tipPercent);
  const tipCents = Math.round(subtotalCents * (percent / 100));
  return {
    tipPercent: percent,
    tipCents,
    tipAmount: centsToDollars(tipCents),
    chargeCents: taxCents + subtotalCents + tipCents,
  };
}
