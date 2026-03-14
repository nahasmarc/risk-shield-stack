

# Wire Live Polymarket Data Into Event Indexes Page

## Problem
The `/indexes` page uses entirely static mock data from `src/data/eventIndexes.ts`. The live Polymarket API is already working (52 markets returned), but the Event Indexes page never calls it.

## Approach
Use the existing `usePolymarkets` hook to fetch live markets, then map them into the 4 event index categories using the `bundleIds` and `category` fields from the API response. Keep static metadata (titles, descriptions, icons, colors) but replace market titles, probabilities, liquidity, and volume with live data.

## Category Mapping
The API returns markets with categories like `GEOPOLITICS`, `TECHNOLOGY`, `ENERGY`, `POLITICS`. The 4 event indexes map to:
- **Geopolitical Risk Index** (`geopolitical-risk`) ← `GEOPOLITICS` markets + markets with bundleId `taiwan-conflict`
- **AI Regulation Index** (`ai-regulation`) ← `TECHNOLOGY` markets + markets with bundleId `ai-regulation`  
- **Inflation Risk Index** (`inflation-risk`) ← `ENERGY` markets + markets with bundleId `oil-shock` or `inflation-spike`
- **Election Volatility Index** (`election-volatility`) ← `POLITICS` markets + markets with bundleId `us-election-volatility`

## Changes

### 1. `src/pages/EventIndexes.tsx`
- Import `usePolymarkets` hook
- Build live `EventIndex[]` by merging static index metadata with live markets grouped by category
- Compute `currentValue` as weighted average of live market probabilities
- Assign equal weights to live markets (1/N each)
- Keep sparkline history as-is (API doesn't provide historical data) but anchor the final point to the live composite value
- Show loading skeleton while fetching
- Show Live/Mock badge

### 2. `src/data/eventIndexes.ts`
- No changes — keep as fallback and metadata source

## Files to edit
- `src/pages/EventIndexes.tsx` — integrate `usePolymarkets`, build live indexes

