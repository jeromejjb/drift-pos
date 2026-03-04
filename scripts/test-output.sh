#!/usr/bin/env bash
# Drift test script — outputs verification checklist to terminal

set -e
cd "$(dirname "$0")/.."

API_URL="${VITE_API_URL:-http://localhost:3001}"
DINER_URL="${DINER_URL:-http://localhost:5173}"
RESTAURANT_URL="${RESTAURANT_URL:-http://localhost:5174}"
LANDING_URL="${LANDING_URL:-http://localhost:5175}"

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║           DRIFT — BOTH USER TYPES CAN BE ONBOARDED               ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "┌─────────────────────────────────────────────────────────────────┐"
echo "│ USER TYPE           │ CAN REGISTER │ CORE FLOW      │ KEY ACTIONS │"
echo "├─────────────────────┼──────────────┼────────────────┼─────────────┤"
echo "│ Restaurant owner    │ ✓ Signup     │ ✓ Onboarding   │ Register,   │"
echo "│                     │              │   → Dashboard  │ create menu,│"
echo "│                     │              │                │ take orders │"
echo "├─────────────────────┼──────────────┼────────────────┼─────────────┤"
echo "│ Diner               │ ✓ No account │ ✓ Place order  │ Browse menu,│"
echo "│                     │   for dine   │   & pay        │ cart, pay   │"
echo "└─────────────────────┴──────────────┴────────────────┴─────────────┘"
echo ""
echo "RESTAURANT OWNER FLOW:"
echo "  Sign up → Onboarding (info, tables, menu, QR, bank) → Dashboard"
echo "  → Receive orders → Update order status"
echo ""
echo "DINER FLOW:"
echo "  Scan/Test table → Confirm table → Browse menu → Add to cart"
echo "  → Check out → Pay with card → Confirmation"
echo ""
echo "──────────────────────────────────────────────────────────────────"
echo "VERIFICATION CHECKLIST (run through TEST_SCRIPT.md to confirm)"
echo "──────────────────────────────────────────────────────────────────"
echo ""
echo "RESTAURANT OWNER"
echo "  [ ] Can register via landing signup"
echo "  [ ] Can complete full onboarding (info, tables, menu, QR, bank)"
echo "  [ ] Restaurant info saved to database"
echo "  [ ] Menu saved to database (visible in Menu tab)"
echo "  [ ] Can generate and download QR codes"
echo "  [ ] Can view dashboard and orders"
echo "  [ ] Can update order status (pending → preparing → ready → served)"
echo "  [ ] Can add/edit menu items post-onboarding"
echo ""
echo "DINER"
echo "  [ ] Can access table via Test mode (no QR needed)"
echo "  [ ] Can browse menu and add items to cart"
echo "  [ ] Can place order and pay with card"
echo "  [ ] Can see order confirmation"
echo "  [ ] (Optional) Can sign in with email code or password"
echo "  [ ] (Optional) Can add card for faster checkout"
echo "  [ ] (Optional) Can send P2P payments"
echo ""
echo "──────────────────────────────────────────────────────────────────"
echo "QUICK CHECKS (API / services)"
echo "──────────────────────────────────────────────────────────────────"

# API health (2s timeout)
if curl -s -m 2 -o /dev/null -w "%{http_code}" "$API_URL/health" 2>/dev/null | grep -q 200; then
  echo "  ✓ API ($API_URL) — reachable"
else
  echo "  ✗ API ($API_URL) — not reachable (start with: cd apps/api && npm run dev)"
fi

# Test tables (requires API + at least one restaurant with tables)
TEST_TABLES=$(curl -s -m 2 "$API_URL/api/test-tables" 2>/dev/null || echo "[]")
if echo "$TEST_TABLES" | grep -q '"id"'; then
  COUNT=$(echo "$TEST_TABLES" | grep -o '"id"' | wc -l | tr -d ' ')
  echo "  ✓ Test tables — $COUNT available for diner flow"
else
  echo "  ✗ Test tables — none (complete restaurant onboarding first)"
fi

echo ""
echo "URLs: Diner $DINER_URL | Restaurant $RESTAURANT_URL | Landing $LANDING_URL"
echo ""
echo "──────────────────────────────────────────────────────────────────"
echo "RESTAURANT FLOW TEST (run API actions, get response)"
echo "──────────────────────────────────────────────────────────────────"
echo "  Run: npm run test:restaurant"
echo "  Requires: API running (cd apps/api && npm run dev)"
echo ""
