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

## Auth methods

**Password** — Email + password. Create account or sign in.

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
