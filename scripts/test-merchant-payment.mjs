#!/usr/bin/env node
/**
 * Test merchant payment endpoint
 * Usage: node scripts/test-merchant-payment.mjs [API_URL]
 * Requires: API running, .env with STRIPE_SECRET_KEY, SUPABASE_*, DATABASE_URL
 */

const API_URL = process.argv[2] || process.env.API_URL || 'http://localhost:3001';

function log(name, ok, detail) {
  const icon = ok ? '✓' : '✗';
  console.log(`${icon} ${name}${detail ? ': ' + detail : ''}`);
}

async function test() {
  console.log('\n--- Merchant Payment Endpoint Tests ---\n');

  // 1. No auth - should get 401
  try {
    const r = await fetch(`${API_URL}/api/p2p/merchant-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 5, destination: 'acct_test123' }),
    });
    log('No auth returns 401', r.status === 401, r.status);
  } catch (e) {
    log('No auth (connection)', false, e.message);
  }

  // 2. Invalid token - should get 401
  try {
    const r = await fetch(`${API_URL}/api/p2p/merchant-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid-token',
      },
      body: JSON.stringify({ amount: 5, destination: 'acct_test123' }),
    });
    const data = await r.json().catch(() => ({}));
    log('Invalid token returns 401', r.status === 401, r.status);
  } catch (e) {
    log('Invalid token (connection)', false, e.message);
  }

  // 3. Missing amount - with valid-looking auth, should get 400
  try {
    const r = await fetch(`${API_URL}/api/p2p/merchant-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
      },
      body: JSON.stringify({ destination: 'acct_test123' }),
    });
    const data = await r.json().catch(() => ({}));
    const ok = r.status === 400 || r.status === 401; // 401 if auth fails first
    log('Missing amount returns 400 or 401', ok, r.status + ' ' + (data.code || ''));
  } catch (e) {
    log('Missing amount (connection)', false, e.message);
  }

  // 4. Invalid destination (not acct_) - with auth, should get 400
  try {
    const r = await fetch(`${API_URL}/api/p2p/merchant-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
      },
      body: JSON.stringify({ amount: 5, destination: 'invalid' }),
    });
    const data = await r.json().catch(() => ({}));
    const ok = r.status === 400 || r.status === 401;
    log('Invalid destination returns 400 or 401', ok, r.status);
  } catch (e) {
    log('Invalid destination (connection)', false, e.message);
  }

  // 5. Integration metadata - no auth needed
  try {
    const r = await fetch(`${API_URL}/api/integration`);
    const data = await r.json().catch(() => ({}));
    const hasCheckout = !!data.flows?.dinerTableCheckout && !!data.endpoints?.orderPaymentIntent;
    log('GET /api/integration documents table checkout', hasCheckout && r.ok);
  } catch (e) {
    log('Integration endpoint', false, e.message);
  }

  // 6. API health
  try {
    const r = await fetch(`${API_URL}/api/test`);
    log('API /api/test responds', r.ok);
  } catch (e) {
    log('API reachable', false, e.message);
    console.log('\nIs the API running? Try: npm run dev --workspace=apps/api\n');
  }

  console.log('\n--- Done ---\n');
}

test().catch(console.error);
