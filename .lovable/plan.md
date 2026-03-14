
## Current State Assessment

The backend already has `supabase/functions/_shared/risk_parser.ts` which:
- Calls Lovable AI Gateway with tool calling (structured JSON via `extract_risk`)
- Returns `{ riskCategory, riskLabel, confidence, keywords, reasoning, bundleId }`
- Has full keyword fallback for when AI is unavailable

The request is to **create a dedicated `riskParser` module** with an **expanded output schema** that adds:
- `riskType` — e.g. "commodity shock" (human-readable risk type, not just a category enum)
- `sector` — e.g. "energy" (lowercase sector label)
- `region` — e.g. "middle east" (geographic region extracted from text)
- `keywords` — already exists

This is an **enhancement** of the existing `risk_parser.ts` — the current `ParsedRisk` interface needs expanding with `riskType`, `sector`, and `region` fields. The AI tool call schema also needs these new fields added.

The frontend's `api.ts` `DetectedRisk` interface and any consumers also need updating to surface these new fields.

## Plan

### 1. Expand `supabase/functions/_shared/risk_parser.ts`

Extend `ParsedRisk` interface:
```typescript
export interface ParsedRisk {
  // existing fields
  riskCategory: "ENERGY" | "TECHNOLOGY" | "GEOPOLITICS" | "POLITICS" | "MACRO" | "UNKNOWN";
  riskLabel: string;
  confidence: number;
  keywords: string[];
  reasoning: string;
  bundleId: string;
  // NEW fields
  riskType: string;    // e.g. "commodity shock", "military escalation", "regulatory clampdown"
  sector: string;      // e.g. "energy", "technology", "defense"
  region: string;      // e.g. "middle east", "east asia", "united states", "global"
}
```

Update the AI tool call to add these 3 new fields to the `extract_risk` function schema:
```typescript
riskType: {
  type: "string",
  description: "Specific risk type label e.g. 'commodity shock', 'military escalation', 'regulatory clampdown', 'currency devaluation'"
},
sector: {
  type: "string", 
  description: "Primary economic sector affected e.g. 'energy', 'technology', 'defense', 'finance', 'agriculture'"
},
region: {
  type: "string",
  description: "Primary geographic region e.g. 'middle east', 'east asia', 'united states', 'europe', 'global'"
}
```

Update the keyword fallback (`keywordFallback`) to derive `riskType`, `sector`, and `region` from the existing logic:
- `riskType`: static map from `riskCategory` → default type (e.g. ENERGY → "commodity shock")
- `sector`: lowercase of the `riskCategory` label or a refined map
- `region`: scan for regional keywords in text (e.g. "middle east", "taiwan", "russia", "china", "europe", "us", "global")

### 2. Update `src/lib/api.ts`

Extend `DetectedRisk` interface with the 3 new fields:
```typescript
export interface DetectedRisk {
  // existing...
  riskType: string;
  sector: string;
  region: string;
}
```

### 3. Surface new fields in `src/components/NewsToHedge.tsx`

The `AnalysisResult.detectedRisk` type and the `Detected Risk` card currently show `riskLabel` and `keyword`. Enhance it to also display:
- `riskType` — shown as a sub-label under the main riskLabel
- `sector` — shown as a tag
- `region` — shown as a geographic tag next to sector

The `mapApiResponse` function needs to pass through the new fields from `resp.detectedRisk`.

### Files Changed

| File | Change |
|---|---|
| `supabase/functions/_shared/risk_parser.ts` | Add `riskType`, `sector`, `region` to `ParsedRisk`; extend AI tool schema; update keyword fallback with region scanner and type map |
| `src/lib/api.ts` | Add `riskType`, `sector`, `region` to `DetectedRisk` interface |
| `src/components/NewsToHedge.tsx` | Show `riskType`, `sector`, `region` in Detected Risk card; update `mapApiResponse` |

No new files needed — this is a targeted enhancement to the existing `risk_parser` module and its consumers. No edge function routing changes, no config.toml changes.

### Region Detection Logic (keyword fallback)

```text
Scan lowercased text for geographic markers:
"taiwan" | "strait" | "east asia" | "china" | "japan"  → "east asia"
"middle east" | "iran" | "iraq" | "israel" | "opec"     → "middle east"
"russia" | "ukraine" | "europe" | "nato"                → "europe"
"us" | "united states" | "congress" | "fed" | "election"→ "united states"
"india" | "south asia"                                  → "south asia"
default                                                 → "global"
```

### Risk Type Map (keyword fallback)

```text
ENERGY      → "commodity shock"
TECHNOLOGY  → "regulatory clampdown"
GEOPOLITICS → "military escalation"
POLITICS    → "electoral volatility"
MACRO       → "macroeconomic stress"
```
