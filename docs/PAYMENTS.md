# Payments Layer (Demo Guide)

How payments work in Drift and what the demo shows.

## Overview

Drift uses **Stripe Connect** so restaurants receive payouts directly. When a diner pays, funds go to the restaurant's connected Stripe account; Drift takes a platform fee.

**Easy setup for everyone:**
- **Restaurants** — Set up a payment account in minutes during onboarding. One Bank Account step connects your business to receive diner payments.
- **Diners** — Add a card to pay at the table via QR. Person-to-person (P2P) send/withdraw is not available with Stripe and is currently disabled on the platform.

## Payment Flows

### 1. Restaurant onboarding (Bank Account)

During onboarding, restaurants connect a **Stripe Connected Account** via the Bank Account step:

- **Endpoint:** `POST /api/stripe/create-account`
- **Data collected:** Business name, email, full name, DOB, SSN last 4, bank account (routing + account number)
- **Result:** Restaurant gets `stripeAccount` (Stripe account ID) stored in the database
- **Test values:** SSN `0000`, routing `110000000`, account `000123456789` (see `apps/restaurant/TEST_ONBOARDING.md`)

Until this step is complete, the restaurant **cannot accept card payments** from diners.

### Diner checkout (Order payment)

When a diner pays at the table (via QR → menu → checkout):

- **Order creation:** `POST /api/orders` — creates the order
- **Payment intent:** `POST /api/stripe/order/:orderId/create-payment-intent` — creates a Stripe PaymentIntent
- **Requirement:** Restaurant must have `stripeAccount` set; otherwise returns `RESTAURANT_NO_STRIPE`
- **Flow:** PaymentIntent uses `transfer_data.destination` to send funds to the restaurant; Drift takes an `application_fee_amount` (platform fee)

## Demo Restaurant

The **demo account** (`demo@driftpos.com`) is seeded **without** a Stripe account. This means:

| What works | What doesn't |
|------------|--------------|
| Dashboard, Orders, Quick Order, Tables, Menu | Diner card payments (QR checkout) |
| Order status updates, order sounds | Payment processing |

To demo **full payments**:

1. Sign in as demo
2. Go to **Settings → Billing** (or re-run onboarding)
3. Complete the **Bank Account** step with Stripe test values
4. Generate QR codes on **Tables**
5. Scan a table QR (diner app) → order → pay with test card `4242 4242 4242 4242`

## Stripe Test Mode

When `STRIPE_SECRET_KEY` starts with `sk_test_`, all operations use Stripe test mode:

- No real money moves
- Test cards: `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (decline)
- Test bank: routing `110000000`, account `000123456789`

## API Endpoints Summary (Stripe)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/stripe/create-account` | Create Connected Account (onboarding) |
| `POST /api/stripe/connect` | Create account + embedded onboarding session |
| `POST /api/stripe/order/:orderId/create-payment-intent` | Create PaymentIntent for diner checkout |
| `POST /api/stripe/payment` | Generic payment (amount + destination, platform fee to Drift) |
| `POST /api/stripe/webhook` | Stripe webhooks (payment confirmation, etc.) |

## Platform Fee

Drift charges a percentage of each transaction (see `apps/api/src/lib/rates.ts`). The fee is taken as `application_fee_amount` on the PaymentIntent and stays with the platform; the rest is transferred to the restaurant.
