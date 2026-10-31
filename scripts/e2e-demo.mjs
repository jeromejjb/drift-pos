#!/usr/bin/env node
/**
 * Full-stack E2E smoke (API): landing-style signup, restaurant profile/menu/QR,
 * diner menu → order with tip → PaymentIntent (Stripe may warn if Connect incomplete).
 *
 * Writes apps/landing/public/e2e-results.json for the demo page.
 *
 * Usage: node scripts/e2e-demo.mjs [API_URL]
 * Requires: API running (e.g. http://localhost:3001)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_JSON = path.join(ROOT, 'apps/landing/public/e2e-results.json');

const API_URL = process.env.VITE_API_URL || process.argv[2] || 'http://localhost:3001';
const TIMEOUT_MS = Number(process.env.E2E_TIMEOUT_MS || 20000);

/** @type {{ group: string, id: string, label: string, status: 'pass'|'warn'|'fail', detail: string, ms?: number }[]} */
const steps = [];

async function fetchJson(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    const text = await res.text();
    let body;
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      body = { _raw: text.slice(0, 500) };
    }
    return { res, body, ms: Date.now() - started };
  } finally {
    clearTimeout(t);
  }
}

function record(group, id, label, status, detail, ms) {
  steps.push({ group, id, label, status, detail: String(detail || '').slice(0, 800), ms });
  const icon = status === 'pass' ? '✓' : status === 'warn' ? '⚠' : '✗';
  console.log(`  ${icon} [${group}] ${label} — ${detail}${ms != null ? ` (${ms}ms)` : ''}`);
}

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  Drift — E2E demo (API) → writes landing/public/e2e-results.json ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`API: ${API_URL}`);
  console.log('');

  let token;
  let restaurantId;
  let registerEmail;
  const password = 'TestPass123!';

  // --- API ---
  {
    const { res, body, ms } = await fetchJson(`${API_URL}/api/test`);
    if (res.ok && body.message) record('API', 'health', 'GET /api/test', 'pass', body.message, ms);
    else record('API', 'health', 'GET /api/test', 'fail', body.error || res.status, ms);
  }
  {
    const { res, body, ms } = await fetchJson(`${API_URL}/api/integration`);
    if (res.ok && body.product) record('API', 'integration', 'GET /api/integration', 'pass', body.product, ms);
    else record('API', 'integration', 'GET /api/integration', 'fail', body.error || res.status, ms);
  }

  // --- Landing (signup = register) ---
  registerEmail = `e2e-demo-${Date.now()}@example.com`;
  {
    const { res, body, ms } = await fetchJson(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'E2E Demo Owner',
        email: registerEmail,
        password,
        restaurantName: 'E2E Demo Bistro',
        tableCount: 2,
      }),
    });
    if (!res.ok || !body.token) {
      record('Landing', 'register', 'POST /api/auth/register (signup form)', 'fail', body.error || res.status, ms);
      writeOutput(false);
      process.exit(1); // still wrote e2e-results.json for the demo page
    }
    token = body.token;
    restaurantId = body.restaurantId;
    record('Landing', 'register', 'POST /api/auth/register (signup form)', 'pass', `restaurantId=${restaurantId}`, ms);
  }

  // --- Restaurant session (verify = “logged in”) ---
  {
    const { res, body, ms } = await fetchJson(`${API_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok && body.valid) record('Restaurant', 'verify', 'GET /api/auth/verify (session)', 'pass', body.user?.email || 'ok', ms);
    else record('Restaurant', 'verify', 'GET /api/auth/verify', 'fail', body.error || res.status, ms);
  }

  // --- Restaurant profile form ---
  {
    const { res, body, ms } = await fetchJson(`${API_URL}/api/restaurants/${restaurantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: 'E2E Demo Bistro (updated)',
        address: '500 Woodward Ave, Detroit, MI 48226',
        phone: '3135550100',
      }),
    });
    if (res.ok) record('Restaurant', 'profile', 'PATCH /api/restaurants/:id (profile)', 'pass', 'address + phone saved', ms);
    else record('Restaurant', 'profile', 'PATCH /api/restaurants/:id', 'fail', body.error || res.status, ms);
  }

  // --- QR / tables (onboarding-style) ---
  {
    const { res, body, ms } = await fetchJson(`${API_URL}/api/restaurants/${restaurantId}/tables/generate-qrs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tables: [
          { id: 't1', number: 1 },
          { id: 't2', number: 2 },
        ],
      }),
    });
    if (res.ok && Array.isArray(body.tables) && body.tables.length)
      record('Restaurant', 'qrs', 'POST …/tables/generate-qrs', 'pass', `${body.tables.length} table QR payloads`, ms);
    else record('Restaurant', 'qrs', 'POST …/generate-qrs', 'fail', body.error || res.status, ms);
  }

  // --- Menu form + public menu (diner reads same API the menu page uses) ---
  {
    const { res, body, ms } = await fetchJson(`${API_URL}/api/restaurants/${restaurantId}/menu/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        categories: [
          { name: 'Mains', items: [{ name: 'Demo Burger', description: 'E2E item', price: 14.5 }] },
          { name: 'Drinks', items: [{ name: 'Iced Tea', description: '', price: 3 }] },
        ],
      }),
    });
    if (res.ok) record('Restaurant', 'menu-bulk', 'POST …/menu/bulk (menu editor)', 'pass', '2 categories saved', ms);
    else record('Restaurant', 'menu-bulk', 'POST …/menu/bulk', 'fail', body.error || res.status, ms);
  }

  let menuItemId;
  let menuItemPrice = 14.5;
  {
    const { res, body, ms } = await fetchJson(`${API_URL}/api/restaurant/${restaurantId}/menu`);
    if (!res.ok || !Array.isArray(body)) {
      record('Diner', 'menu-read', 'GET /api/restaurant/:id/menu (diner menu)', 'fail', body?.error || res.status, ms);
    } else {
      const cat = body.find((c) => c.items?.length) || body[0];
      const item = cat?.items?.[0];
      if (item?.id) {
        menuItemId = item.id;
        menuItemPrice = typeof item.price === 'number' ? item.price : menuItemPrice;
        record('Diner', 'menu-read', 'GET /api/restaurant/:id/menu (diner menu)', 'pass', `${item.name} $${menuItemPrice}`, ms);
      } else record('Diner', 'menu-read', 'GET …/menu', 'fail', 'no items', ms);
    }
  }

  let tableId;
  {
    const { res, body, ms } = await fetchJson(`${API_URL}/api/restaurant/${restaurantId}/tables`);
    if (res.ok && Array.isArray(body) && body[0]?.id) {
      tableId = body[0].id;
      record('Diner', 'tables', 'GET /api/restaurant/:id/tables', 'pass', `table #${body[0].number ?? '?'}`, ms);
    } else record('Diner', 'tables', 'GET …/tables', 'fail', body?.error || res.status, ms);
  }

  // --- Login form (same user) ---
  {
    const { res, body, ms } = await fetchJson(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: registerEmail, password }),
    });
    if (res.ok && body.token) record('Restaurant', 'login', 'POST /api/auth/login (sign-in form)', 'pass', 'token issued', ms);
    else record('Restaurant', 'login', 'POST /api/auth/login', 'fail', body.error || res.status, ms);
  }

  // --- Checkout: order + tip ---
  const tipPercent = 18;
  const dinerUserId = `e2e-guest-${Date.now()}`;
  let orderId;
  if (menuItemId && tableId) {
    const total = menuItemPrice;
    const { res, body, ms } = await fetchJson(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId,
        tableId,
        userId: dinerUserId,
        items: [{ menuItemId: menuItemId, quantity: 1, price: menuItemPrice }],
        tipPercent,
      }),
    });
    if (!res.ok || !body.id) {
      record('Diner', 'order', 'POST /api/orders (cart + tip)', 'fail', body.error || res.status, ms);
    } else {
      orderId = body.id;
      const tip = body.tipAmount ?? body.tip;
      const expectedTip = Math.round(menuItemPrice * tipPercent) / 100;
      const okTip = Number(tip) === expectedTip;
      record(
        'Diner',
        'order',
        'POST /api/orders (cart + tip)',
        okTip ? 'pass' : 'fail',
        `order ${orderId} subtotal $${total} tip $${tip}`,
        ms
      );
    }
  } else {
    record('Diner', 'order', 'POST /api/orders', 'fail', 'missing menuItemId or tableId', undefined);
  }

  if (orderId) {
    const { res, body, ms } = await fetchJson(`${API_URL}/api/order/${orderId}`);
    if (res.ok && body.id) {
      const charged = (Number(body.total) || 0) + (Number(body.tipAmount) || 0);
      record('Diner', 'order-get', 'GET /api/order/:id (checkout summary)', 'pass', `payable total $${charged.toFixed(2)}`, ms);
    } else record('Diner', 'order-get', 'GET /api/order/:id', 'fail', body.error || res.status, ms);
  }

  // --- Stripe PaymentIntent (full card flow happens in diner UI; API creates intent) ---
  if (orderId) {
    const { res, body, ms } = await fetchJson(`${API_URL}/api/stripe/order/${orderId}/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (res.ok && body.clientSecret) {
      record('Diner', 'pi', 'POST …/stripe/order/:id/create-payment-intent', 'pass', 'clientSecret returned (card step in diner app)', ms);
    } else {
      const code = body.code || '';
      const msg = body.error || res.status;
      const warnCodes = ['DESTINATION_INSUFFICIENT_CAPABILITIES', 'RESTAURANT_NO_STRIPE', 'INVALID_DESTINATION_ACCOUNT'];
      if (warnCodes.includes(code) || (typeof msg === 'string' && msg.includes('not fully enabled'))) {
        record('Diner', 'pi', 'POST …/create-payment-intent', 'warn', `${msg} (${code}) — complete Stripe Connect in restaurant onboarding`, ms);
      } else {
        record('Diner', 'pi', 'POST …/create-payment-intent', 'fail', `${msg} (${code})`, ms);
      }
    }
  }

  const failed = steps.filter((s) => s.status === 'fail').length;
  writeOutput(failed === 0);
  process.exit(failed > 0 ? 1 : 0);
}

function writeOutput(allPass) {
  const pass = steps.filter((s) => s.status === 'pass').length;
  const warn = steps.filter((s) => s.status === 'warn').length;
  const fail = steps.filter((s) => s.status === 'fail').length;
  const payload = {
    generatedAt: new Date().toISOString(),
    apiUrl: API_URL,
    allStepsPass: allPass && warn === 0,
    summary: { pass, warn, fail, total: steps.length },
    steps,
    hint:
      warn > 0
        ? 'Warnings usually mean Stripe Connect is not fully activated for this new restaurant. Finish onboarding in the restaurant app, then re-run this script.'
        : fail === 0
          ? 'Open the landing app and visit /e2e-demo.html to view this report.'
          : 'Fix failing steps and re-run: node scripts/e2e-demo.mjs',
  };
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), 'utf8');
  console.log('');
  console.log(`Wrote ${path.relative(ROOT, OUT_JSON)}`);
  console.log(`Summary: ${pass} pass, ${warn} warn, ${fail} fail (${steps.length} total)`);
  console.log('');
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
