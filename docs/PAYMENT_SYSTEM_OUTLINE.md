# How the Drift Payment System Should Work

A single reference for architecture, flows, and setup.

---

## 0. Stripe vs P2P (Moov)

| Use case | Provider | Notes |
|----------|----------|--------|
| **Diner → restaurant** (table checkout) | **Stripe** | Card charge with `transfer_data` to restaurant’s Connect account. Stripe is the right fit. |
| **P2P** (Pay tab: send money to another person) | **Moov** (intended) | Stripe is not built for true P2P; Moov’s transfer API (wallet, ACH, RTP) is a better fit. Current code uses Stripe + in-app balance as an **interim** solution. |
| **Add card** (for table pay) | **Stripe** | SetupIntent + Customer for saved card on checkout. |
| **Withdraw** (balance → bank) | **Stripe today**; **Moov** when P2P moves | Today: Stripe Connect. With Moov P2P, withdraw can be Moov-driven (e.g. ACH credit to user’s bank). |

See **docs/MOOV_P2P.md** for why Moov for P2P and what integration would look like.

---

## 1. System overview

| Piece | Role |
|-------|------|
| **Diner app** (Vite, React) | User sends money (P2P), pays at table, views balance, adds card, withdraws. Calls API with Supabase JWT. |
| **API** (Express, Node) | Auth (Supabase + JWT). **Stripe**: table PaymentIntents, SetupIntent (card), Connect for current withdraw. **P2P (interim)**: Stripe PaymentIntent + DB balance; **target**: Moov. |
| **Stripe** | **Restaurant payments only**: card charges, Connect (restaurant + current withdraw), webhooks. Not the long-term P2P provider. |
| **Moov** (future) | P2P transfers (wallet, ACH, RTP), accounts, transfer options. See MOOV_P2P.md. |
| **Supabase** | Auth (sign in / sign up). API and diner must use the **same** Supabase project. |

**Today:** Table pay = Stripe. P2P = Stripe (platform charge) + DB balance + Stripe Connect withdraw. **Target:** Table pay = Stripe; P2P = Moov; withdraw = Moov (or Stripe until Moov is live).

---

## 2. P2P send (Pay tab: “Send money”)

**Current (interim):** Stripe PaymentIntent + DB balance. **Target:** Moov transfers. See MOOV_P2P.md.

### 2.1 Two paths (current Stripe-based implementation)

- **Path A — Sender has enough balance**  
  API only updates the DB: decrement sender `balanceCents`, increment recipient `balanceCents`, create `P2PTransfer`. No Stripe call. Returns `{ usedBalance: true }`.

- **Path B — Sender needs to fund with card**  
  API creates a Stripe **PaymentIntent** (no `transfer_data`; money goes to **platform** Stripe account). Metadata: `p2p: '1'`, `senderId`, `recipientId`, `amountCents`. Returns `clientSecret`. Diner shows Stripe PaymentElement; user pays. Stripe sends `payment_intent.succeeded` webhook; API credits **recipient’s** balance and records `P2PTransfer`.

### 2.2 Steps (Path B)

1. Diner: user enters amount + recipient (email or `recipient_id`), taps Send.
2. Diner: `POST /api/p2p/create-intent` with `Authorization: Bearer <supabase_access_token>`.
3. API: resolve recipient (by email or Supabase UUID), check not self, compute `totalCents`. If sender balance ≥ totalCents → Path A (DB-only), return. Else:
4. API: `stripe.paymentIntents.create({ amount, currency: 'usd', metadata: { p2p, senderId, recipientId, amountCents } })`, return `clientSecret`.
5. Diner: mounts Stripe `<Elements>` with `clientSecret`, shows `<PaymentElement>`, user confirms.
6. Stripe: charges card, sends webhook `payment_intent.succeeded` to API.
7. API (webhook): if `metadata.p2p === '1'`, create `P2PTransfer` and `user.balanceCents += amountCents` for recipient.
8. Diner: redirect or success state; can show “Sent $X to Y”.

### 2.3 Important details

- **Recipient must exist** in Drift (signed up, same Supabase project). Otherwise `RECIPIENT_NOT_FOUND`.
- **Balance is in our DB** (`User.balanceCents`), not in Stripe. Stripe holds platform funds; we track who has what.
- **Card is optional to save**: if `stripeCustomerId` exists, API attaches `customer` and `setup_future_usage: 'off_session'` so Stripe can reuse the card.

---

## 3. Dine / table payment (restaurant checkout)

Different from P2P: money goes **directly to the restaurant’s Stripe Connect account**.

1. User scans table QR → menu → cart → checkout.
2. API: `POST /api/stripe/order/:orderId/create-payment-intent` (or similar) with `transfer_data: { destination: restaurant.stripeAccountId }`, optional `application_fee_amount`.
3. Diner: confirm with PaymentElement. Stripe charges and transfers to restaurant; webhook updates order (e.g. `COMPLETED`).

No balance involved here; it’s a direct charge with destination transfer.

---

## 4. Withdraw (balance → bank)

**Current:** Stripe Connect. User onboarded via `POST /api/p2p/onboard`; `stripe.transfers.create` sends balance to their Connect account; they get payout to bank in 2–3 days.

**Target (with Moov P2P):** Moov transfer to user’s linked bank (ACH/RTP). “Add bank account” would become Moov bank linking. See MOOV_P2P.md.

---

## 5. Add card (save for later)

- Diner: Me → Payment method → Add card. Calls `POST /api/diner/setup-intent` (authenticated). API creates Stripe **SetupIntent**, returns `clientSecret`. Diner shows PaymentElement in setup mode; after success, Stripe attaches PaymentMethod to Customer; API can store `stripeCustomerId` if not already.
- Later, when creating a PaymentIntent, API passes `customer: stripeCustomerId` and `setup_future_usage: 'off_session'` so the saved card can be used.

---

## 6. API endpoints (P2P / diner)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/p2p/create-intent` | Start P2P send (balance or PaymentIntent). Body: `recipientEmail` or `recipientId`, `amount`, optional `note`. |
| `GET /api/p2p/balance` | Current user balance (for Money tab). |
| `GET /api/p2p/transfers` | List sent/received P2P transfers. |
| `GET /api/p2p/recipient-info?recipient_id=<uuid>` | Resolve recipient for display. |
| `POST /api/p2p/onboard` | Start Connect onboarding (return URL for “Add bank account”). |
| `POST /api/p2p/withdraw` | Withdraw balance to connected bank account. |
| `GET /api/p2p/has-payout-account` | Whether user has completed Connect onboarding. |
| `POST /api/diner/setup-intent` | Create SetupIntent for adding a card. |
| `GET /api/diner/has-payment-method` | Whether user has a saved payment method. |
| `POST /api/stripe/webhook` | Stripe webhooks (raw body); handles `payment_intent.succeeded`, `account.updated`. |

All P2P/diner routes (except webhook) use **Supabase JWT** in `Authorization: Bearer <token>`.

---

## 7. Local development

### 7.1 Run stack

From repo root:

```bash
npm run dev:pay
```

This starts **API** (e.g. port 3001) and **diner** (e.g. 5173). If port 3001 is in use, free it first (e.g. `lsof -i :3001 -t | xargs kill`).

### 7.2 Environment

**API** (root `.env` or `apps/api/.env`):

- `DATABASE_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY` (use `sk_test_...` locally)
- `STRIPE_WEBHOOK_SECRET` (for webhook; use Stripe CLI to forward: `stripe listen --forward-to localhost:3001/api/stripe/webhook`)

**Diner** (`apps/diner/.env`, copy from `.env.example`):

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — same Supabase project as API
- `VITE_API_URL=http://localhost:3001`
- `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...` — use **test** key on HTTP; `pk_live_` requires HTTPS

### 7.3 CORS and rate limiting

- API allows `http://localhost:5173`, `5174`, `5175` (and production origins). CORS runs **before** rate limiter so 429 responses still have CORS headers.
- In dev, global API limit is higher (e.g. 500/15 min) so the diner doesn’t hit 429 during normal use.

---

## 8. Production

- Diner and API on **HTTPS**. Use `pk_live_` and `sk_live_` only in production.
- Stripe webhook URL: `https://your-api.com/api/stripe/webhook`; set `STRIPE_WEBHOOK_SECRET` from Dashboard.
- Same Supabase project for API and diner; env vars point to production API URL and Supabase.

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|--------|----------------|-----|
| “Couldn’t reach the payment server” | Diner can’t reach API | Start API; set `VITE_API_URL`; ensure no firewall/proxy blocking. |
| CORS / 429 with “Access-Control-Allow-Origin missing” | Rate limit hit and CORS not applied to 429 | CORS middleware must run before rate limiter (already fixed in code). Restart API. |
| “Invalid or expired session” | Supabase JWT invalid or wrong project | Same Supabase project for API and diner; correct anon key; sign in again. |
| “Recipient not found” | Recipient not in DB (hasn’t signed up) | Recipient must sign up in same Drift/Supabase project first. |
| Stripe “live over HTTP” warning | Using `pk_live_` on localhost | Use `pk_test_...` in `apps/diner/.env` for local dev. |
| Webhook not crediting balance | Webhook not received or wrong secret | Use Stripe CLI to forward; set `STRIPE_WEBHOOK_SECRET`; check API logs for webhook errors. |

---

## 10. Flow summary

- **Stripe (restaurant only):** Table pay = PaymentIntent with `transfer_data` to restaurant. Add card = SetupIntent for table checkout.
- **P2P (current):** Balance sufficient → DB-only. Else → Stripe PaymentIntent (platform) → webhook → credit recipient balance. **Target:** Moov transfers.
- **Withdraw (current):** Balance → `stripe.transfers.create` to user’s Connect account → bank. **Target:** Moov transfer to user’s bank.

This is how the system is designed today; P2P and withdraw are intended to move to Moov.
