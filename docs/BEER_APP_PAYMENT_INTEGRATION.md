# Beer App × Drift Payment Integration

**Document for CTO review**  
*Reusing Drift P2P infrastructure to enable in-app payments and "$" in comments*

---

## Executive Summary

Drift’s existing payment stack (Supabase auth, Stripe Connect, P2P API) can power payments inside the beer logging app. Users can:

1. **Send money to each other** (P2P)
2. **Trigger payments from "$" in comments** (e.g., “$5” → “Send $5” button)
3. **Pay at venues** (if they use Drift) via QR checkout

No new payment infrastructure is required; the beer app becomes another client of the Drift API.

---

## Current Drift Infrastructure

| Component | Purpose |
|-----------|---------|
| **Supabase Auth** | User identity, JWT tokens |
| **Stripe Connect** | Payment processing, P2P transfers |
| **P2P API** | `POST /api/p2p/create-intent` — create PaymentIntent, recipient by email |
| **Restaurant flow** | QR scan → menu → cart → checkout (Stripe destination charges) |

**Auth flow:** Email/password or magic link → Supabase JWT → `Authorization: Bearer <token>` on API calls.

---

## Proposed Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│   Beer Logging App  │     │   Drift Diner App   │
│   (React/Next/etc) │     │   (existing)        │
└─────────┬───────────┘     └─────────┬───────────┘
          │                           │
          │   Supabase Auth (shared)  │
          │   Same project, same users
          │                           │
          └───────────┬───────────────┘
                      │
                      ▼
          ┌───────────────────────┐
          │   Drift API           │
          │   apps/api             │
          │   - P2P routes         │
          │   - Stripe webhooks    │
          └───────────────────────┘
```

**Shared identity:** Beer app and Drift use the same Supabase project. A user who signs up in one app can use payments in both.

---

## Feature 1: P2P Send Money

**Flow:** User A sends $X to User B.

| Step | Action |
|------|--------|
| 1 | User A signs in (Supabase) |
| 2 | User A enters amount + recipient (email or in-app lookup) |
| 3 | Beer app calls `POST /api/p2p/create-intent` with `Authorization: Bearer <supabase_token>` |
| 4 | API returns Stripe `clientSecret` |
| 5 | Beer app shows Stripe PaymentElement (or redirects to Drift Pay page) |
| 6 | User completes payment → webhook creates P2PTransfer record |

**API contract:**

```
POST /api/p2p/create-intent
Authorization: Bearer <supabase_access_token>
Content-Type: application/json

{
  "recipientEmail": "user@example.com",   // OR "recipientId": "<supabase_uuid>"
  "amount": 5.00,
  "note": "Beer on me!"
}

Response: { "clientSecret": "pi_xxx_secret_xxx" }
```

**Recipient lookup:** Use `recipientEmail` (email) or `recipientId` (Supabase Auth user ID, same project). If both are present, `recipientId` takes precedence. Partner apps can use `recipientId` without storing email.

---

## Feature 2: "$" in Comments → Payment

**Concept:** Parse comments for amounts like `$5` or `$10.50` and render them as clickable “Send $X” actions.

**Example:**

- User A posts a beer review.
- User B comments: `Nice find! $5` or `I’ll buy you one 🍺 $5`.
- Beer app parses `$5` and renders a “Send $5” button.
- On click: open payment flow → sender = User B, recipient = User A, amount = $5.

**Parsing logic:**

```javascript
// Regex: $5, $10.50, $1.00
const amountMatch = commentText.match(/\$(\d+(?:\.\d{2})?)/);
if (amountMatch) {
  const amount = parseFloat(amountMatch[1]);
  // Render <SendMoneyButton amount={amount} recipient={commentAuthor} />
}
```

**Recipient rules (configurable):**

- Comment on a post → recipient = post author
- Reply to comment → recipient = parent comment author
- Or: recipient = user who wrote the comment containing “$” (e.g., “Buy me a beer $5”)

**UX options:**

1. **Inline modal:** Click “Send $5” → modal with Stripe PaymentElement
2. **Redirect:** Click → redirect to Drift Pay page with `?amount=5&recipient=user@email.com`
3. **Embedded component:** Reusable Drift payment component imported into beer app

---

## Feature 3: Pay for Things (Merchant Payments)

**Flow:** User pays a merchant for goods/services. Call `POST /api/p2p/merchant-payment` with `amount`, `destination` (merchant's acct_xxx), optional `metadata`. Returns `clientSecret` for Stripe PaymentElement. Merchants need Stripe Connect; use Drift's onboarding.

---

## Feature 4: Pay at Venues (Optional)

If “buy beers” means paying at a bar/restaurant:

- Use existing Drift restaurant flow: QR at table → menu → cart → checkout.
- Beer app can link to venue’s Drift URL or QR (e.g., “Pay at this bar”).
- No new backend work; same flow as Drift diner.

---

## Implementation Phases

### Phase 1: Auth + Basic P2P (1–2 weeks)

1. **Beer app auth:** Use same Supabase project as Drift (email/password or magic link).
2. **User model:** Ensure each user has `email` (from Supabase or profile).
3. **P2P integration:** Call `POST /api/p2p/create-intent` with Supabase token.
4. **Payment UI:** Use Stripe PaymentElement with `clientSecret`, or redirect to Drift Pay page.

**Deliverable:** Users can send money to each other from the beer app.

---

### Phase 1b: Pay for Things (Merchant Payments)

1. **Merchant onboarding:** Use Drift's Stripe Connect flow to onboard venues/merchants. Store `acct_xxx` per merchant.
2. **Payment flow:** Call `POST /api/p2p/merchant-payment` with amount, destination (merchant's acct_xxx), optional metadata.
3. **Payment UI:** Use Stripe PaymentElement with returned `clientSecret`.

**Deliverable:** Users can pay merchants for goods/services from the beer app.

---

### Phase 2: "$" in Comments (1 week)

1. **Comment parser:** Detect `$X` / `$X.XX` in comment text.
2. **UI component:** Render “Send $X” button or chip.
3. **Recipient resolution:** Map to post/comment author and their email.
4. **Payment flow:** Reuse Phase 1 flow (modal or redirect).

**Deliverable:** “$5” in a comment becomes a clickable “Send $5” action.

---

### Phase 3: Polish (optional)

- Reusable payment component/SDK for other apps
- Venue links (“Pay at this bar”)
- Notifications when someone sends you money

---

## Integration Setup (Drift Side)

Drift is ready for integration. Configure the following:

### 1. CORS — Allow beer app origin

Add the beer app's origin(s) to the Drift API env:

```bash
# In Drift API .env (or Render/host env)
CORS_EXTRA_ORIGINS=https://beerapp.com,https://app.beerapp.com
```

Comma-separated list. Restart API after change.

### 2. Integration info endpoint

```
GET /api/integration/p2p
```

Returns API version, endpoints, auth requirements, and redirect URL format. No auth required.

### 3. Redirect flow — Pay page with pre-filled params

When redirecting users to Drift for payment:

```
{DINER_URL}/pay?amount=5&recipient=user@example.com
```

- `amount` — number (min 0.5)
- `recipient` — recipient email (for email-based lookup)
- `recipient_id` — Supabase Auth user ID (UUID, same project). Partner apps can pass `recipient_id` instead of `recipient` so they don't need to collect or pass email.
- `return_to` — optional; full URL of the page the user came from (e.g. Taproom feed). After payment (success or cancel), user is redirected or linked back to this URL.

The Pay page will pre-fill the form and clear the params from the URL. User signs in (if needed) and completes payment. When `return_to` is present, a "Back to Taproom" link is shown and Stripe's return URL includes it so the user returns after checkout.

**Examples:**
- Email: `https://app.driftpos.com/pay?amount=5&recipient=friend@example.com`
- User ID (partner apps): `https://app.driftpos.com/pay?amount=5&recipient_id=550e8400-e29b-41d4-a716-446655440000&return_to=...`

---

## Technical Requirements

| Requirement | Details |
|-------------|---------|
| **Supabase** | Same project as Drift; beer app uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| **Stripe** | Shared Stripe account; P2P uses existing Connect setup |
| **API base URL** | Beer app needs `DRIFT_API_URL` (e.g., `https://api.driftpos.com`) |
| **Diner URL** | For redirect flow: `DINER_URL` (e.g., `https://app.driftpos.com`) |
| **CORS** | Set `CORS_EXTRA_ORIGINS` on Drift API with beer app origin(s) |
| **User email** | Required for P2P when using `recipient` param; optional when using `recipient_id` (Supabase UUID) |

---

## Security Considerations

- **Auth:** All P2P calls require valid Supabase JWT. No API keys for end users.
- **Recipient validation:** API verifies recipient exists and is a valid User. Consider rate limits for P2P.
- **Amount limits:** Existing P2P logic can enforce min/max (e.g., min $0.50).
- **Comment parsing:** Sanitize/escape comment text before parsing to avoid XSS.

---

## API Changes (if any)

**Current P2P API:** No changes required. Beer app uses existing endpoints.

**Implemented:** `GET /api/p2p/recipient-info?recipient_id=<supabase_uuid>` — resolve recipient by Supabase Auth user ID (same project). Returns `{ email, name }`. Auth required. Partner apps can use `recipient_id` in the Pay URL instead of `recipient` (email).

**Optional future enhancements:**
- Webhook or callback for “payment completed” to update beer app state

---

## Effort Estimate

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Auth + P2P | 1–2 weeks | Supabase config, Stripe already set up |
| Phase 2: "$" in comments | ~1 week | Phase 1 complete |
| Phase 3: Polish | 1–2 weeks | Optional |

---

## Open Questions for CTO

1. **Auth strategy:** Migrate beer app to Supabase, or keep existing auth and add “Connect Drift” (link accounts)?
2. **Payment UX:** Inline Stripe modal in beer app vs. redirect to Drift Pay page?
3. **Recipient rules:** For “$5” in comments, who is the recipient — post author, comment author, or configurable?
4. **Venue integration:** Do we need “Pay at this bar” links in Phase 1, or defer?

---

## Beer App Config (Summary)

| Env var | Value |
|---------|-------|
| `VITE_SUPABASE_URL` | Same as Drift |
| `VITE_SUPABASE_ANON_KEY` | Same as Drift |
| `VITE_DRIFT_API_URL` | `https://api.driftpos.com` (or your API URL) |
| `VITE_DRIFT_PAY_URL` | `https://app.driftpos.com/pay` (for redirect flow) |
| `VITE_DRIFT_SETTINGS_URL` | `https://app.driftpos.com/settings` (payment method setup). If unset, use `{DRIFT_PAY_URL base}/settings` |
| `VITE_DRIFT_WITHDRAW_URL` | `https://app.driftpos.com/withdraw` (withdraw balance to bank) |

---

## Drift query params & URLs (for Taproom)

**Pay page:** `{DINER_URL}/pay?amount={amount}&recipient_id={uuid}|recipient={email}&return_to={encoded_url}`

| Param | Required | Description |
|-------|----------|-------------|
| `amount` | Yes | Dollar amount (e.g. 5, 10.5) |
| `recipient_id` | One of these | Supabase Auth user UUID (preferred) |
| `recipient` | One of these | Payee email |
| `return_to` | Yes (for Taproom) | Full URL to return to after payment |

**Settings URL:** `{DINER_URL}/settings` — add/change payment method, bank account for receiving.

**Withdraw URL:** `{DINER_URL}/withdraw` — withdraw balance to bank. Recipients receive into in-app balance; add bank account to withdraw.

**First-time flow:** User can sign up and add card in the same flow before completing payment (AuthGate + PaymentElement).

---

## References

- Drift P2P routes: `apps/api/src/routes/p2p.ts`
- Supabase auth: `apps/diner/src/contexts/AuthContext.tsx`
- Stripe PaymentElement usage: `apps/diner/src/pages/PayPage.tsx`
- Integration endpoint: `GET /api/integration/p2p`
