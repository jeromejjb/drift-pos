# Test credentials (Diner app)

Auth is **Supabase** — there are no pre-created users. Use **Sign up** (or **Create account** in the AuthGate modal) to create a test account.

## Suggested test account

Create an account with:

| Field    | Value              |
|----------|--------------------|
| **Email**    | `test@example.com` (or any email you can access) |
| **Password** | `TestPass123!`     |
| **Name**     | `Test User` (optional) |

## How to test

1. **Dining (no account)**  
   - Open **Dine** → Scan (or use test table 1/2/3) → Table → Menu → Cart → **Check out with Drift** → pay as guest. No sign-in required.

2. **Pay (account required to send)**  
   - Open **Pay** → tap **Send money** → in the modal choose **Create account** and sign up with the credentials above.  
   - Or go to **Me** → **Create account** and use the same credentials.

3. **Email confirmation**  
   If your Supabase project has **Confirm email** enabled, you must confirm the email (link in inbox) before signing in. For local testing you can turn this off in Supabase: **Authentication → Providers → Email → Confirm email** (disable).

## Email code (passwordless) — free, no API key

You can sign in with **email + 6-digit code** (no password). In AuthGate or AddCardModal, choose **Email code**, enter your email, tap **Send code**, then enter the code from your inbox.

**Setup (one-time in Supabase):** [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication → Email Templates** → **Magic Link**. Change the template to show the OTP code instead of a link:

```html
<h2>Your login code</h2>
<p>Enter this code in the app: {{ .Token }}</p>
```

Supabase sends the email using its built-in provider — no Twilio, Resend, or other API keys needed.

## Phone / SMS sign-in (optional, requires Twilio)

For phone-based OTP, configure the Send SMS hook and Twilio. See the API `send-sms` endpoint and add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` to your API `.env`. The app defaults to **Email code** for launch.

## Quick copy-paste (email)

```
Email:    test@example.com
Password: TestPass123!
```

Use these in **Create account** (AuthGate or `/signup`) to get a test user, then sign in with the same email/password for Pay and Me.

## "Failed to fetch" or "Couldn't connect" on sign-in

- **Root `.env`** — The diner reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the **repo root** `.env`. Copy `.env.example` to `.env` and add your Supabase values. For production (Render, etc.), set these in the build environment.
- **Supabase project** — In [Supabase Dashboard](https://supabase.com/dashboard) → your project: check the project is **not paused** (free tier projects pause after inactivity). Use **Settings → API** and copy the **Project URL** and **anon public** key into root `.env`.
- **Network** — If you're offline or behind a strict firewall, sign-in requests to Supabase may fail. Try again with a stable connection.
