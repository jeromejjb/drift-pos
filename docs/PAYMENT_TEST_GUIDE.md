# Payment Setup — Test Guide

## Quick start

### 1. Start services

From the project root:

```bash
# Option A: All apps (API + restaurant + diner)
npm run dev

# Option B: Just API + restaurant (for onboarding test)
npm run dev --workspace=apps/api &
npm run dev --workspace=apps/restaurant &
```

**Ports:**
- API: http://localhost:3001
- Restaurant: http://localhost:5175
- Diner: http://localhost:5173

### 2. Local vs production API

Your `.env` has `VITE_API_URL=https://drift-api-7vs7.onrender.com`. To test against the **local API**:

- Create `apps/restaurant/.env` with: `VITE_API_URL=http://localhost:3001`
- Create `apps/diner/.env` with: `VITE_API_URL=http://localhost:3001`
- Restart the apps after adding

If you leave the default, you'll hit the deployed API (good for testing with real DB).

---

## Test 1: Restaurant payment setup (full onboarding)

1. **Landing signup** (if you have landing running on 5174):
   - Go to http://localhost:5174/signup
   - Sign up → redirects to restaurant onboarding

2. **Or direct onboarding** (restaurant already exists):
   - Go to http://localhost:5175/onboarding?restaurantId=YOUR_RESTAURANT_ID
   - Add `&token=YOUR_JWT` if you have one

3. **Payment account step** (`step=bank`):
   - Business name, owner name, email
   - **Continue with Stripe** opens Express onboarding (Stripe collects the bank account)
   - Or, in test mode, **Use a Stripe test account** (routing `110000000`, account `000123456789`). No real money moves.

4. **Check:** The API returns an account id and the restaurant row has `stripeAccount` set before you leave the page. Then open **Payouts**.

---

## Test 2: Settings → Complete payment setup

1. Sign in to restaurant app, go to **Settings**.
2. Open **Billing** tab.
3. If no payment account: click **"Complete payment setup"**.
4. **Check:** Redirects to onboarding at the Bank step.
5. Fill the form and submit.

---

## Test 3: P2P send (diner app)

1. Go to http://localhost:5173/pay
2. Sign in (Supabase).
3. Enter amount (e.g. $5) and recipient email.
4. Add card if prompted.
5. Complete payment.

---

## Stripe test values

| Field        | Test value      |
|-------------|-----------------|
| SSN last 4  | `0000`          |
| Routing     | `110000000`     |
| Account     | `000123456789`  |
| Card        | `4242 4242 4242 4242` |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Missing address" | Fill street, city, state, ZIP on Bank step |
| API connection refused | Ensure API is running on 3001; check VITE_API_URL |
| Stripe errors | Use `sk_test_` and `pk_test_` keys |
| Webhook failures | Stripe CLI: `stripe listen --forward-to localhost:3001/api/stripe/webhook` |
