
## Backend API Layer — Plan

### Context
This is a pure frontend React/Vite app with no Supabase connection and no backend. To add a real backend with AI-powered endpoints, we need Supabase (for edge functions). The four endpoints + four modules map cleanly to Supabase Edge Functions.

We'll need to:
1. Connect Supabase (Lovable Cloud) to get edge function hosting + the Lovable AI Gateway key
2. Create four edge functions (one per endpoint, each importing shared module logic)
3. Wire up the frontend to call the new real API instead of the existing mock keyword logic

---

### Architecture

```text
Frontend (React)
    │
    ├── POST /functions/v1/build-hedge   ← replaces parseBundleFromInput() in AIBuilder
    ├── GET  /functions/v1/markets       ← new endpoint for market data
    ├── POST /functions/v1/news-hedge    ← replaces analyzeText() in NewsToHedge
    └── POST /functions/v1/analyze-portfolio  ← new portfolio analysis endpoint

Supabase Edge Functions
    ├── build-hedge/index.ts         ← uses risk_parser + bundle_engine
    ├── markets/index.ts             ← uses market_fetcher
    ├── news-hedge/index.ts          ← uses risk_parser + bundle_engine
    ├── analyze-portfolio/index.ts   ← uses risk_parser + scenario_simulator
    └── _shared/
        ├── risk_parser.ts           ← AI model: extracts risk signals from text
        ├── market_fetcher.ts        ← returns structured market data
        ├── bundle_engine.ts         ← matches risks → hedge bundles
        └── scenario_simulator.ts   ← simulates outcomes, calculates payoffs
```

---

### Shared Modules (`supabase/functions/_shared/`)

**`risk_parser.ts`**
- Calls Lovable AI Gateway (gemini-3-flash-preview) with a structured tool call
- Input: raw text string
- Returns: `{ riskCategory, riskLabel, confidence, keywords[], reasoning }`
- Uses tool calling to get structured JSON output (no markdown parsing)

**`market_fetcher.ts`**
- Returns the full market catalogue as typed objects
- Each market: `{ id, title, probability, liquidity, volume, category, direction, tags }`
- This is the source of truth for the GET /markets endpoint
- Designed for future swap to Polymarket Gamma API

**`bundle_engine.ts`**
- Input: risk category string + optional portfolio sectors
- Logic: scores each HEDGE_BUNDLE by category match + tag overlap + probability weight
- Returns: ranked array of `{ bundle, matchScore, matchReasons[] }`
- Used by both build-hedge and news-hedge

**`scenario_simulator.ts`**
- Input: bundle + coverage amount (USD)
- Logic: for each contract, simulates YES/NO outcome weighted by probability
- Calculates: expected payoff, best case, worst case, hedge cost
- Returns: `{ expectedPayoff, bestCase, worstCase, hedgeCost, coverageRatio, scenarios[] }`

---

### Edge Functions

**`POST /build-hedge`**
```
Body: { prompt: string }
→ risk_parser(prompt) → bundle_engine(riskCategory)
→ { bundle, matchScore, matchReasons, detectedRisk }
```

**`GET /markets`**
```
Query params: ?category=ENERGY&minLiquidity=1
→ market_fetcher.getAllMarkets(filters)
→ { markets: Market[], total: number }
```

**`POST /news-hedge`**
```
Body: { text: string }
→ risk_parser(text) → bundle_engine(riskCategory)
→ { detectedRisk, bundle, confidence, relevantMarkets }
```

**`POST /analyze-portfolio`**
```
Body: { assets: string[], sectors?: string[] }
→ risk_parser(assets.join(", ")) → bundle_engine per risk found
→ scenario_simulator per bundle
→ { riskExposures[], suggestedHedges[], portfolioRiskScore }
```

---

### Frontend Integration

Three files get updated to call the real API:

1. **`src/lib/api.ts`** — new file: typed fetch helpers for all four endpoints, with error handling and loading states
2. **`src/pages/AIBuilder.tsx`** — `handleSubmit` calls `POST /build-hedge` instead of `parseBundleFromInput()`
3. **`src/components/NewsToHedge.tsx`** — `handleAnalyze` calls `POST /news-hedge` instead of `analyzeText()`
4. **`src/pages/Index.tsx`** — new "Analyze Portfolio" entry point using `POST /analyze-portfolio` (minimal hook)

The frontend falls back gracefully with an error toast if the API call fails.

---

### Files Created / Modified

| File | Action |
|---|---|
| `supabase/functions/_shared/risk_parser.ts` | Create |
| `supabase/functions/_shared/market_fetcher.ts` | Create |
| `supabase/functions/_shared/bundle_engine.ts` | Create |
| `supabase/functions/_shared/scenario_simulator.ts` | Create |
| `supabase/functions/build-hedge/index.ts` | Create |
| `supabase/functions/markets/index.ts` | Create |
| `supabase/functions/news-hedge/index.ts` | Create |
| `supabase/functions/analyze-portfolio/index.ts` | Create |
| `supabase/config.toml` | Create |
| `src/lib/api.ts` | Create |
| `src/pages/AIBuilder.tsx` | Edit — wire real API |
| `src/components/NewsToHedge.tsx` | Edit — wire real API |

---

### Key Technical Decisions

- **AI model**: `google/gemini-3-flash-preview` via Lovable AI Gateway, using **tool calling** for structured JSON output (no brittle regex parsing)
- **No new npm packages**: Deno std + native fetch inside edge functions
- **Config**: `verify_jwt = false` on all functions (public API endpoints) with input validation inside each function
- **CORS**: All functions include full CORS headers for browser calls
- **Graceful degradation**: If AI call fails (429/402), functions fall back to the existing keyword-matching logic so the UI never breaks
- **Environment**: `LOVABLE_API_KEY` is auto-provisioned by Lovable Cloud — no manual secret setup needed

---

### Supabase Setup Required
Since this project has no Supabase connection, Lovable Cloud must be enabled first. This is done automatically as part of the implementation — the user will be prompted to connect once during the process.
