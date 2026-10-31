import { describe, expect, it } from 'vitest';
import { applicationFeeCents } from './rates';
import {
  destinationChargeBlocker,
  expressAccountCreateParams,
  testConnectedAccountParams,
} from './connect';
import { buildDestinationChargeParams, chargeAmountCents } from './charges';

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
  it('blocks a bare Express account that cannot transfer yet', () => {
    const blocker = destinationChargeBlocker({
      id: 'acct_new',
      charges_enabled: false,
      payouts_enabled: false,
      capabilities: { transfers: 'inactive' },
    });
    expect(blocker?.code).toBe('DESTINATION_INSUFFICIENT_CAPABILITIES');
  });

  it('allows an account with charges and transfers active', () => {
    expect(
      destinationChargeBlocker({
        id: 'acct_ready',
        charges_enabled: true,
        payouts_enabled: true,
        capabilities: { transfers: 'active' },
      })
    ).toBeNull();
  });

  it('charges total plus tip, not tip twice', () => {
    expect(chargeAmountCents(21, 3.78)).toBe(2478);
  });

  it('sends a destination charge with a configurable application fee', () => {
    const params = buildDestinationChargeParams({
      amountCents: 3000,
      destination: 'acct_rest',
      feeRate: 0.02,
      orderId: 'ord_1',
      restaurantId: 'rest_1',
    });
    expect(params.amount).toBe(3000);
    expect(params.transfer_data).toEqual({ destination: 'acct_rest' });
    expect(params.application_fee_amount).toBe(applicationFeeCents(3000, 0.02));
    expect(params.metadata).toMatchObject({ orderId: 'ord_1', restaurantId: 'rest_1', applicationFeeCents: '60' });
  });
});
