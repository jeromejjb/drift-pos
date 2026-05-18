# Drift full overhaul plan

This doc outlines a phased plan to clean up the monorepo: unify patterns, reduce tech debt, and make the codebase maintainable. Scope: diner, restaurant, landing, API.

---

## Current state (summary)

- **Diner:** React 19, Vite 7, Supabase auth only. Pages: Scan, Table, Menu, Cart, Payment (table checkout), Pay (P2P), Money, Me. Env loaded from root + `apps/diner/.env` (diner overrides).
- **Restaurant:** React 18, Vite 5, JWT auth (login/register via API). Dashboard, tables, orders, menu, POS, settings, analytics.
- **Landing:** Marketing + signup/login; redirects app paths to restaurant.
- **API:** Single large `index.ts` plus `routes/stripe.ts` and `routes/p2p.ts`. Auth: JWT for restaurant, Supabase for diner. Stripe: Connect (restaurant), PaymentIntents (table + P2P).

**Terminology:** *Payment* = pay at table (Stripe checkout). *Pay* = P2P send money.

---

## Phase 1 — Foundation (low risk)

- [x] **Diner env:** Load root + `apps/diner/.env` so sign-in works from either place.
- [x] **Diner nav:** Single source of truth for nav items and “show bottom nav” paths (`config/nav.ts`), used by `App.tsx` and `BottomNav`.
- [x] **Auth errors:** Use `toAuthError` / `toAuthErrorObject` from `userErrors.ts` everywhere (removed duplicate in AuthContext).
- [x] **API route extraction (auth):** Auth in `routes/auth.ts`; JWT in `routes/middleware.ts`. Rest (restaurants, tables, menu, orders, demo, users) can be extracted later.
- [x] **Docs:** Add a short “Payment vs Pay” and “Auth: JWT vs Supabase” in this file (Naming reference + Phase 3).

**Deliverable:** Same behavior, less duplication, clearer structure.

---

## Phase 2 — Consistency

- [ ] **Config/API URL:** Centralize `VITE_API_URL` (and related) usage. Option A: shared `packages/config`; Option B: one `lib/config.ts` per app that reads env and re-exports. Document in root `.env.example`.
- [ ] **Error mapping:** All user-facing error normalization in one place (`userErrors.ts`); no ad-hoc strings in AuthContext or pages.
- [ ] **Align dependencies:** Same React (18 or 19), Vite (5 or 7), react-router across diner, restaurant, landing. Resolve `@types/react-router-dom` vs react-router 7 in diner.
- [ ] **Restaurant config:** Single `vite.config.ts`; fix any references to `vite.config.js`. Document env in one place.

**Deliverable:** Consistent env and errors; aligned tooling.

---

## Phase 3 — Auth and security

- [ ] **Auth story:** Document “Restaurant = JWT, Diner = Supabase” in `docs/AUTH.md` (or OVERHAUL). Remove or simplify restaurant’s Supabase fallback in `useUser` so one path is canonical.
- [ ] **Stripe route audit:** List which Stripe endpoints are intentionally unauthenticated (e.g. connect, create-account, webhook, payment intent for table). Ensure any that must be protected use `authenticateToken` or `authenticateSupabase`.

**Deliverable:** Clear auth model and Stripe security posture.

---

## Phase 4 — Optional / later

- [ ] **Shared types:** `packages/types` or `packages/constants` for API paths, error codes, Stripe constants.
- [ ] **Restaurant onboarding:** Simplify steps and copy if needed.
- [ ] **Landing ↔ Restaurant:** Clear handoff (token in URL, redirects) documented and tested.

---

## Naming reference

| Term    | Meaning |
|--------|--------|
| Payment | Pay at table (Stripe checkout on diner app). |
| Pay     | P2P send money (PayPage, `/pay`). |
| JWT auth | Restaurant/landing: login/register → API issues JWT. |
| Supabase auth | Diner: sign in with Supabase; API validates Supabase token. |

---

## How to run after changes

- **Diner:** From repo root: `npm run dev:pay` (API + diner). Or `cd apps/diner && npm run dev` (diner only; API must be running).
- **API:** `npm run dev --workspace=apps/api` or as part of `npm run dev:pay`.
- **Restaurant:** `npm run dev --workspace=apps/restaurant`. Landing: `npm run dev --workspace=apps/landing`.
- **Env:** Supabase keys in root `.env` or `apps/diner/.env` (diner overrides). API URL: `VITE_API_URL=http://localhost:3001` for local.
