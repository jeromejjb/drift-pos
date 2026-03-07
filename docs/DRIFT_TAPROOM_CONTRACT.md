# Drift ↔ Taproom Contract

What Drift provides for Taproom integration.

---

## 1. Pay page ✅

**URL:** `https://app.driftpos.com/pay` (or your `NEXT_PUBLIC_DRIFT_PAY_URL`)

**Query params:**
| Param | Required | Description |
|-------|----------|-------------|
| `amount` | Yes | Dollar amount (e.g. 5, 10.5) |
| `recipient_id` | One of these | Supabase Auth user UUID (same project) |
| `recipient` | One of these | Recipient email |
| `return_to` | Yes | Full URL to redirect to after payment (encoded) |

**Behavior:** User pays on Drift, then Drift redirects back to `return_to`.

---

## 2. Settings URL ✅

**URL:** `https://app.driftpos.com/settings` (or `{DRIFT_PAY_URL origin}/settings`)

**Purpose:** Add/change card or payment method. Taproom links here from Edit Profile and Beer money tab.

---

## 3. Recipient balance ✅

When someone is paid (e.g. "$5 @them"), the receiver's Drift balance is credited immediately.

Users who have never added a payment method can still receive and see a balance. No bank setup required to receive.

---

## 4. Withdraw URL ✅

**URL:** `https://app.driftpos.com/withdraw` (or `{DRIFT_PAY_URL origin}/withdraw`)

**Purpose:** Page where users move balance to bank. Taproom links here from the Beer money tab.

*Note: Currently supports bank only. Apple Wallet / Venmo not yet supported.*

---

## 5. Balance API + CORS ✅

**Endpoint:** `GET {DRIFT_API_URL}/api/p2p/balance`

**Auth:** `Authorization: Bearer {supabase_access_token}` (Supabase JWT; same project as Drift)

**Response:**
```json
{
  "balanceCents": 1250,
  "balance": 12.50,
  "currency": "usd"
}
```

**CORS:** Drift must add Taproom's origin(s) to `CORS_EXTRA_ORIGINS` in the API `.env`:

```
CORS_EXTRA_ORIGINS=https://yourapp.com,http://localhost:3000
```

Without this, the balance API will fail from the Taproom frontend.
