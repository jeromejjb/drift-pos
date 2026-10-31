import { describe, expect, it } from 'vitest';
import { quoteOrderFees } from './rates';
import {
  destinationChargeBlocker,
  expressAccountCreateParams,
  testConnectedAccountParams,
} from './connect';
import { buildDirectCharge, chargeAmountCents } from './charges';

describe('connect account params', () => {
  it('builds an Express account without bank details or TOS', () => {
    const params = expressAccountCreateParams({
      restaurantId: 'rest_1',
      email: 'owner@example.com',
      businessName: 'Drift Demo Kitchen',
    });
    expect(params.type).toBe('express');
    expect(params.capabilities?.card_payments).toEqual({ requested: true });
    expect(params.capabilities?.transfers).toEqual({ requested: true });
    expect(params).not.toHaveProperty('tos_acceptance');
    expect(params).not.toHaveProperty('external_account');
    expect(params).not.toHaveProperty('individual');
    expect(params.metadata).toMatchObject({ restaurantId: 'rest_1', platform: 'Drift POS' });
  });

  it('builds a test-mode custom account with Stripe verification fixtures', () => {
    const params = testConnectedAccountParams({
      restaurantId: 'rest_1',
      email: 'owner@example.com',
      businessName: 'Drift Demo Kitchen',
      fullName: 'Ada Owner',
    });
    expect(params.type).toBe('custom');
    expect(params.individual).toMatchObject({
      first_name: 'Ada',
      last_name: 'Owner',
      id_number: '000000000',
      address: { line1: 'address_full_match' },
    });
    expect(params.external_account).toMatchObject({
      routing_number: '110000000',
      account_number: '000123456789',
    });
    expect(params.settings?.payouts?.schedule?.interval).toBe('manual');
  });
});

describe('destination charges', () => {
  it('blocks a connected account that cannot take cards yet', () => {
    const blocker = destinationChargeBlocker({
      id: 'acct_new',
      charges_enabled: false,
      payouts_enabled: false,
      capabilities: { card_payments: 'inactive' },
    });
    expect(blocker?.code).toBe('CHARGES_NOT_ENABLED');
  });

  it('allows a direct charge once charges are enabled', () => {
    expect(
      destinationChargeBlocker({
        id: 'acct_ready',
        charges_enabled: true,
        payouts_enabled: false,
        capabilities: { card_payments: 'active', transfers: 'inactive' },
      })
    ).toBeNull();
  });

  it('charges total plus tip, not tip twice', () => {
    expect(chargeAmountCents(21, 3.78)).toBe(2478);
  });

  it('creates a direct charge whose application fee is only Drift margin', () => {
    const { params, options } = buildDirectCharge({
      amountCents: 4000,
      destination: 'acct_rest',
      feeRate: 0.015,
      orderId: 'ord_1',
      restaurantId: 'rest_1',
    });
    const quote = quoteOrderFees(4000, 0.015);
    expect(params.amount).toBe(4000);
    expect(params).not.toHaveProperty('transfer_data');
    expect(params.application_fee_amount).toBe(quote.applicationFeeCents);
    expect(options.stripeAccount).toBe('acct_rest');
    expect(quote.stripeProcessingCents).toBe(146);
    expect(quote.driftNetCents).toBe(60);
    expect(quote.restaurantNetCents).toBe(3794);
    expect(params.metadata).toMatchObject({ orderId: 'ord_1', chargeType: 'direct', applicationFeeCents: '60' });
  });
});
