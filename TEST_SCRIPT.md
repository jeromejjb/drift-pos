# Drift End-to-End Test Script

**Purpose:** Verify both **restaurant owners** and **diners** can complete their full flows. Use this script to confirm onboarding and core actions work.

---

## Summary: Both User Types Can Be Onboarded

| User type | Can register/start | Can complete core flow | Key actions |
|-----------|--------------------|------------------------|-------------|
| **Restaurant owner** | ✅ Via landing signup | ✅ Full onboarding → dashboard | Register, create menu, take orders, manage orders |
| **Diner** | ✅ No account needed for dine | ✅ Place order and pay | Browse menu, add to cart, checkout, pay |

**Restaurant owner flow:** Sign up → Onboarding (info, tables, menu, QR, bank) → Dashboard → Receive orders → Update order status.

**Diner flow:** Scan/Test table → Confirm table → Browse menu → Add to cart → Check out → Pay with card → Confirmation.

---

## User Types & Actions

### Restaurant owner

| Action | Where | Notes |
|--------|-------|------|
| Register | Landing `/signup` | Creates account + restaurant in DB |
| Complete onboarding | Restaurant `/onboarding` | Info → Tables → Menu → Review → QR → Bank → Done |
| Update restaurant info | RestaurantInfoStep | Name, address, phone saved to API |
| Add/edit tables | TablesStep | Synced to DB on QR generation |
| Create menu | MenuImportStep, MenuReviewStep | Saved to API on Complete |
| Generate QR codes | QRStep | Creates missing tables, downloads PDF |
| Connect bank (Stripe) | StripeStep | Required for payouts |
| View dashboard | `/dashboard/:id` | Orders, stats |
| View orders | `/orders/:id` | Pending, preparing, ready, served |
| Update order status | OrdersPage | Pending → Preparing → Ready → Served |
| Manage menu | `/menu/:id` | Add, edit, delete items & categories |

### Diner

| Action | Where | Notes |
|--------|-------|------|
| Scan QR or use test table | Diner `/` (Scan) | Test mode shows tables from API |
| Confirm table | `/table/:tableId` | "That's me" |
| Browse menu | `/menu/:tableId` | Categories, items, prices |
| Add to cart | MenuPage | +/- quantity |
| Review cart | `/cart/:tableId` | Edit quantities, remove items |
| Check out | `/payment/:tableId` | Order + Stripe payment |
| View confirmation | `/confirmation/:orderId` | Order success |
| Sign in (optional) | AuthGate, AddCardModal | Email code or password |
| Add card (optional) | AddCardModal | For faster checkout |

---

## Prerequisites

- **API** — `cd apps/api && npm run dev` (port 3001)
- **Diner app** — `cd apps/diner && npm run dev` (port 5173)
- **Restaurant app** — `cd apps/restaurant && npm run dev` (port 5174)
- **Landing app** — `cd apps/landing && npm run dev` (port 5175)
- **Root `.env`** — `VITE_API_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_SUPABASE_*`, etc.

---

## Test Script: Full Run-Through

### Part A: Restaurant owner — register and onboard

| # | Step | Action | Expected | ✓ |
|---|------|--------|----------|---|
| A1 | Sign up | Go to `http://localhost:5175/signup`. Fill: Test Owner, test-restaurant@example.com, Test Pizza Co, TestPass123! | Redirects to `/onboarding?restaurantId=...&token=...` | |
| A2 | Restaurant info | Fill address (street, city, state, ZIP). Click Continue | Proceeds to Tables. No error | |
| A3 | Tables | Keep 5 tables (or change). Click Continue | Proceeds to Import Menu | |
| A4 | Import menu | Choose Manual or Template. Add 1+ category, 1+ item with price > 0. Continue | Proceeds to Review | |
| A5 | Review menu | Fix any issues. Continue | Proceeds to QR Codes | |
| A6 | QR codes | Wait for auto-generate. Download PDF. Continue | PDF downloads. Proceeds to Bank | |
| A7 | Bank account | Fill form. Use Stripe test: routing `110000000`, account `000123456789`, SSN `0000`. Accept TOS. Submit | Proceeds to Complete | |
| A8 | Complete | Click "Go to Dashboard" | Lands on `/dashboard/:restaurantId` | |
| A9 | Menu visible | Go to Menu tab. Check items | Menu items from onboarding appear | |
| A10 | Orders page | Go to Orders tab | Orders list loads (may be empty) | |

---

### Part B: Diner — place order and pay

| # | Step | Action | Expected | ✓ |
|---|------|--------|----------|---|
| B1 | Open Dine | Go to `http://localhost:5173` | Scan page loads | |
| B2 | Test tables | Click "Test mode". Wait for tables to load | Test tables appear (from Part A restaurant) | |
| B3 | Select table | Click any table (e.g. Table 1) | Navigates to Table confirmation | |
| B4 | Confirm table | Click "That's me" | Navigates to Menu | |
| B5 | Add to cart | Add 1+ items. Check cart badge | Cart count updates | |
| B6 | View cart | Click cart or "Check out" | Cart page with items | |
| B7 | Check out | Click "Check out with Drift" | Payment page loads | |
| B8 | Pay | Enter Stripe test card `4242 4242 4242 4242`. Submit | Redirects to confirmation | |
| B9 | Confirmation | See order confirmation | Order ID, success message | |

---

### Part C: Restaurant owner — receive and manage order

| # | Step | Action | Expected | ✓ |
|---|------|--------|----------|---|
| C1 | Orders | In restaurant app, go to Orders | New order appears (from Part B) | |
| C2 | Order details | Open order | Table number, items, total visible | |
| C3 | Update status | Change status: Pending → Preparing → Ready → Served | Status updates | |

---

### Part D: Diner — optional flows

| # | Step | Action | Expected | ✓ |
|---|------|--------|----------|---|
| D1 | Add card | From Scan, click "Add card for faster checkout". Sign in (email code or password) if prompted. Add card | Card saved. Stripe test card works | |
| D2 | Pay (P2P) | Go to Pay tab. Tap "Send money". Sign in. Enter amount, recipient. Pay | P2P flow completes | |

---

## Output: Verification Checklist

After running the script, confirm:

```
RESTAURANT OWNER
☐ Can register via landing signup
☐ Can complete full onboarding (info, tables, menu, QR, bank)
☐ Restaurant info saved to database
☐ Menu saved to database (visible in Menu tab)
☐ Can generate and download QR codes
☐ Can view dashboard and orders
☐ Can update order status (pending → preparing → ready → served)
☐ Can add/edit menu items post-onboarding

DINER
☐ Can access table via Test mode (no QR needed)
☐ Can browse menu and add items to cart
☐ Can place order and pay with card
☐ Can see order confirmation
☐ (Optional) Can sign in with email code or password
☐ (Optional) Can add card for faster checkout
☐ (Optional) Can send P2P payments
```

---

## Stripe Test Values

| Field | Value |
|-------|-------|
| Card number | `4242 4242 4242 4242` |
| Expiry | Any future date (e.g. 12/34) |
| CVC | Any 3 digits |
| Bank routing | `110000000` |
| Bank account | `000123456789` |
| SSN last 4 | `0000` |

---

## Quick Reference URLs

| App | URL |
|-----|-----|
| Diner | http://localhost:5173 |
| Restaurant | http://localhost:5174 |
| Landing | http://localhost:5175 |
| API | http://localhost:3001 |
