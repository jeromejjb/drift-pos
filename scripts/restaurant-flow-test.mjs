#!/usr/bin/env node
/**
 * Restaurant flow API test — runs through register, update, QR, menu.
 * Usage: node scripts/restaurant-flow-test.mjs [API_URL]
 * Requires: API running, DATABASE_URL in API .env
 */

const API_URL = process.env.VITE_API_URL || process.argv[2] || 'http://localhost:3001';
const FETCH_TIMEOUT = 5000;

const results = [];

async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(t);
    return res;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

function log(msg, status = '') {
  const s = status ? ` ${status}` : '';
  console.log(`  ${msg}${s}`);
  results.push({ step: msg, status: status || 'ok' });
}

async function run() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           RESTAURANT FLOW — API TEST                             ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`API: ${API_URL}`);
  console.log('');

  let token, restaurantId;

  // 1. Register
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Flow Test Owner',
        email: `flow-test-${Date.now()}@example.com`,
        password: 'TestPass123!',
        restaurantName: 'Flow Test Pizza',
        tableCount: 3
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      log('1. Register', `FAIL — ${data.error || res.status}`);
      throw new Error(data.error);
    }
    token = data.token;
    restaurantId = data.restaurantId;
    log('1. Register', '✓');
  } catch (e) {
    log('1. Register', `FAIL — ${e.name === 'AbortError' ? 'timeout' : e.message}`);
    printSummary();
    process.exit(1);
  }

  // 2. Update restaurant
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/restaurants/${restaurantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: 'Flow Test Pizza Updated',
        address: '123 Test St, Detroit, MI 48201',
        phone: '5551234567'
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      log('2. Update restaurant', `FAIL — ${err.error || res.status}`);
    } else {
      log('2. Update restaurant', '✓');
    }
  } catch (e) {
    log('2. Update restaurant', `FAIL — ${e.message}`);
  }

  // 3. Generate QR codes
  try {
    const tables = [
      { id: 't1', number: 1 },
      { id: 't2', number: 2 },
      { id: 't3', number: 3 }
    ];
    const res = await fetchWithTimeout(`${API_URL}/api/restaurants/${restaurantId}/tables/generate-qrs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tables })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      log('3. Generate QR codes', `FAIL — ${data.error || res.status}`);
    } else if (!data.tables || data.tables.length === 0) {
      log('3. Generate QR codes', 'FAIL — no tables returned');
    } else {
      log(`3. Generate QR codes (${data.tables.length} codes)`, '✓');
    }
  } catch (e) {
    log('3. Generate QR codes', `FAIL — ${e.message}`);
  }

  // 4. Save menu (bulk)
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/restaurants/${restaurantId}/menu/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        categories: [
          { name: 'Pizza', items: [{ name: 'Margherita', description: 'Tomato, mozzarella', price: 18 }] },
          { name: 'Drinks', items: [{ name: 'Soda', description: 'Fountain drink', price: 3 }] }
        ]
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      log('4. Save menu (bulk)', `FAIL — ${err.error || res.status}`);
    } else {
      log('4. Save menu (bulk)', '✓');
    }
  } catch (e) {
    log('4. Save menu (bulk)', `FAIL — ${e.message}`);
  }

  // 5. Fetch menu (verify)
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/restaurant/${restaurantId}/menu`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      log('5. Fetch menu (verify)', `FAIL — ${res.status}`);
    } else {
      const count = Array.isArray(data) ? data.reduce((n, c) => n + (c.items?.length || 0), 0) : 0;
      log(`5. Fetch menu (${count} items)`, '✓');
    }
  } catch (e) {
    log('5. Fetch menu (verify)', `FAIL — ${e.message}`);
  }

  // 6. Fetch orders (empty is ok)
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/restaurant/${restaurantId}/orders`);
    if (!res.ok) {
      log('6. Fetch orders', `FAIL — ${res.status}`);
    } else {
      log('6. Fetch orders', '✓');
    }
  } catch (e) {
    log('6. Fetch orders', `FAIL — ${e.message}`);
  }

  printSummary();
}

function printSummary() {
  console.log('');
  console.log('──────────────────────────────────────────────────────────────────');
  console.log('RESPONSE SUMMARY');
  console.log('──────────────────────────────────────────────────────────────────');
  const passed = results.filter(r => r.status === '✓' || r.status === 'ok').length;
  const failed = results.filter(r => r.status.startsWith('FAIL'));
  results.forEach(r => {
    const mark = (r.status === '✓' || r.status === 'ok') ? '✓' : '✗';
    console.log(`  ${mark} ${r.step}${r.status.startsWith('FAIL') ? ` — ${r.status}` : ''}`);
  });
  console.log('');
  console.log(`Passed: ${passed}/${results.length}${failed.length ? ` | Failed: ${failed.length}` : ''}`);
  console.log('');
  process.exit(failed.length > 0 ? 1 : 0);
}

run().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
