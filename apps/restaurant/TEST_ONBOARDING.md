# Restaurant Onboarding Test Guide

## Prerequisites

- **API** running (`cd apps/api && npm run dev`) — default port 3001
- **Restaurant app** running (`cd apps/restaurant && npm run dev`) — default port 5175
- **Landing app** running (`cd apps/landing && npm run dev`) — for signup
- **Root `.env`** with `VITE_API_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`, etc.

## Production / in-venue checklist

- **API env:** Set `RESTAURANT_URL` or `RESTAURANT_ONBOARDING_BASE_URL` to the **public** restaurant app origin (same host users see after signup). Stripe hosted Connect onboarding uses this for `refresh_url` / `return_url`; a wrong value sends people to the wrong app or localhost.
- **Landing:** Set `VITE_RESTAURANT_URL` to that same restaurant origin so signup redirects match the API.
- **Stripe:** A new Connect account stays restricted until Stripe finishes KYC. Card payments to that restaurant fail until `charges_enabled` and transfer capability are active—plan onboarding time accordingly, even when your UI is ready.

## Test Flow 1: Full onboarding via signup

### Step 1: Sign up (landing)

1. Go to `http://localhost:5174/signup` (or your landing URL)
2. Fill in:
   - Full name: `Test Owner`
   - Email: `test-restaurant@example.com`
   - Business name: `Test Pizza Co`
   - Password: `TestPass123!`
   - Role, business type, team size (any)
3. Submit → should redirect to `http://localhost:5175/onboarding?restaurantId=...&token=...`

**Check:** URL has `restaurantId` and `token`. No "Something went wrong" screen.

### Step 2: Restaurant Info

1. Restaurant name, email should be pre-filled
2. Fill address: Street, City, State, ZIP (5 or 9 digits)
3. Phone optional — if used, must be 10 digits
4. Click Continue

**Check:** No validation errors. Proceeds to Tables.

### Step 3: Table Setup

1. Default: 5 tables (from signup tableCount)
2. Add/remove tables as needed
3. Click Continue

**Check:** Tables save. Proceeds to Import Menu.

### Step 4: Import Menu

1. Choose **Manual** or **Template** (e.g. Pizza)
2. Add at least one category and one item with price > 0
3. Click Continue

**Check:** Menu data passes to Review step.

### Step 5: Review Menu

1. Review items, fix any price/description issues
2. Click Continue

**Check:** Proceeds to QR Codes.

### Step 6: QR Codes

1. Codes auto-generate (or click Generate)
2. Download PDF
3. Click Continue

**Check:** No "Failed to generate QR codes". PDF downloads.

### Step 7: Bank Account (Stripe)

1. Fill business name, full name, email, address
2. DOB (e.g. 01/15/1990)
3. SSN last 4: use `0000` for test mode
4. Bank: use Stripe test routing `110000000`, account `000123456789`
5. Accept TOS
6. Submit

**Check:** No API error. Proceeds to Complete.

### Step 8: Complete

1. Click "Go to Dashboard"
2. Should land on `/dashboard/:restaurantId`

**Check:** Dashboard loads. Token in localStorage. No redirect to login.

---

## Test Flow 2: Direct onboarding URL (no signup)

Use when testing onboarding in isolation (e.g. restaurant already exists in DB).

1. Get a valid `restaurantId` from DB or a previous signup
2. Go to:  
   `http://localhost:5175/onboarding?restaurantId=YOUR_RESTAURANT_ID&businessName=Test&email=test@example.com&fullName=Test&token=OPTIONAL_JWT`
3. Run steps 2–8 above

**Check:** Step 1 (Restaurant Info) loads. No "No restaurant ID provided".

---

## Fixes applied

| Issue | Fix |
|-------|-----|
| Menu not persisted | CompleteStep now calls `POST /api/restaurants/:id/menu/bulk` before redirect |
| Tables not synced when count > 5 | `generate-qrs` API now creates missing tables |
| Restaurant address/phone not updated | RestaurantInfoStep now calls `PATCH /api/restaurants/:id` on Continue |

---

## Stripe Test Values

- **Routing number:** `110000000` (Stripe test)
- **Account number:** `000123456789` (Stripe test)
- **SSN last 4:** any non-repeating 4-digit value such as `1234` (use your real last 4 in live mode)
