# Auth Codebase Analysis — Email Code Removal

## Summary

**Root cause:** The **committed** (git HEAD) version of `AuthForm.tsx` still contains the old email OTP flow with "Email" tab, "Send code" button, and email code verification. Your **working directory** has the updated auth (Sign in / Create account with email + password only), but these changes are **not committed**.

If you see "Email code" or "Send code" on `/money`, `/pay`, `/me`, or in AddCardModal, you're running the **old committed code**, not the modified files.

---

## Auth Flow Architecture

| Page/Component | Auth Entry | Uses |
|----------------|------------|------|
| `/money` (MoneyPage) | "Sign in or create account" button | AuthGate → AuthForm |
| `/pay` (PayPage) | "Send money" / auth gate | AuthGate → AuthForm |
| `/me` (MePage) | "Create account" button | AuthGate → AuthForm |
| AddCardModal | Inline auth when adding card | AuthForm directly |
| `/withdraw` (WithdrawPage) | Auth gate | AuthGate → AuthForm |

**Single source of truth:** `apps/diner/src/components/auth/AuthForm.tsx`

---

## Current State (Working Directory — Modified)

- **AuthForm:** Sign in / Create account tabs only. Email + password. No "Email code", no "Send code".
- **AuthContext:** signIn, signUp, signInWithPhone, verifyPhoneOtp, signInWithGoogle. No signInWithEmailOtp or verifyEmailOtp.

---

## Committed State (git HEAD)

- **AuthForm:** Three tabs — "Email" (email OTP), "Phone" (SMS OTP), "Password". "Send code" button for email/phone OTP.
- **AuthContext:** signInWithEmailOtp, verifyEmailOtp, signInWithPhone, verifyPhoneOtp, signIn, signUp.

---

## Why You Might See the Old UI

1. **Dev server using cached build** — Restart: `cd apps/diner && npm run dev`
2. **Hard refresh** — Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. **Changes not committed** — If you pulled or switched branches, uncommitted changes can be lost
4. **Different project copy** — Ensure you're running from `/Users/jeromebrown/drift`

---

## Fix: Commit the Changes

To make the updated auth permanent:

```bash
cd /Users/jeromebrown/drift
git add apps/diner/src/components/auth/AuthForm.tsx apps/diner/src/components/auth/AuthGate.tsx apps/diner/src/contexts/AuthContext.tsx apps/diner/src/App.tsx apps/diner/src/pages/SignInPage.tsx apps/diner/src/pages/SignUpPage.tsx apps/diner/src/pages/MoneyPage.tsx
git add apps/diner/src/pages/AuthCallbackPage.tsx  # if adding
git commit -m "Remove email code auth; use password only"
```

Then restart the dev server and hard refresh the browser.

---

## Files Modified (Uncommitted)

- `apps/diner/src/components/auth/AuthForm.tsx` — Removed email OTP, phone OTP; Sign in / Create account only
- `apps/diner/src/components/auth/AuthGate.tsx` — defaultSignUp prop
- `apps/diner/src/contexts/AuthContext.tsx` — Removed signInWithEmailOtp, verifyEmailOtp; added signInWithGoogle
- `apps/diner/src/App.tsx` — /auth/callback route
- `apps/diner/src/pages/SignInPage.tsx` — Removed Google button
- `apps/diner/src/pages/SignUpPage.tsx` — Removed Google button
- `apps/diner/src/pages/MoneyPage.tsx` — Button text, defaultSignUp
- `apps/diner/src/pages/AuthCallbackPage.tsx` — New file (OAuth callback, unused when Google disabled)
