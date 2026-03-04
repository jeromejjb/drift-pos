# Diner UX + Restaurant Analytics Redesign

## Research Summary

### Guest Onboarding (QR Menu UX)
- **First 2 seconds matter** — No splash screens, tutorials, or modals
- **Guest-first** — Never force account creation for one-time visits
- **Clear landing** — Optional daily highlight, brand copy, main categories as tiles
- **Load fast** — 2–3 seconds on mobile data
- **Single-column layout** — Vertical scroll, sticky category nav
- **Sticky cart** — Visible but light; stay in flow

### Loyalty Integration
- **Optional sign-in** — Offer at checkout or post-order: "Sign in to earn points"
- **Points + tiers** — 1 pt per $1; bronze/silver/gold multipliers
- **Transparent tracking** — Show progress to next reward
- **Personalized rewards** — Based on order history
- **Referral** — Bonus points for inviting friends

### Restaurant Analytics
- **Contextual insights** — Why did sales change? (traffic, check size, promotions)
- **Multi-level comparisons** — Time periods, dayparts, channels
- **Actionable** — Identify changes and act same day
- **Clean, minimal** — Charts, KPIs, shortcuts

---

## New Diner Flow

### Guest Journey (No Account)
1. **Scan** → Landing with restaurant name + "Tap to browse menu"
2. **Table confirm** → "You're at Table 5" → "That's me"
3. **Menu** → Categories as tiles (no scroll to find); items with clear add button
4. **Cart** → Sticky bar; tap to review
5. **Checkout** → Tip + pay; optional "Create account to earn points"

### Loyalty Journey (Optional)
- **At checkout** — "Sign in to earn 42 points on this order"
- **Post-order** — "You earned 42 points! Sign in to save them"
- **Returning** — "Welcome back! You have 180 points (20 to free drink)"

### Flow Diagram
```
Scan → [Restaurant] → Table confirm → Menu → Cart → Checkout
                                              ↓
                                    [Guest] Pay → Confirmation
                                    [Member] Pay → Earn points → Confirmation
```

---

## Loyalty Schema

### DinerLoyalty
- `restaurantId` — Which restaurant
- `userId` — User (or guest ID for anonymous)
- `email` — For guest→member conversion
- `points` — Total earned
- `tier` — BRONZE | SILVER | GOLD
- `lastOrderAt` — For recency

### Points Rules
- 1 point per $1 spent (configurable per restaurant)
- Tier multipliers: Bronze 1x, Silver 1.25x, Gold 1.5x
- Rewards: e.g. 50 pts = free drink, 200 pts = free appetizer

---

## Restaurant Analytics Dashboard

### Sections
1. **Overview** — Today vs yesterday, week vs last week
2. **Revenue** — Line chart, breakdown by daypart
3. **Orders** — Volume, avg check size, status mix
4. **Top Items** — Best sellers, revenue by item
5. **Guests** — New vs returning (when loyalty data exists)
6. **Insights** — "Revenue up 12% — driven by higher check size"

### Design
- Dark/light toggle
- Card-based layout
- Recharts or similar for charts
- Date range picker
- Export (future)

---

## Implementation Phases

1. **Phase 1** — Loyalty schema + API
2. **Phase 2** — Diner guest flow redesign (landing, menu, cart)
3. **Phase 3** — Loyalty UI in diner (optional sign-in, points display)
4. **Phase 4** — Restaurant Analytics page
