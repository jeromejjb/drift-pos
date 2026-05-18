# P2P with Moov (intended direction)

Stripe is used in Drift **only for diner → restaurant payments** (table checkout). Person-to-person (P2P) send money is intended to use **Moov**, not Stripe.

---

## What you need from Moov

Use this as a checklist. All links are from [Moov Documentation](https://docs.moov.io/).

### 1. Moov account

- **Sign up:** [dashboard.moov.io/signup](https://dashboard.moov.io/signup)
- You get **test mode** immediately (fake transfers, sample data).
- **Production** requires Moov to approve your account and onboarding docs.

### 2. API keys (server-side only)

- **Where:** Dashboard → **Developers** → **API keys**
- **Create a key:** Give it a name, then **copy the secret key once** and store it securely (e.g. env var). You cannot view the secret again.
- **Two keys:** Use one set for **test**, another for **production** (different keys per mode).
- **Permissions:** Only `admin` and `developer` roles can create/view API keys.
- **Domains:** Add any domains you’ll use (e.g. your API host) in the key’s domain list.

You’ll use the key to get a **Bearer token** (or the secret as the token) for `Authorization: Bearer {token}` on API requests. Never put the secret in the diner app or in git.

### 3. Account ID

- Transfers are scoped to an **account**: `POST /accounts/{accountID}/transfers`
- In the Dashboard, your **test account** and **production account** each have an **account ID** (e.g. UUID). You need this in your API server (e.g. `MOOV_ACCOUNT_ID`).
- For production, don’t hardcode the test account ID; switch to the production account ID and use the production API key.

### 4. Capabilities you’ll need (production)

- **Wallet / send-funds:** Typically needed for P2P and moving money. Request these in the Dashboard; Moov will run **KYC/KYB** (verification).
- **Collect-funds** (if you pull from bank/card): May require **underwriting** (e.g. processing history, bank statement). If you only send from an existing balance, you may not need this at first.

Verification status appears in the Dashboard (e.g. “Needs review”, “Pending”).

### 5. Production checklist (when you go live)

- Complete **business profile** and any docs Moov asks for.
- Set **pricing / billing** (production isn’t fully active until the fee plan is set).
- **New API key** for production (don’t reuse test key).
- **Production account ID** in your config (replace test account ID).
- **Webhook URLs** for production (if you use webhooks); test and production use different URLs.

### 6. Env vars (for your API server)

Store these only on the server (e.g. root `.env` or API env), never in the diner app:

- `MOOV_ACCOUNT_ID` — Your Moov account ID (test or production).
- `MOOV_SECRET_KEY` or `MOOV_API_SECRET` — The secret from the API key you created (used to authenticate requests).
- Optional: `MOOV_API_URL` if you need to point to a different base URL (default is `https://api.moov.io`).

You may also need a **public key** if Moov uses public+secret to issue tokens; check their [API keys](https://docs.moov.io/guides/get-started/api-keys/) and [authentication](https://docs.moov.io/api/authentication/access-tokens/) docs when you implement.

---

## Why not Stripe for P2P?

- Stripe is built for **merchant** payments (charge a card, send to a connected **business** account). It doesn’t offer a native “send $X from Alice to Bob” where both are consumers.
- Workarounds (charge to platform, track balance in DB, then pay out via Connect) work but are a poor fit: you hold funds, manage ledger and compliance, and use Connect in a way it wasn’t designed for.
- For real P2P (and clean withdraw to a user’s bank), a **money-movement** API like Moov is a better fit.

---

## Why Moov for P2P?

- **Transfer API**: Moov exposes transfers between **accounts** with clear source/destination (e.g. `moov-wallet`, `ach-debit-fund`, `ach-credit-standard`, `rtp-credit`). That maps well to “user A sends to user B” and “user withdraws to bank.”
- **Docs**: [Transfers](https://docs.moov.io/api/money-movement/transfers/), [Create transfer](https://docs.moov.io/api/money-movement/transfers/create/), [Transfer options](https://docs.moov.io/api/money-movement/transfers/options/).
- **Capabilities**: Create/list/cancel transfers, receipts, metadata. You send from an account (e.g. platform or user wallet) to another (user wallet or bank). No need to emulate P2P with card charges and an internal balance ledger the way we do with Stripe today.

---

## High-level Moov model (what you’d integrate)

- **Accounts**: Moov uses **accounts** (e.g. one per user or one platform account with sub-ledger). You’d map Drift users to Moov accounts (or use a single platform account and Moov’s transfer semantics).
- **Transfer options**: `POST /accounts/{accountID}/transfer-options` returns allowed source/destination payment method pairs (e.g. moov-wallet → moov-wallet, or ACH debit → ACH credit).
- **Create transfer**: `POST /accounts/{accountID}/transfers` with source/destination payment method IDs, amount, currency, optional description. Moov moves the money; you don’t hold a separate “balance” unless you choose to.
- **List / get transfer**: List transfers for an account, get one by ID (for activity and status).
- **Bank linking / withdraw**: Moov supports ACH and RTP. Users link a bank (or you use wallet); “withdraw” becomes a transfer to an ACH/RTP destination.

You’ll need to complete Moov’s onboarding (compliance, account structure) and use their SDK or REST API from the API server only (no secret keys in the diner app).

---

## What would change in Drift when you add Moov

1. **API**
   - **P2P send**: Replace (or branch) the current `POST /api/p2p/create-intent` Stripe PaymentIntent flow with a Moov “create transfer” call (and, if needed, a step to fund the source from card/ACH via Moov). Keep the same request shape (e.g. `recipientEmail` / `recipientId`, `amount`, `note`) so the diner doesn’t need to change contract.
   - **Balance**: Either stop showing an in-app “balance” and rely on Moov balances, or keep a small ledger in sync with Moov for display only.
   - **Withdraw**: Replace Stripe Connect withdraw with a Moov transfer (e.g. to user’s linked bank). “Add bank account” would become Moov bank linking instead of (or in addition to) Stripe Connect.
   - **Webhooks**: Stripe webhook stays for **table payments only**. Add a Moov webhook (or polling) for transfer status and use it to update P2P transfer state and any UI (e.g. “Sent”, “Completed”, “Failed”).
2. **Diner app**
   - **Pay tab**: Can stay as-is from a UX perspective (amount, recipient, note, send). Only the backend switches from Stripe to Moov; optionally show “Powered by Moov” or similar.
   - **Me / Withdraw**: If withdraw moves to Moov, “Add bank account” and “Withdraw” would call new API endpoints that talk to Moov (link bank, create withdrawal transfer).
3. **Config / env**
   - Add Moov credentials (e.g. `MOOV_ACCOUNT_ID`, `MOOV_SECRET_KEY` or equivalent) on the API only. No Moov keys in the diner app.
4. **Docs**
   - Update **PAYMENT_SYSTEM_OUTLINE.md** so the P2P and withdraw sections describe the Moov flow; keep the “Stripe = restaurant only” and “Moov = P2P” split at the top.

---

## Summary

- **Stripe** in Drift: **only** for payments from diners to restaurants (table checkout). P2P/withdraw flows over Stripe have been removed.
- **Moov**: Intended for **P2P** (send money) and **withdraw** (to user’s bank) when you decide to add true P2P again. Integrate when you’re ready; the outline and this doc describe the target and what to change.
