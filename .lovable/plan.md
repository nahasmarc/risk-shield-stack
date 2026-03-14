
## Full Assessment: PolyBundle Hackathon Readiness

### What's already built:
- Live Polymarket Gamma API integration (market data)
- AI risk detection (Gemini via Lovable AI)
- Hedge bundle recommendation engine
- Coverage calculator (currently fake — just UI, no real trade)
- Google Sign-In auth
- Per-user Polymarket credential storage (Settings page)
- `place-order` edge function with HMAC signing (written but needs testing)
- News-to-Hedge feature

### What's missing for a fully demo-able app:

1. **Name change**: "PolyBumble" → "PolyBundle" appears in 7 files + index.html (8 occurrences total)

2. **Execute Hedge button is fake**: The "Execute Hedge →" button in `CoverageCalculator.tsx` just sets a local state flag — it never calls `place-order`. Need to wire it to the real edge function with a proper order flow.

3. **Trade order dialog**: Need a confirmation modal showing token IDs, price, side, size before submitting. The CLOB API needs `tokenId` which isn't surfaced anywhere in the UI yet. Contracts in `bundles.ts` are static mock data — we need a way to map them to real Polymarket token IDs via the Gamma API.

4. **No portfolio / positions page**: Once trades are placed, there's nowhere to see open positions. Need an orders/positions table and a page or section showing them.

5. **Disclaimer on BundleDetail is wrong**: Still says "No real financial transactions occur" — needs to be updated if trades are live.

6. **Login redirect issue**: After Google OAuth, the redirect goes to `window.location.origin` which works, but there's no graceful message on successful connection.

7. **The `polymarket_credentials` table has no primary key reference to auth.users** (no foreign key set up), which could cause issues — but the RLS policies use `auth.uid()` correctly so it's fine operationally.

---

## The Plan

### 1. Rename PolyBumble → PolyBundle across all files:
- `index.html` (title, meta tags, twitter handle)
- `src/components/Navigation.tsx` (wordmark)
- `src/pages/Login.tsx` (h1 title)
- `src/pages/Index.tsx` (hero paragraph, footer)
- `src/pages/EventIndexes.tsx` (footer)
- `src/pages/AIBuilder.tsx` (welcome message, assistant label)
- `src/lib/api.ts` (comment header)
- `supabase/functions/_shared/polymarket_service.ts` (User-Agent string)

### 2. Wire up Execute Hedge button to real trade:
- In `CoverageCalculator.tsx`: replace fake `handleExecute` with a real flow:
  - Check if user is logged in + has credentials
  - Open a confirm order dialog (modal) showing: contract, side (YES), estimated cost, size in USDC
  - On confirm → call `place-order` edge function via `supabase.functions.invoke('place-order', ...)`
  - Show success/error toast with order ID

For the token ID mapping: the CLOB API needs `tokenId`. The Gamma API markets have `id` which is the market ID. The `place-order` function will pass `tokenId` from the contract. We need to store a `polymarketTokenId` field on contracts, or fetch it dynamically. For the hackathon demo: add a `tokenId` field to static bundle contracts using real Polymarket token IDs from the Gamma API. We'll fetch them once and hardcode them into `bundles.ts` for demo reliability.

Actually, cleaner approach: enhance the `place-order` flow to accept a market `id` and look up the token ID from the Gamma API inside the edge function (or accept it from the UI).

### 3. Add a simple Orders/Positions tracker:
- New `orders` table in the database to store placed orders (user_id, market_title, side, size, price, status, created_at)
- Add an "Orders" section to the Settings page (or a dedicated `/portfolio` page) showing past orders and their status
- When a trade is placed via `place-order`, also insert into `orders` table

### 4. Fix the disclaimer copy
- Update the "Simulated platform" disclaimer on BundleDetail to reflect real trading capability

---

## Files to change:

**Rename (find/replace):**
- `index.html`
- `src/components/Navigation.tsx`
- `src/pages/Login.tsx`
- `src/pages/Index.tsx`
- `src/pages/EventIndexes.tsx`
- `src/pages/AIBuilder.tsx`
- `src/lib/api.ts`
- `supabase/functions/_shared/polymarket_service.ts`

**New/Updated:**
- `src/components/CoverageCalculator.tsx` — real trade execution + auth check + order dialog
- `src/pages/Settings.tsx` — add orders history tab
- `supabase/functions/place-order/index.ts` — already exists, may need minor fix (getClaims is deprecated, use getUser instead)
- `src/lib/api.ts` — add `placeOrder()` helper
- New migration: `orders` table with RLS
- `src/App.tsx` — add `/portfolio` route (optional, or fold into Settings)

## Execution order:
1. DB migration: create `orders` table
2. Rename PolyBumble → PolyBundle everywhere
3. Fix `place-order` edge function auth (getClaims → getUser)
4. Update CoverageCalculator with real order dialog + trade execution
5. Update Settings page to show order history
6. Fix BundleDetail disclaimer
