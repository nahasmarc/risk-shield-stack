
## Complete Honest App Audit

### What is Fully Working ✅

1. **Live Polymarket data pipeline** — Gamma API fetches 500+ raw markets, deduplicates, classifies into 5 bundles, serves via `/markets` edge function. Confirmed `dataSource: live` in nav.
2. **AI Builder chat** — `build-hedge` edge function calls Gemini to parse risk, matches bundle, hydrates with live contracts. Frontend merges live contracts with static metadata correctly.
3. **News to Hedge** — `news-hedge` edge function reads pasted news text, extracts risk, returns live bundle.
4. **Bundle Detail page** — Live contracts rendered in `ContractRow`, coverage calculator, hedge effectiveness score, stats strip all working.
5. **Event Indexes** — `buildLiveIndexes()` merges live markets into composite indexes, sparklines, category filter.
6. **Navigation** — Live/Mock badge, correct `X markets` count, auth avatar/sign-out.
7. **Google Sign-In** — Login page works via `lovable.auth.signInWithOAuth("google")`.
8. **Settings page** — API credentials CRUD (store/update/delete), order history tab all functional.
9. **Saved Bundles** — DB table `saved_bundles` created with RLS. AI Builder saves/loads from DB when logged in.
10. **Order History** — `orders` table stores each simulate-hedge call. Settings shows full history.
11. **Polymarket external links** — `ContractRow` uses slug for `polymarket.com/event/{slug}` links.
12. **Paper Trade UI** — "Simulate Hedge" button, amber banner, clear disclaimer in dialog.
13. **Currency formatting** — `formatMillions` now shows `$482K` for sub-million values.

---

### What's Still Incomplete or Broken ❌

**Issue 1: `bundle_engine.ts` does NOT pass `slug` or `yesTokenId` through to the frontend**
`hydrateBundleContracts()` maps markets to `BundleContract` objects but only includes `id, title, probability, liquidity, volume, category, direction` — it strips `slug` and `yesTokenId`. So even though `polymarket_service.ts` extracts them, the `/build-hedge` endpoint response has contracts WITHOUT slugs or yesTokenIds. The ContractRow links on the AI Builder result card will be broken (no slug = falls back to numeric ID link which 404s). And the coverage calculator will use `primaryContract.id` not `primaryContract.yesTokenId` because it's null.

**Fix**: Add `slug` and `yesTokenId` to `BundleContract` in `bundle_engine.ts`, and pass them through in `hydrateBundleContracts`. Also update `ApiContract` type in `src/lib/api.ts`.

**Issue 2: `api.ts` `ApiContract` type missing `slug` and `yesTokenId`**
The frontend type for what comes back from `build-hedge` doesn't include these fields, so TypeScript will strip them even if the backend sends them. The `frontendBundle` construction in `AIBuilder.tsx` maps `result.bundle.contracts` directly — if the type doesn't include `slug`/`yesTokenId`, they won't reach `ContractRow`.

**Fix**: Add `slug?: string` and `yesTokenId?: string` to `ApiContract` in `src/lib/api.ts`.

**Issue 3: Event Indexes still use static `market.liquidity.toFixed(1)M` formatting**
`EventIndexes.tsx` line 107: `${market.liquidity.toFixed(1)}M liq` — doesn't use the updated `formatMillions` function. Live markets with sub-1M liquidity show as `$0.5M liq` instead of `$482K liq`.

**Fix**: Import and use `formatMillions` in `EventIndexes.tsx` MarketRow component.

**Issue 4: `place-order` HMAC auth will always fail against real Polymarket CLOB**
The `place-order` function uses deprecated HMAC signing. Polymarket CLOB v2 requires L1 wallet signature (EIP-712). This means clicking "Confirm Simulation" with credentials will get a 401 from Polymarket, record a `failed` order in history. The simulation STILL records to the `orders` table (in the failed path) so order history works, but the error UX is confusing — the toast says "Polymarket order failed" rather than "This is a simulation — order recorded".

**Fix**: Change the `place-order` function to skip the actual CLOB call entirely and just record the order as `"simulated"` status. Remove the HMAC signing code. Add a `"simulated"` status color (purple/blue) to `STATUS_COLORS` in Settings.

**Issue 5: No `/portfolio` page — saved bundles are invisible after saving**
The user clicks "Save Bundle" in the AI Builder and gets a toast. But there's no page to view saved bundles. There's no link anywhere to see what was saved. The `saved_bundles` table has data but it's never displayed to the user.

**Fix**: Add a "Saved" tab to the AI Builder page that loads and displays saved bundles from the DB. Or add a `/portfolio` route. The AI Builder tab approach is simpler.

**Issue 6: Hero search bar input → builder doesn't auto-submit**
`Index.tsx` passes `?q=` to the builder URL, but `AIBuilder.tsx` never reads `useSearchParams()` to auto-submit that query. Users who type in the hero bar and click "Get Coverage" land on the builder with a blank chat — their query is silently dropped.

**Fix**: Read `?q` from URL search params in `AIBuilder.tsx` and auto-call `handleSubmit` with that value on mount.

---

## Plan: Fix All 6 Issues

### Files to edit:

1. **`supabase/functions/_shared/bundle_engine.ts`** — Add `slug` and `yesTokenId` to `BundleContract` interface and pass them through in `hydrateBundleContracts`.

2. **`src/lib/api.ts`** — Add `slug?: string` and `yesTokenId?: string` to `ApiContract` interface.

3. **`src/pages/EventIndexes.tsx`** — Replace `${market.liquidity.toFixed(1)}M liq` and `${market.volume.toFixed(1)}M vol` with `formatMillions()`.

4. **`supabase/functions/place-order/index.ts`** — Remove HMAC/CLOB call entirely. Just validate, record as `"simulated"` in the orders table, and return success. Clean, honest simulation.

5. **`src/pages/AIBuilder.tsx`** — Add a "Saved" tab (3rd tab alongside "AI Chat" and "News to Hedge") that fetches and displays the user's saved bundles from the DB. Also read `?q` search param on mount and auto-submit it.

6. **`src/pages/Settings.tsx`** — Add `"simulated"` to `STATUS_COLORS` (purple badge).

No DB migrations needed.
