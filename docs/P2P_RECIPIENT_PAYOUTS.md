# P2P Recipient Payouts — Users Can Receive & Use Funds

Recipients can now receive money to their bank account via Stripe Connect. Funds are transferred automatically when a P2P payment succeeds.

---

## How It Works

1. **Recipient adds bank account** — Me → "Add bank account" → Stripe Connect onboarding (bank + identity)
2. **Sender sends money** — Pay → amount + recipient email → card payment
3. **Webhook** — On `payment_intent.succeeded`, platform transfers funds to recipient's Connect account
4. **Payout to bank** — Stripe pays out to recipient's bank (typically 2–3 business days; Instant Payouts to debit card if enabled)

---

## Implementation Summary

| Component | Change |
|-----------|--------|
| **User model** | Added `stripeAccountId` (Stripe Connect account for receiving) |
| **POST /api/p2p/onboard** | Creates Express account, returns `accountLinks` URL for redirect |
| **GET /api/p2p/has-payout-account** | Check if user has completed onboarding |
| **create-intent** | Requires recipient to have `stripeAccountId` |
| **Webhook** | `account.updated` → save `stripeAccountId` when `payouts_enabled` |
| **Webhook** | `payment_intent.succeeded` (P2P) → `stripe.transfers.create` to recipient |
| **Me page** | "Add bank account" button to start onboarding |

---

## User Flow

1. **First time receiving:** User goes to Me → Add bank account → redirected to Stripe → adds bank + identity → returns to Me. "Bank account ✓ Connected" appears.
2. **Someone sends:** Sender pays. Platform transfers to recipient's Connect account. Stripe pays out to their bank.
3. **Timing:** Standard payout: 2–3 business days. Instant Payouts (if recipient adds debit card): ~30 minutes.

---

## Deploy Checklist

1. **Run migration:** `npx prisma migrate deploy` (or `prisma migrate dev` locally)
2. **Stripe Connect:** Ensure platform profile is complete in Stripe Dashboard
3. **Webhook:** `account.updated` is sent automatically; no extra config needed
4. **Test:** Create recipient, add bank (test mode), send P2P, verify transfer in Stripe Dashboard

---

## Instant Payouts (Optional)

Recipients can enable Instant Payouts in their Stripe Express Dashboard if they add a debit card. Funds then arrive in ~30 minutes instead of 2–3 days.
