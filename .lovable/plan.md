
## Full Honest Audit — What's Working vs What Needs Fixing

### Confirmed Working ✅
- **Live Polymarket data**: 60 real markets from 731 raw fetched via Gamma API (`dataSource: live` confirmed)
- **build-hedge endpoint**: Works perfectly — returns real live contracts (e.g. "Will Crude Oil (CL) hit $100 by end of March?") with real probabilities from Gamma API
- **AI risk parsing**: Gemini correctly identifies risk category with 100% confidence, maps to correct bundle
- **AIBuilder.tsx**: Now correctly uses live contracts from the API response (the previous gap has been fixed)
- **ContractRow**: External links to Polymarket working for live markets
- **Navigation**: Shows correct "X markets" label
- **Settings + auth + order history**: Fully functional
- **Event Indexes**: Wired to live data with Live/Mock badge

---

### Real Remaining Gaps

**Gap 1: Polymarket URL is wrong — uses market ID, not slug**
`ContractRow` builds `https://polymarket.com/market/567621`. Polymarket's actual URL format is `https://polymarket.com/event/{slug}` or `https://polymarket.com/market/{slug}`. Numeric IDs don't resolve to valid pages. To get the correct clickable link, the Gamma API response needs the `slug` field. It does provide one — `polymarket_service.ts` just isn't extracting it. Fix: fetch and pass `slug` from the Gamma API response so links work correctly.

**Gap 2: CLOB place-order always fails — tokenId is wrong**
`CoverageCalculator.tsx` sends `tokenId: primaryContract.id` which is a Gamma market ID like `"567621"`. The Polymarket CLOB API needs a 256-bit token ID like `"0x1234...abcd"`. The Gamma API DOES return token IDs in the `tokens` array (field: `token_id`). Fix: store the YES token_id from the Gamma API alongside the contract and use it in `place-order`.

**Gap 3: Too many near-identical contracts in a bundle**
The oil-shock bundle returns 8 contracts all asking "Will Crude Oil hit $X by end of March?" — these are essentially the same market at different strike prices. The bundle should be deduplicated/limited to the top 4-5 most liquid and most meaningful contracts. This makes the bundle display useful instead of repetitive.

**Gap 4: No portfolio persistence — "Save Bundle" is localStorage only**
`handleSave` in `AIBuilder.tsx` only adds the bundle ID to a local React state array (`savedBundles`). There's no database table for saved bundles. If the user refreshes, they lose everything. Need a `saved_bundles` table in the backend.

**Gap 5: Login page has no Google OAuth UI**
The `/login` route exists but we should confirm it has a working sign-in button. Let me check this briefly.

**Gap 6: `place-order` function uses deprecated HMAC signing**
Polymarket's CLOB API no longer supports simple HMAC-SHA256 key signing for retail accounts. It now requires L1 (Ethereum wallet) or L2 signing via EIP-712. The current implementation will always fail with an authentication error for real trades. This is a fundamental limitation — real on-chain trading requires a crypto wallet integration (MetaMask/WalletConnect). The paper trade simulation is the correct approach for now, and the UI should make this crystal clear.

---

## Plan

### Priority 1: Fix the Polymarket deep links (slug extraction)

**`supabase/functions/_shared/polymarket_service.ts`** — add `slug` to `GammaMarket` interface, pass it through `normaliseMarket`, and include it in the returned `Market`.

**`supabase/functions/_shared/market_fetcher.ts`** — add `slug?: string` to the `Market` interface.

**`src/data/bundles.ts`** — add optional `slug?: string` to `Contract` type.

**`src/components/ContractRow.tsx`** — change the link to use slug when available: `https://polymarket.com/market/{slug}`.

### Priority 2: Fix bundle deduplication (oil strike price spam)

**`supabase/functions/_shared/polymarket_service.ts`** — after classifying markets, group markets whose titles share the same pattern (same question, different number) and keep only the 1 most liquid variant. Cap any single bundle to 6 contracts max, sorted by liquidity desc.

### Priority 3: Persist saved bundles to database

**New migration** — `saved_bundles` table with `user_id`, `bundle_id`, `bundle_title`, `created_at`, and RLS policies.

**`src/pages/AIBuilder.tsx`** — replace localStorage state with `supabase.from("saved_bundles").insert()` and fetch on mount.

### Priority 4: Make paper trade status crystal clear

**`src/components/CoverageCalculator.tsx`** — rename "Execute Hedge" button to "Simulate Hedge" and show a prominent "Paper Trade Only" banner at the top of the calculator, not buried in the confirmation dialog. Real trading requires wallet connection (outside current scope).

### Files to edit:
1. `supabase/functions/_shared/polymarket_service.ts` — add slug, add dedup logic
2. `supabase/functions/_shared/market_fetcher.ts` — add slug to Market interface
3. `src/data/bundles.ts` — add slug to Contract type
4. `src/components/ContractRow.tsx` — use slug for correct Polymarket links
5. `src/pages/AIBuilder.tsx` — persist saved bundles to DB
6. `src/components/CoverageCalculator.tsx` — paper trade UI clarity
7. New migration for `saved_bundles` table
