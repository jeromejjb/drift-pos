# Taproom → Drift Integration Prompt

Copy and paste the prompt below when working on the Taproom codebase (e.g., into Cursor, ChatGPT, or Claude):

---

## Prompt

```
Integrate Drift P2P payments into Taproom. Users send money via "Send $X" in comments and the Beer money tab. Drift handles all payment UI — Taproom only redirects and displays balance.

### 1. Environment variables

Add to .env and .env.example:

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_DRIFT_PAY_URL=https://app.driftpos.com/pay
NEXT_PUBLIC_DRIFT_SETTINGS_URL=https://app.driftpos.com/settings
NEXT_PUBLIC_DRIFT_WITHDRAW_URL=https://app.driftpos.com/withdraw
NEXT_PUBLIC_DRIFT_API_URL=https://api.driftpos.com

Use the same Supabase project as Drift. Get credentials from Drift or Supabase Dashboard.

### 2. CORS

Ask Drift to add Taproom's origin to CORS_EXTRA_ORIGINS so the balance API works from the browser.

### 3. SendMoneyButton

Props: amount (number), recipientId? (Supabase UUID), recipientEmail? (fallback)

On click, redirect to:
  {NEXT_PUBLIC_DRIFT_PAY_URL}?amount={amount}&recipient_id={uuid}&return_to={encodeURIComponent(currentUrl)}
  Or use recipient={email} if no recipientId.

Prefer recipientId. Recipient = post author (comments) or parent comment author (replies).

### 4. Parse "$" in comments

Detect $5 / $10.50 with: /\$(\d+(?:\.\d{2})?)/g
Replace with SendMoneyButton. Sanitize before parsing (XSS).

### 5. Beer money tab

- Balance: GET {NEXT_PUBLIC_DRIFT_API_URL}/api/p2p/balance with Authorization: Bearer {supabase_token}. Show "Your balance: $X.XX"
- Send: "Send $X" buttons → SendMoneyButton
- Settings: Link to NEXT_PUBLIC_DRIFT_SETTINGS_URL (add card, bank account)
- Withdraw: Link to NEXT_PUBLIC_DRIFT_WITHDRAW_URL (move balance to bank)

### 6. Edit Profile

Add link to NEXT_PUBLIC_DRIFT_SETTINGS_URL for payment method setup.

### 7. User model

Store supabase_user_id (auth.user.id) on User for recipient resolution.

### Constraints

No Stripe or card entry in Taproom. return_to = full current URL (encoded). Recipients receive into balance immediately; add bank account in Drift to withdraw.

### Deliverables

- SendMoneyButton component
- Beer money tab with balance, send, settings, withdraw
- Comment $ parser with SendMoneyButton
- .env.example with all env vars
```
