# Demo Restaurant

A pre-seeded demo restaurant for showcasing the Drift platform to users.

## Demo Credentials

| Field | Value |
|-------|-------|
| **Email** | `demo@driftpos.com` |
| **Password** | `Demo123!` |

## Setup

### 1. Seed the database

From the project root:

```bash
npm run db:seed
```

Or from the API app:

```bash
cd apps/api && npx prisma db seed
```

This creates:

- **User**: Demo Owner (`demo@driftpos.com`)
- **Restaurant**: Drift Demo Kitchen (with address, phone)
- **Tables**: 9 tables (Walk-in + 1–8)
- **Menu**: 4 categories, 12 items (Appetizers, Mains, Drinks, Desserts)
- **Orders**: 7 demo orders (varied statuses: PENDING, PREPARING, READY, SERVED)

### 2. Production: ensure seed has run

The demo account must exist in your production database. Either:

- **Deploy** — The API's `preDeployCommand` runs the seed on each deploy (Render).
- **Manual** — Run against production DB:
  ```bash
  # Get Internal Database URL from Render: drift-db → Connect
  DATABASE_URL="postgresql://..." ./scripts/seed-production.sh
  ```
  Or with PROD_DATABASE_URL in root `.env`:
  ```bash
  source .env && DATABASE_URL="$PROD_DATABASE_URL" ./scripts/seed-production.sh
  ```

### 3. Generate QR codes (optional)

After signing in, go to **Tables** and click **Generate QR codes** to create QR codes for the demo tables. This enables the full diner flow (scan → order → pay).

## Sign In

**If login fails:** The seed may not have run on production yet. Trigger a redeploy of the API on Render, or run the seed manually against the production database (see step 2 above).

1. Go to the landing page: **https://driftpos.com/login** (or your landing URL)
2. Enter:
   - Email: `demo@driftpos.com`
   - Password: `Demo123!`
3. Submit → you’ll be redirected to the restaurant dashboard

## What You Can Demo

| Feature | Location | Notes |
|---------|----------|------|
| **Dashboard** | `/dashboard/:restaurantId` | Stats, recent orders, Quick Order modal |
| **Tables** | `/tables/:restaurantId` | Table list, QR code generation & PDF download |
| **Orders** | `/orders/:restaurantId` | Active and past orders, status updates |
| **Menu** | `/menu/:restaurantId` | Edit categories and items |
| **Quick Order** | Dashboard → Quick Order button | Manual order entry (Walk-in or Table 1–8) |
| **Settings** | `/settings/:restaurantId` | Profile, restaurant details, billing |

## Payments (Demo)

The demo restaurant is seeded **without** a connected Stripe account. Orders work, but **diner card payments** (QR checkout) require completing the Bank Account step first.

- **To demo full payments:** Complete onboarding Bank Account step with Stripe test values (routing `110000000`, account `000123456789`, SSN `0000`), then use diner app with test card `4242 4242 4242 4242`.
- **See:** [docs/PAYMENTS.md](./PAYMENTS.md) for full payments layer overview.

## Environment

For local development, ensure:

- **API** is running (`cd apps/api && npm run dev`)
- **Restaurant app** is running (`cd apps/restaurant && npm run dev`)
- **Landing** is running (`cd apps/landing && npm run dev`) for login
- `DATABASE_URL` is set in `apps/api/.env`

For production, run the seed against your production database before sharing the demo.

## Resetting the Demo

To re-seed (e.g. after changes):

```bash
npm run db:seed
```

The seed is idempotent: it updates the existing demo user/restaurant if present, and skips creating tables/menu if they already exist.
