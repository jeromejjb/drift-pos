# Beer App → Drift P2P Integration Prompt

Copy and paste this prompt when working on the beer app codebase (e.g., into Cursor, ChatGPT, or Claude):

---

## Prompt

```
Integrate Drift P2P payments into this beer logging app so users can send each other money and trigger payments from "$" in comments.

### Context
- Drift is a separate app with P2P payment infrastructure (Supabase auth, Stripe, API).
- This beer app will redirect users to Drift's Pay page for payment (redirect flow).
- Both apps share the same Supabase project for auth.

### Requirements

**Payment types supported:**
- **P2P** — Send money to another user (redirect to Drift Pay or call create-intent)
- **Pay for things** — Pay a merchant for goods/services (call merchant-payment with amount + destination)

1. **Environment variables**
   Add to .env (and .env.example):

   ```
   # Supabase — same project as Drift (required for shared auth)
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...

   # Drift — Pay page URL for redirect flow
   VITE_DRIFT_PAY_URL=https://app.driftpos.com/pay

   # Drift — Settings URL for payment method setup (default: {VITE_DRIFT_PAY_URL base}/settings)
   # VITE_DRIFT_SETTINGS_URL=https://app.driftpos.com/settings

   # Optional: Drift API URL (only if using inline Stripe flow later)
   # VITE_DRIFT_API_URL=https://api.driftpos.com
   ```

   Get VITE_SUPABASE_* from Drift's .env or Supabase Dashboard → Settings → API.

2. **Supabase auth**
   - Use the same Supabase project as Drift.
   - Add sign-in/sign-up (email/password or magic link).
   - Users who sign up here can use Drift payments; users who signed up on Drift can use this app.

3. **Parse "$" in comments**
   - When rendering comments, detect amounts like $5 or $10.50 using: /\$(\d+(?:\.\d{2})?)/g
   - Replace each match with a clickable "Send $X" button/chip.

4. **SendMoneyButton component**
   - Props: amount (number), recipientEmail (string) OR recipientId (Supabase user UUID)
   - On click: redirect to VITE_DRIFT_PAY_URL with query params:
     - amount
     - recipient (email) OR recipient_id (Supabase user UUID) — partner apps can use recipient_id to avoid collecting email
     - return_to (current page URL, encoded)
   - Example (email): https://app.driftpos.com/pay?amount=5&recipient=user@email.com&return_to=...
   - Example (user ID): https://app.driftpos.com/pay?amount=5&recipient_id=550e8400-e29b-41d4-a716-446655440000&return_to=...

5. **Recipient resolution**
   - For a comment on a post: recipient = post author
   - For a reply to a comment: recipient = parent comment author
   - Use recipient_id (Supabase user ID) when available — no email needed. Otherwise use recipient (email). Recipient must exist in Drift (have signed up via shared Supabase).

6. **Comment renderer**
   - Update the comment component to parse $ amounts and render SendMoneyButton for each.
   - Keep the rest of the comment text as-is; only replace the $X patterns.

### Constraints
- Use the redirect flow (no Stripe in beer app). Drift handles the full payment UI.
- Do not add Stripe or PaymentElement to the beer app unless we explicitly choose the inline flow later.
- Sanitize comment text before parsing to avoid XSS.

7. **Pay for things (merchant payments)**
   - Call `POST /api/p2p/merchant-payment` with:
     - amount (number)
     - destination (merchant's Stripe Connect account ID, acct_xxx)
     - metadata (optional, e.g. { merchantId, itemId })
   - Merchants need Stripe Connect accounts; use Drift's onboarding or your own.
   - Use returned clientSecret with Stripe PaymentElement.

### Deliverables
- Supabase client and auth flow
- SendMoneyButton component
- Updated comment renderer with $ parsing
- Merchant payment flow (amount + destination → PaymentElement)
- .env.example with: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_DRIFT_PAY_URL
```

---

## Shorter version (if context is limited)

```
Add Drift P2P integration to this beer app:

1. Add to .env:
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_DRIFT_PAY_URL=https://app.driftpos.com/pay
   (Same Supabase project as Drift)
2. Add Supabase auth (shared project with Drift)
3. Parse $5 / $10.50 in comments and render clickable "Send $X" buttons
4. SendMoneyButton: redirect to VITE_DRIFT_PAY_URL?amount=X&recipient=email (or recipient_id=supabase_uuid)&return_to=currentUrl
5. Recipient = post author (for comments) or parent comment author (for replies). Must have email.
```
