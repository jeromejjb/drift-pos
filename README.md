# Drift POS

Drift is a restaurant point-of-sale and dine-in payment platform. Guests scan a table QR code, order from the menu, and pay with a card. Restaurant owners sign up, onboard with Stripe Connect, and run orders from a web dashboard.

This repository is an **npm workspaces monorepo** with a shared API, three front-end apps, and PostgreSQL via Prisma.

---

## Table of contents

- [What's in the repo](#whats-in-the-repo)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Running locally](#running-locally)
- [User flows](#user-flows)
- [Payments](#payments)
- [Testing](#testing)
- [Documentation](#documentation)
- [Production notes](#production-notes)

---

## What's in the repo

| App | Path | Purpose |
|-----|------|---------|
| **API** | `apps/api` | Express server: auth, restaurants, tables, menu, orders, Stripe webhooks, real-time updates (Socket.IO) |
| **Diner** | `apps/diner` | Guest mobile web app: scan table → menu → cart → checkout |
| **Restaurant** | `apps/restaurant` | Owner dashboard: onboarding, menu, tables, orders, analytics, Stripe Connect |
| **Landing** | `apps/landing` | Marketing site, signup, and login entry points |
| **Shared UI** | `packages/ui` | Reusable React components (used where imported) |

**Auth model**

- **Diner** — Supabase (email + password). Optional sign-in for saved cards and account features.
- **Restaurant** — JWT issued by the API after register/login on the landing or restaurant app.

**Database** — PostgreSQL. Schema and migrations live in `apps/api/prisma/`.

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| API | Node.js, Express 5, Prisma 7, PostgreSQL, Stripe, Socket.IO |
| Front ends | React, Vite, TypeScript, Tailwind CSS |
| Diner auth | Supabase |
| Payments | Stripe (Connect for restaurants; PaymentIntents for table checkout) |

---

## Prerequisites

Install before you begin:

- **Node.js** 20+ and **npm** 9+
- **PostgreSQL** (local or hosted)
- **Stripe** account ([dashboard.stripe.com](https://dashboard.stripe.com)) — test keys for development
- **Supabase** project ([supabase.com](https://supabase.com)) — for diner sign-in

Optional:

- [Stripe CLI](https://stripe.com/docs/stripe-cli) — forward webhooks to `localhost:3001`
- [Supabase CLI](https://supabase.com/docs/guides/cli) — if you manage migrations locally

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/jeromejjb/drift-pos.git
cd drift-pos
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your database URL, JWT secret, Stripe keys, and Supabase credentials. See [Environment variables](#environment-variables) below.

For the diner app you can also copy `apps/diner/.env.example` to `apps/diner/.env`; diner loads **root `.env` first**, then `apps/diner/.env` (diner values override).

### 3. Set up the database

```bash
cd apps/api
npm run db:push      # apply schema to your database
npm run db:seed      # optional demo data
cd ../..
```

### 4. Run the stack

**Payments-focused dev** (API + diner only):

```bash
npm run dev:pay
```

**Full local stack** (API + diner + restaurant in parallel):

```bash
npm run dev
```

Start the landing app separately when you need signup/marketing flows:

```bash
npm run dev --workspace=apps/landing
```

### 5. Open the apps

| Service | URL (local) |
|---------|-------------|
| API | http://localhost:3001 |
| Diner | http://localhost:5173 |
| Restaurant | http://localhost:5175 |
| Landing | http://localhost:5174 *(set in `.env`; default Vite port may be 5173 — use one port per app)* |

> **Port tip:** Diner and landing both default to port `5173` in Vite. Run only one at a time on that port, or start landing with an explicit port, e.g. `npx vite --port 5174` from `apps/landing`.

---

## Environment variables

Copy from `.env.example`. Minimum required for the API:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | At least 32 random characters in production |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...` locally) |
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard or `stripe listen` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for front ends (`pk_test_...`) |
| `VITE_SUPABASE_URL` | Supabase project URL (diner auth) |
| `VITE_SUPABASE_ANON_KEY` | Supabase **anon** public key (never the service role in the browser) |
| `VITE_API_URL` | API base URL — use `http://localhost:3001` for local dev |

Also set app URLs so Stripe Connect redirects work:

- `RESTAURANT_URL` — e.g. `http://localhost:5175`
- `DINER_URL` — e.g. `http://localhost:5173`
- `LANDING_URL` — e.g. `http://localhost:5174`

Run the Supabase profiles migration once — see [`supabase/README.md`](supabase/README.md).

Full payment setup and webhook forwarding: [`docs/PAYMENT_TEST_GUIDE.md`](docs/PAYMENT_TEST_GUIDE.md).

---

## Running locally

### Root scripts

| Command | What it does |
|---------|----------------|
| `npm run dev` | API + diner + restaurant |
| `npm run dev:pay` | API + diner (table checkout testing) |
| `npm run build` | Production build for all apps |
| `npm test` | API + restaurant unit tests |
| `npm run test:restaurant` | Restaurant registration → menu → order flow script |
| `npm run test:e2e:demo` | E2E demo script (see `scripts/e2e-demo.mjs`) |
| `npm run db:seed` | Seed database via API workspace |

### Per-app scripts

```bash
# API (port 3001)
npm run dev --workspace=apps/api

# Diner (port 5173)
npm run dev --workspace=apps/diner

# Restaurant (port 5175)
npm run dev --workspace=apps/restaurant

# Landing
npm run dev --workspace=apps/landing
```

### Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

Put the signing secret in `STRIPE_WEBHOOK_SECRET` in `.env`.

---

## User flows

### Restaurant owner

1. Sign up on the **landing** app (`/signup`).
2. Complete **onboarding**: business info → tables → menu → QR codes → **Stripe Connect** bank account.
3. Use the **dashboard** to view and update orders, edit the menu, and manage settings.

Step-by-step QA script: [`TEST_SCRIPT.md`](TEST_SCRIPT.md).

### Diner (guest)

1. **Scan** a table QR code (or pick a test table in dev).
2. Confirm the table → browse the **menu** → add items to the **cart**.
3. **Checkout** and pay with a card (Stripe Payment Element).
4. View the **confirmation** screen.

Sign-in is optional; it enables saving a card for faster checkout. See [`apps/diner/TEST_CREDENTIALS.md`](apps/diner/TEST_CREDENTIALS.md) for test accounts.

---

## Payments

Drift uses **Stripe Connect Express** for restaurant payouts and **destination charges** for table checkout. QR ordering is a separate diner route group (`apps/diner/src/qr`) that calls the same payment endpoint.

- **Restaurant onboarding** — The app collects the business name and email, creates an Express account, and hands identity and the bank account to Stripe (embedded onboarding when `VITE_STRIPE_PUBLISHABLE_KEY` is set, otherwise a hosted Account Link). Drift does not store routing or account numbers.
- **Test merchant** — With an `sk_test_` key, onboarding offers “Use a Stripe test account”. That creates a Custom connected account with Stripe’s test fixtures so charges and payouts work without the hosted form. Live keys ignore this.
- **Table pay** — `POST /api/stripe/order/:orderId/create-payment-intent` creates a PaymentIntent with `transfer_data.destination` set to the restaurant and `application_fee_amount` set from `PLATFORM_FEE_RATE` (default 2.5%, no fixed per-order fee).
- **Payouts** — The restaurant app’s Payouts page lists the Connect balance and can pay out the available balance. `account.updated` and `payout.*` webhooks keep the database in sync.
- **Webhooks** — `POST /api/stripe/webhook` requires the raw body and `Stripe-Signature`. Events are stored by id so retries do not double-charge, double-credit, or double-pay. Handled types include `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `refund.created`, `account.updated`, and `payout.*`. A paid order becomes `paymentStatus=PAID` and, if it was still `PENDING`, `CONFIRMED` for the kitchen. It is not marked completed just because the card succeeded.

### Run the money flow locally

1. Copy `.env.example` to `.env`. Set `DATABASE_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY=sk_test_...`, and `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...`. Leave live keys unset.
2. In the Stripe Dashboard (test mode):
   - **Settings → Connect**: enable Express. Also enable **Custom** if you want the one-click test merchant or `npm run test:payments`.
   - **Settings → Connect → Branding / integration**: embedded onboarding components, if you want the in-app Stripe form. Hosted Account Links work without them.
3. Create the database and seed the demo kitchen, menu, and table 1:

   ```bash
   cd apps/api
   npm run db:push
   npm run db:seed
   ```

   With a real `sk_test_` key, seed also provisions a chargeable test merchant (`SEED_STRIPE_CONNECT=0` skips that). Seed prints the table URL.
4. Start the API, diner, and restaurant app (`npm run dev` from the repo root).
5. Forward webhooks:

   ```bash
   stripe login
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```

   Put the CLI’s `whsec_...` signing secret in `STRIPE_WEBHOOK_SECRET` and restart the API. Subscribe at least to `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `refund.created`, `account.updated`, `payout.paid`, `payout.failed`, and `payout.created`.
6. Restaurant: open the onboarding payment step (`/onboarding?restaurantId=RESTAURANT_ID&step=bank`) and continue with Stripe, or use the test-account button. Then open **Payouts**.
7. Diner: open the seeded table URL (or scan the table QR). Add an item, pay with `4242 4242 4242 4242`, any future expiry, any CVC. The order shows up on the restaurant board as confirmed once the webhook lands. Pay out the available balance from **Payouts**. Decline with `4000 0000 0000 0002`.

### Tests

```bash
npm test
```

Checkout, webhook signature/idempotency, refunds, failed payments, and payouts run against Postgres with Stripe stubbed. They do not call Stripe.

```bash
RUN_STRIPE_E2E=1 npm run test:payments
```

That reruns the API tests and the live test-mode flow: onboard a restaurant, confirm a PaymentIntent with `pm_card_visa`, deliver the signed webhook, pay out when the balance is available, then refund. It refuses to run unless `STRIPE_SECRET_KEY` is a real `sk_test_` key.

End-to-end architecture: [`docs/PAYMENT_SYSTEM_OUTLINE.md`](docs/PAYMENT_SYSTEM_OUTLINE.md). Shorter overview: [`docs/HOW_PAYMENTS_WORK.md`](docs/HOW_PAYMENTS_WORK.md). Dashboard checklist: [`docs/PAYMENT_TEST_GUIDE.md`](docs/PAYMENT_TEST_GUIDE.md).

---

## Testing

```bash
# Unit tests (API + restaurant)
npm test

# Manual checklist + quick API checks
npm run test:output

# Restaurant flow (register → menu → orders)
npm run test:restaurant
```

More detail: [`docs/TESTING.md`](docs/TESTING.md) and [`docs/PAYMENT_TEST_GUIDE.md`](docs/PAYMENT_TEST_GUIDE.md).

---

## Documentation

| Doc | Topic |
|-----|--------|
| [`docs/PAYMENT_SYSTEM_OUTLINE.md`](docs/PAYMENT_SYSTEM_OUTLINE.md) | Payment architecture (Stripe, flows, webhooks) |
| [`docs/PAYMENT_TEST_GUIDE.md`](docs/PAYMENT_TEST_GUIDE.md) | Local payment and Connect testing |
| [`docs/HOW_PAYMENTS_WORK.md`](docs/HOW_PAYMENTS_WORK.md) | Short payment overview |
| [`TEST_SCRIPT.md`](TEST_SCRIPT.md) | Full restaurant + diner QA script |
| [`docs/OVERHAUL.md`](docs/OVERHAUL.md) | Monorepo cleanup and roadmap |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Security practices |
| [`supabase/README.md`](supabase/README.md) | Diner Supabase setup |
| [`apps/restaurant/TEST_ONBOARDING.md`](apps/restaurant/TEST_ONBOARDING.md) | Restaurant onboarding tests |

---

## Production notes

- Set `DATABASE_URL`, `JWT_SECRET`, and Stripe keys in your host’s environment (Render, Vercel, etc.). **Never commit `.env`.**
- Use `pk_live_...` only over HTTPS.
- Run API migrations: `npm run db:migrate -w apps/api` (or your host’s deploy hook).
- Point `VITE_API_URL`, `RESTAURANT_URL`, `DINER_URL`, and `LANDING_URL` at your deployed URLs.
- Configure Stripe webhooks to your production API URL (`/api/stripe/webhook`).

---

## Repository

**GitHub:** [github.com/jeromejjb/drift-pos](https://github.com/jeromejjb/drift-pos)

Questions or issues? Open a GitHub issue on that repository.
