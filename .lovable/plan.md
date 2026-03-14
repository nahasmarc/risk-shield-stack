
## Polymarket Service — Plan

### What exists today
- `supabase/functions/_shared/market_fetcher.ts` — hardcoded `MOCK_MARKETS` array with 20 markets. The file even has a TODO comment pointing to `https://gamma-api.polymarket.com/markets?search=${query}`.
- `bundle_engine.ts` imports `getAllMarkets()` and `getMarketsByBundle()` from `market_fetcher.ts` synchronously.
- All four edge functions rely on these synchronous calls.

### What needs to change
The existing sync interface (`getAllMarkets`, `getMarketsByBundle`, `getMarketById`) must stay intact — the bundle engine and edge functions depend on it. The solution is to make `market_fetcher.ts` async-aware internally, with the Polymarket fetch happening at load time and cached in memory, while still exporting the same synchronous API backed by cached data.

---

### Architecture

```text
polymarket_service.ts           ← NEW: fetches from Gamma API, caches in memory
    │
    └─ fetchAndCacheMarkets()   ← called once on first use (lazy init)
       ├─ GET /markets?active=true&closed=false&limit=100&order=volume&ascending=false
       ├─ Normalise PolymarketMarket → Market (our internal shape)
       ├─ Auto-classify into bundleIds using keyword → bundle map
       └─ Store in module-level cache (TTL: 5 minutes)

market_fetcher.ts               ← UPDATED: getAllMarkets() calls polymarket_service
    ├─ await ensureCache()      ← triggers lazy fetch on first call
    └─ filter/return from cache (same external interface, now async)

bundle_engine.ts                ← UPDATED: hydrateBundleContracts() now async
    └─ await getAllMarkets()

Edge functions                  ← UPDATED: await all calls that were sync
    ├─ build-hedge/index.ts
    ├─ news-hedge/index.ts
    ├─ markets/index.ts
    └─ analyze-portfolio/index.ts
```

---

### Polymarket Gamma API Details
- Base URL: `https://gamma-api.polymarket.com`
- **No auth required** — completely public
- Endpoint: `GET /markets?active=true&closed=false&limit=100&order=volume&ascending=false`
- Key response fields to map:
  - `id` → `id`
  - `question` → `title`
  - `outcomePrices` → parse JSON array `["0.28","0.72"]` → `probability` (first outcome × 100)
  - `liquidityNum` → `liquidity` (divide by 1,000,000 for USD millions)
  - `volumeNum` → `volume` (divide by 1,000,000 for USD millions)
  - `tags` → array of tag objects with `label` field → `tags[]`
  - `active` → filter to only include `active: true`

---

### New File: `supabase/functions/_shared/polymarket_service.ts`

Responsibilities:
1. **Fetch** — calls `GET /markets` on the Gamma API with `active=true`, `closed=false`, `limit=100`, ordered by volume
2. **Normalise** — maps raw Gamma fields to the internal `Market` shape; parses `outcomePrices` JSON string, converts raw USDC values to USD millions
3. **Classify** — auto-assigns `bundleIds` by matching market tags/question text against a keyword→bundleId map (same logic as the existing `KEYWORD_MAP` in `risk_parser.ts`)
4. **Cache** — stores result in a module-level object with a `fetchedAt` timestamp; TTL is 5 minutes; subsequent calls return the cache if fresh
5. **Fallback** — if the Gamma API fetch fails (network error, non-200), logs a warning and returns the existing `MOCK_MARKETS` so the system never breaks

Exported functions:
```typescript
export async function getPolymarkets(filter?: MarketsFilter): Promise<Market[]>
export async function getPolymarketsByBundle(bundleId: string): Promise<Market[]>
export async function getPolymarketById(id: string): Promise<Market | undefined>
export function getCacheStatus(): { size: number; fetchedAt: Date | null; source: "live" | "mock" }
```

---

### Updated Files

| File | Change |
|---|---|
| `supabase/functions/_shared/polymarket_service.ts` | **Create** — fetch, normalise, cache |
| `supabase/functions/_shared/market_fetcher.ts` | **Update** — `getAllMarkets` becomes `async`, delegates to `polymarket_service`; keeps same exported interface |
| `supabase/functions/_shared/bundle_engine.ts` | **Update** — `hydrateBundleContracts` and `matchBundle` / `getBestBundle` become `async` |
| `supabase/functions/build-hedge/index.ts` | **Update** — `await getBestBundle(...)` |
| `supabase/functions/news-hedge/index.ts` | **Update** — `await getBestBundle(...)`, `await getMarketsByBundle(...)` |
| `supabase/functions/markets/index.ts` | **Update** — `await getAllMarkets(filter)` |
| `supabase/functions/analyze-portfolio/index.ts` | **Update** — `await matchBundle(...)` |

No frontend changes needed. No new npm packages. No secrets required — the Gamma API is public.

---

### Cache Strategy
```text
Module-level in Deno edge function:
  let cache: Market[] = []
  let cacheSource: "live" | "mock" = "mock"
  let fetchedAt: Date | null = null
  const TTL_MS = 5 * 60 * 1000   ← 5 minutes

On each request:
  if (cache.length > 0 && Date.now() - fetchedAt < TTL_MS) → return cache
  else → fetch from Gamma API → normalise → store in cache → return
```

Deno edge functions are warm between requests (same isolate reused), so the 5-minute in-memory cache meaningfully reduces API calls to Polymarket.

---

### Keyword → Bundle Classification
When normalising Gamma API markets, each market's `question` text and `tags` array are scanned against this map to assign `bundleIds`:

```text
"oil" | "opec" | "crude" | "petroleum"  → "oil-shock"
"ai" | "artificial intelligence" | "regulation" | "openai" | "llm"  → "ai-regulation"
"taiwan" | "china" | "semiconductor" | "chip" | "nvidia"  → "taiwan-conflict"
"election" | "midterm" | "congress" | "vote" | "democrat" | "republican"  → "us-election-volatility"
"inflation" | "cpi" | "fed" | "federal reserve" | "interest rate" | "tariff"  → "inflation-spike"
```

A market can be assigned to multiple bundles if multiple keywords match.
