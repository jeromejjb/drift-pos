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
- **Tables**: 8 tables (1–8)
- **Menu**: 4 categories, 12 items (Appetizers, Mains, Drinks, Desserts)

### 2. Generate QR codes (optional)

After signing in, go to **Tables** and click **Generate QR codes** to create QR codes for the demo tables. This enables the full diner flow (scan → order → pay).

## Sign In

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
| **Orders** | `/orders/:restaurantId` | Active and past orders |
| **Menu** | `/menu/:restaurantId` | Edit categories and items |
| **Quick Order** | Dashboard → Quick Order button | Manual order entry |
| **Settings** | `/settings/:restaurantId` | Profile, restaurant details, billing |

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
