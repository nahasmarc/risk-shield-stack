

# Wire Live Polymarket Data Into the Frontend

## Problem
The entire frontend — hedge bundle cards, contract rows, live signals panel — uses hardcoded mock data from `src/data/bundles.ts`. The backend already fetches real Polymarket Gamma API data via the `/markets` edge function, but nothing on the frontend calls it.

## Plan

### 1. Create a React hook: `src/hooks/usePolymarkets.ts`
- Calls the existing `/markets` edge function on mount (via `supabase.functions.invoke('markets')` or direct fetch to the functions URL)
- Returns `{ markets, bundles, signals, loading, error, dataSource }`
- Groups returned markets by `bundleIds` to build dynamic `HedgeBundle[]` objects that match the existing interface
- Derives live signals from the top 8 most-liquid markets
- Falls back to existing static `HEDGE_BUNDLES` / `LIVE_SIGNALS_BASE` if the fetch fails (graceful degradation)
- Caches in React state; refreshes every 60 seconds

### 2. Update `src/pages/Index.tsx`
- Replace `import { HEDGE_BUNDLES }` with `usePolymarkets()` hook
- Pass dynamic bundles to `HedgeCard` components
- Show a loading skeleton while data loads
- Show a small "Live" / "Mock" indicator badge near the bundle heading

### 3. Update `src/pages/BundleDetail.tsx`
- Instead of `getBundleById(id)` from static data, call `usePolymarkets()` or fetch `/markets?bundleId={id}` to get live contracts for that bundle
- Fall back to static data if API unavailable

### 4. Update `src/components/LiveSignalsPanel.tsx`
- Accept markets as a prop or use the hook directly
- Seed initial signal values from real market probabilities instead of `LIVE_SIGNALS_BASE`
- Keep the random-walk animation for the "live updating" effect, but start from real probabilities

### 5. Keep `src/data/bundles.ts` as fallback
- Keep the static data, helper functions (`formatMillions`, `calculateEffectivenessScore`, etc.), and type definitions
- The bundle metadata (title, description, icon, category colors, risk level) stays static — only contracts/probabilities/liquidity come from the API
- Merge approach: static bundle shell + live contracts from API

### 6. Add data source indicator
- Small badge in the nav or near bundle grid: "Live Data" (green) or "Mock Data" (yellow)
- Uses the `dataSource` field already returned by the `/markets` endpoint

## Files to create/edit
- **New**: `src/hooks/usePolymarkets.ts` — data fetching hook
- **Edit**: `src/pages/Index.tsx` — use hook instead of static imports
- **Edit**: `src/pages/BundleDetail.tsx` — use hook for bundle contracts
- **Edit**: `src/components/LiveSignalsPanel.tsx` — seed from real data
- **Keep**: `src/data/bundles.ts` — fallback + metadata + types

## Technical notes
- The `/markets` edge function already returns `{ markets, total, dataSource, cachedAt }` with markets classified into bundles via keyword matching
- Each market has `bundleIds: string[]` so we can group them into bundles
- The `polymarket_service.ts` already handles Gamma API pagination (2x200 markets), TTL caching, and mock fallback
- Bundle metadata (descriptions, icons, risk levels) stays in `bundles.ts` since the API doesn't provide that context

