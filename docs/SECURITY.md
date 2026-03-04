# Security Guide

## API Keys & Secrets

All secrets must be loaded from environment variables. **Never commit real credentials to the repository.**

### Required Environment Variables (API)

| Variable | Purpose | Notes |
|----------|---------|-------|
| `DATABASE_URL` | PostgreSQL connection string | Never commit. Use host provider secrets. |
| `JWT_SECRET` | Signing key for JWT tokens | Use a strong random string (≥32 chars) in production. |
| `STRIPE_SECRET_KEY` | Stripe API (sk_test_ or sk_live_) | Server-only. Never expose in frontend. |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | Required for Stripe webhooks. |

### Optional / Per-Feature

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Supabase auth (diner sign-in) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | SMS sign-in |
| `OPENAI_API_KEY` | Menu import |
| `TEST_P2P_RECIPIENT_EMAIL` | P2P test mode |

### Frontend (Vite) – Public Keys Only

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base URL |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe pk_* (safe for client) |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Supabase anon key only (never service_role) |

## Best Practices

1. **Rotate credentials** if they may have been exposed.
2. **Use different secrets** for development and production.
3. **Restrict `.env`** – ensure it is in `.gitignore` and never committed.
4. **Use strong JWT_SECRET** – e.g. `openssl rand -base64 32`.

## Protected Endpoints

The following require `Authorization: Bearer <token>` and restaurant ownership:

- `GET /api/restaurant/:id/orders`
- `GET /api/restaurant/:id/stats`
- `PATCH /api/order/:id/status`
- `GET /api/restaurant/:id/analytics`
- Menu, restaurant, and user management routes

## Logging

Sensitive fields (`password`, `token`, `secret`, `cardNumber`, `cvv`) are redacted from request body logs.
