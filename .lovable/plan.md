
## Full App Audit

### What's Working ✅
- Live Polymarket data: 61 real markets from Gamma API confirmed (`dataSource: live`)
- Markets are correctly routed to bundles: election, geopolitics, energy, macro, AI
- `usePolymarkets` hook wires live data into `Index.tsx`, `BundleDetail.tsx`, `LiveSignalsPanel.tsx`, `EventIndexes.tsx`
- Auth (Google sign-in), Settings page, order history all in place
- `place-order` edge function exists with CLOB API integration
- `build-hedge`, `analyze-portfolio`, and `news-hedge` edge functions work and hydrate with live market contracts via `bundle_engine.ts`

---

### What's Broken or Incomplete — The Real Gaps

**Gap 1: AIBuilder page uses static `HEDGE_BUNDLES` for bundle display**
`AIBuilder.tsx` line 133: after calling `build-hedge` (which returns live contracts), it does:
```ts
const frontendBundle: HedgeBundle | null = HEDGE_BUNDLES.find(b => b.id === result.bundle.id) ?? null;
```
It **throws away the live contracts** from the API response and falls back to static mock contracts. The bundle card in the chat shows **mock data**, not the live result.

**Fix:** Use the live `result.bundle.contracts` from the API response directly, merging with static metadata (title, desc, icon, risk level, tags) from `HEDGE_BUNDLES`.

**Gap 2: No Polymarket direct link on any Contract row**
The `/markets` API returns `id` which is the Polymarket market ID (e.g. `"567621"`). The Polymarket URL for a market is `https://polymarket.com/market/{id}`. No contract row shows a "View on Polymarket" link. Users can't verify, inspect, or manually trade.

**Fix:** Add a small external link icon on `ContractRow.tsx` that links to `https://polymarket.com/market/{contract.id}`.

**Gap 3: Liquidity values showing as $0.0M or near-zero**
Looking at the live API response: `"liquidity": 0.48224498075` — that's already in millions (USD). But looking at the service code, it converts: `Math.min((raw.liquidityNum ?? 0) / 1_000_000, 999)`. The Gamma API's `liquidityNum` is in raw USD, so $482,244 / 1M = $0.48M. These are real values but they look low — some markets have < $1M. The `formatMillions` function in `bundles.ts` does `$0.5M` for 0.48. This is correct but confusing — should display as `$482K` not `$0.5M` for amounts under $1M.

**Fix:** Update `formatMillions` to use `$XXK` for values under 1M.

**Gap 4: Bundles with zero live contracts fall back silently**
If the API returns no markets for a specific `bundleId` (e.g. `oil-shock`), `buildBundleFromMarkets` in `usePolymarkets.ts` returns the static bundle with **old mock contracts**. There's no visual indicator showing which contracts are real vs cached.

**Fix:** Add a "last updated" timestamp badge on `ContractRow` for live markets; show fallback notice when contracts are mock.

**Gap 5: `place-order` uses `contract.id` as `tokenId`**
`CoverageCalculator.tsx` line 83: `tokenId: primaryContract.id`. Live contracts from Gamma API have IDs like `"567621"` (market IDs), but the Polymarket CLOB API needs a **token ID** (a 256-bit hex string, different from market ID). This means the order execution flow will always fail for live contracts.

**Fix:** This is a fundamental trading integration gap. To place real orders, the app needs to fetch the CLOB token ID for each market. For now, the order confirm dialog should clearly display this as a simulated/paper trade until proper CLOB token IDs are fetched.

**Gap 6: Navigation `marketCount` shows `61m` (wrong unit)**
`Navigation.tsx` line 101: `Polymarket Live · ${marketCount}m` — `m` here likely means "markets" but looks like "million". Should be `${marketCount} markets`.

---

## Plan

### Files to edit:

1. **`src/pages/AIBuilder.tsx`** — Use live `result.bundle` contracts instead of falling back to static `HEDGE_BUNDLES`. Merge live contracts with static metadata.

2. **`src/components/ContractRow.tsx`** — Add a small "View on Polymarket" external link using `contract.id` to build the Polymarket URL.

3. **`src/lib/utils.ts` / `src/data/bundles.ts`** — Fix `formatMillions` to render `$482K` for sub-million values instead of `$0.5M`.

4. **`src/components/Navigation.tsx`** — Fix the `marketCount` label from `61m` → `61 markets`.

5. **`src/components/CoverageCalculator.tsx`** — Add a "Simulated Order" disclaimer and disable real order placement (since CLOB token IDs aren't available from Gamma API), replacing it with a clear "Paper Trade" confirmation flow. This prevents users from accidentally sending bad orders.

### Files NOT changing:
- `usePolymarkets.ts` — working correctly
- All edge functions — working correctly
- `EventIndexes.tsx`, `BundleDetail.tsx`, `Index.tsx` — working correctly
- Auth, Settings, order history — working correctly

