# Payments Layer (Demo Guide)

How payments work in Drift and what the demo shows.

## Overview

Drift uses **Stripe Connect** so restaurants receive payouts directly. When a diner pays, funds go to the restaurant's connected Stripe account; Drift takes a platform fee.

**Easy setup for everyone:**
- **Restaurants** — Set up a payment account in minutes during onboarding. One Bank Account step connects your business to receive diner payments.
- **Diners** — Add a card to pay at the table via QR. Person-to-person (P2P) send/withdraw is not available with Stripe and is currently disabled on the platform.

## Payment Flows

### 1. Restaurant onboarding (Bank Account)

During onboarding, restaurants connect a **Stripe Express account**. Drift asks for the business name and email, then Stripe collects identity and the bank account (embedded onboarding, or a hosted Account Link if the publishable key is not set).

- **Endpoint:** `POST /api/stripe/create-account` (restaurant JWT required)
- **Saved immediately:** `stripeAccount` on the restaurant row, before the response returns
- **Test mode shortcut:** send `completeInTestMode: true` (or use the button in the onboarding step) to provision a Custom account with Stripe's test fixtures. Live keys reject this. Test bank: routing `110000000`, account `000123456789`

Until charges are enabled, the restaurant **cannot accept card payments** from diners.

### Diner checkout (Order payment)

When a diner pays at the table (via QR → menu → checkout):

- **Order creation:** `POST /api/orders` — creates the order
- **Payment intent:** `POST /api/stripe/order/:orderId/create-payment-intent` — creates a Stripe PaymentIntent
- **Requirement:** Restaurant must have `stripeAccount` set; otherwise returns `RESTAURANT_NO_STRIPE`
- **Flow:** PaymentIntent uses `transfer_data.destination` to send funds to the restaurant; Drift takes an `application_fee_amount` (platform fee)

## Demo Restaurant

The **demo account** (`demo@driftpos.com`) is seeded **with** a Stripe test merchant when `STRIPE_SECRET_KEY` is a real `sk_test_` key and Custom accounts are enabled. Otherwise it is seeded without one. That means:

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

## How a charge is structured

Table checkout is a **direct charge** on the restaurant’s connected account. Stripe bills that account for card processing. Drift’s only take is `application_fee_amount`, which is the configured margin. The platform does not pay the 2.9% + 30¢, so a transaction cannot lose money.

Destination charges were the previous shape. On those, the platform pays Stripe’s processing fee and also keeps the application fee. A 2.5% application fee on a $40 order is $1.00, while Stripe’s fee is $1.46, so Drift lost about $0.46 per order.

Direct charges fit Express Connect: the restaurant is the merchant of record (statement descriptor, disputes, and Stripe fees sit on their account), and the diner’s Payment Element is initialized with that connected account id.

Margin is one setting:

- `PLATFORM_FEE_RATE` (default **0.015**)
- `PLATFORM_VOLUME_FEE_RATE` after `PLATFORM_VOLUME_THRESHOLD` paid dollars in the month (default **0.01** / **50000**)
- `restaurant.platformFeeRate` overrides the schedule for that restaurant
- `STRIPE_PROCESSING_RATE` and `STRIPE_PROCESSING_FIXED_CENTS` are the estimate of what the connected account pays Stripe (default **0.029** and **30**). They are not added on top of Drift’s fee.

Order amounts are recomputed on the server from menu prices. The client’s price and total are ignored. Tax is `restaurant.taxRate`. Tip is a percent of the pre-tax subtotal.

A paid order stays in kitchen status `PENDING` (the New column) with `paymentStatus=PAID`. Staff move it to completed. Unpaid QR orders stay off that board.

### $40 order

Guest pays **$40.00**. Drift’s margin is 1.5%. Stripe’s card fee, paid by the restaurant, is 2.9% + 30¢.

| Line | Amount |
|------|--------|
| Amount charged | $40.00 |
| Stripe processing (restaurant pays) | $1.46 |
| Drift application fee (1.5%) | $0.60 |
| Restaurant nets | $37.94 |
| Drift nets | $0.60 |

The old destination-charge math on the same order: Drift kept $1.00 (2.5%) and paid Stripe $1.46, net **−$0.46**.

Webhook forwarding for direct charges must include connected-account events:

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook --forward-connect-to localhost:3001/api/stripe/webhook
```
