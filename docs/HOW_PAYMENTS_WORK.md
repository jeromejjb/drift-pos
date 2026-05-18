# How Drift Payments Work (Stripe Flow)

A plain-English guide for developers and users.

---

## Where does my money come from?

**Your debit or credit card.** When you send money, Drift charges your card through Stripe. You can:

1. **Add your card ahead of time** — Me → Payment method → Add debit or credit card
2. **Enter it when you send** — When you tap Send, you’ll see a secure form to enter your card

Either way, Stripe processes the payment. Drift never stores your full card number.

---

## Flow: You send $5 to a friend

1. You tap **Send** → Drift calls the API → API creates a Stripe PaymentIntent
2. Stripe returns a **client secret** to the app
3. The app shows Stripe’s secure **PaymentElement** (card form)
4. You enter your card (or use a saved one)
5. Stripe charges the card and confirms the payment
6. Drift’s webhook receives the payment → credits your friend’s balance
7. Done

---

## API must be running

The diner app talks to the Drift API. If the API isn’t running, you’ll see:

> Can't connect to the server. If you're testing locally, run: npm run dev:pay (from the repo root) to start the API and diner together.

**To run locally:**

```bash
npm run dev:pay
```

Or separately:

```bash
# Terminal 1
npm run dev --workspace=apps/api

# Terminal 2
npm run dev --workspace=apps/diner
```

Ensure `VITE_API_URL` in `apps/diner/.env` points to your API (e.g. `http://localhost:3001`).

---

## Stripe’s role

| Step | What happens |
|------|--------------|
| Create intent | API calls `stripe.paymentIntents.create()` with amount, recipient |
| Payment form | Stripe PaymentElement collects card (PCI compliant) |
| Charge | Stripe charges the card |
| Webhook | Stripe sends `payment_intent.succeeded` to Drift API |
| Credit | Drift credits recipient’s balance |

Stripe handles all card data. Drift never sees your full card number.

---

## "Invalid or expired session"

This means the Supabase JWT failed. Fixes:

1. **Same project** — API and diner must use the same Supabase project. In `.env`:
   - `SUPABASE_URL` and `VITE_SUPABASE_URL` = same value
   - `SUPABASE_ANON_KEY` and `VITE_SUPABASE_ANON_KEY` = same value (anon public key from Dashboard → Settings → API)

2. **System time** — JWT expiry uses server time. If your clock is wrong, sync it (e.g. time.is).

3. **Sign in again** — Click "Sign in again" when shown. The app will refresh your session.

---

## Quick reference

| I want to… | Do this |
|------------|---------|
| Add my card before sending | Me → Payment method → Add debit or credit card |
| Send money | Pay → amount + recipient → Send → enter card when prompted |
| Receive money | Recipients get balance credited automatically. Add bank account (Me) to withdraw. |
| Run locally | `npm run dev:pay` from repo root |
