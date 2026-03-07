# Taproom → Drift Integration Prompt

Copy and paste this prompt when working on the Taproom codebase:

---

## Prompt

```
Integrate Drift P2P payments into Taproom. Users tap "Send $X" and are redirected to Drift to complete payment. No payment UI or Stripe in Taproom — only redirects and links.

### Step 1: Environment variables

Add to .env and .env.example:

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_DRIFT_PAY_URL=https://app.driftpos.com/pay
NEXT_PUBLIC_DRIFT_SETTINGS_URL=https://app.driftpos.com/settings
NEXT_PUBLIC_DRIFT_WITHDRAW_URL=https://app.driftpos.com/withdraw

Use the same Supabase project as Drift. Get credentials from Drift's .env or Supabase Dashboard → Settings → API.

If NEXT_PUBLIC_DRIFT_SETTINGS_URL is unset, derive it: take the origin of DRIFT_PAY_URL and append /settings (e.g. https://app.driftpos.com/settings).

### Step 2: Supabase auth

Use the same Supabase project as Drift. Users who sign up in Taproom can use Drift payments; users who signed up in Drift can use Taproom. Store supabase_user_id (auth.user.id) on your User model for recipient resolution.

### Step 3: SendMoneyButton component

Create a component that redirects to Drift's Pay page.

Props:
- amount: number (e.g. 5, 10.5)
- recipientId?: string (Supabase Auth user UUID) — use when available
- recipientEmail?: string — fallback when recipientId is not set

On click, build URL and redirect:

const baseUrl = process.env.NEXT_PUBLIC_DRIFT_PAY_URL;
const params = new URLSearchParams({
  amount: String(amount),
  return_to: window.location.href,
});
if (recipientId) params.set('recipient_id', recipientId);
else if (recipientEmail) params.set('recipient', recipientEmail);
window.location.href = `${baseUrl}?${params.toString()}`;

Example URLs:
- With recipient_id: https://app.driftpos.com/pay?amount=5&recipient_id=550e8400-e29b-41d4-a716-446655440000&return_to=https%3A%2F%2Ftaproom.example.com%2Ffeed
- With email: https://app.driftpos.com/pay?amount=5&recipient=user%40example.com&return_to=...

Prefer recipient_id over recipientEmail. Recipient must exist in Drift (signed up via shared Supabase).

### Step 4: Recipient resolution

- Comment on a post: recipient = post author
- Reply to a comment: recipient = parent comment author

Pass recipientId (author.supabase_user_id) when available, else recipientEmail (author.email).

### Step 5: Parse "$" in comments

When rendering comment text, detect amounts like $5 or $10.50 using: /\$(\d+(?:\.\d{2})?)/g

Replace each match with a SendMoneyButton. Keep the rest of the text as-is. Sanitize before parsing to avoid XSS.

### Step 6: Beer money tab

- Send section: Render "Send $X" buttons that use SendMoneyButton with the appropriate recipient.
- Settings link: Add a link/button that opens NEXT_PUBLIC_DRIFT_SETTINGS_URL (add card, bank account for withdraw).
- Withdraw link: Add a link to NEXT_PUBLIC_DRIFT_WITHDRAW_URL (or {DRIFT_PAY_URL origin}/withdraw) so users can move balance to bank.
- Balance: Call GET /api/p2p/balance (Authorization: Bearer <supabase_token>) to show "Your balance: $X" in the Beer money tab.

### Step 7: Edit Profile / Settings

Add a link to NEXT_PUBLIC_DRIFT_SETTINGS_URL so users can add or change their payment method and bank account without leaving Taproom's context (opens Drift in same tab or new tab).

### Constraints

- No Stripe, PaymentElement, or card entry in Taproom. Drift handles all payment UI.
- return_to must be the full current page URL (encoded). Drift redirects back after payment.
- Recipients receive into in-app balance immediately (no bank setup required). Add bank account in Drift to withdraw.

### Deliverables

1. SendMoneyButton component with amount, recipientId, recipientEmail props
2. Comment renderer that parses $X and renders SendMoneyButton
3. Beer money tab with Send, Settings link, Withdraw link, and balance (GET /api/p2p/balance)
4. .env.example with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_DRIFT_PAY_URL, NEXT_PUBLIC_DRIFT_SETTINGS_URL, NEXT_PUBLIC_DRIFT_WITHDRAW_URL
```
