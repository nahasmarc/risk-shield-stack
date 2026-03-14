
## Plan: Hedge Effectiveness Score Component

### What we're building
A new `HedgeEffectivenessScore` component that calculates and displays a composite score for how well a bundle covers its underlying risks. It sits in the right column of `BundleDetail.tsx`, above the CoverageCalculator.

---

### Score Calculation Logic (pure functions in `src/data/bundles.ts`)

Three sub-scores derived from existing contract data:

**1. Correlation Coverage** (0–100)
- How many unique risk categories are represented across the bundle's contracts
- More categories = better correlation spread
- Formula: `(uniqueCategories / 4) * 100`, clamped to 100
- e.g. oil-shock has ENERGY, ENERGY, GEOPOLITICS, MARKETS → 3 unique → 75%

**2. Market Liquidity Score** (0–100)
- Avg liquidity per contract normalized against a $10M "excellent" benchmark
- Formula: `Math.min((avgLiquidity / 10) * 100, 100)`
- e.g. avg liquidity $4.1M → score 41%

**3. Scenario Coverage** (0–100)
- Probability spread: measures how well probabilities are distributed (not all clustered at the same value)
- Based on avg probability weighted by number of contracts
- Formula: `Math.min(avgProbability * 1.8, 100)` — higher avg probability = more realistic scenario coverage
- e.g. avgProb 31% → 56%

**Composite Score**:
```
score = Math.round(correlationCoverage * 0.35 + liquidityScore * 0.30 + scenarioCoverage * 0.35)
```

Add `calculateEffectivenessScore(bundle)` returning `{ score, correlation, liquidity, scenario }` to `src/data/bundles.ts`.

---

### New component: `src/components/HedgeEffectivenessScore.tsx`

**Layout**: White card, `rounded-2xl`, same shadow as the other sidebar cards.

**Top section — SVG circular progress ring**:
- SVG `viewBox="0 0 120 120"`, 110px rendered
- Two circles: track ring (gray, `stroke-width 10`) + animated progress arc
- Arc uses `strokeDasharray` / `strokeDashoffset` animated with Framer Motion `useMotionValue` + `animate`
- Color: dynamic — green if ≥75, amber if ≥55, red/coral below
- Center text: large bold score `82`, small label `/ 100` below, tiny `"Coverage Score"` label
- Thin category-colored tick mark at the arc tip

**Score label row** below ring:
- `"Hedge Coverage Score"` — `text-sm font-semibold text-foreground`
- Descriptor pill: `"Strong"` / `"Moderate"` / `"Partial"` with matching pastel bg

**Three sub-indicator rows** (each):
```
[icon] Correlation Coverage    [bar] [value %]
[icon] Market Liquidity        [bar] [value %]
[icon] Scenario Coverage       [bar] [value %]
```
- Bar: `h-2 rounded-full bg-gray-100` track, animated fill in the descriptor color
- Icons: `GitBranch`, `Droplets`, `LayoutGrid` from lucide-react (12px)
- Each row has a tooltip-style `text-xs text-muted-foreground` description on the second line

**Animation**: On mount, all bars and the ring animate from 0 to their values over 1.2s with an easing curve using Framer Motion.

---

### Files to change

1. **`src/data/bundles.ts`** — add `calculateEffectivenessScore()` export function
2. **New `src/components/HedgeEffectivenessScore.tsx`** — the full component
3. **`src/pages/BundleDetail.tsx`** — import and insert the new component as the first card in the right column (before `CoverageCalculator`)

### Placement in BundleDetail right column
```text
Right column (top to bottom):
  ┌─────────────────────────┐  ← NEW: HedgeEffectivenessScore
  │  ◯ 82  Coverage Score   │
  │  ▓▓▓▓▓░ Correlation 75% │
  │  ▓▓▓░░░ Liquidity   41% │
  │  ▓▓▓▓░░ Scenario    56% │
  └─────────────────────────┘
  ┌─────────────────────────┐  ← existing CoverageCalculator
  └─────────────────────────┘
  ┌─────────────────────────┐  ← existing Bundle Info
  └─────────────────────────┘
```

The component receives `bundle: HedgeBundle` as its only prop and is entirely self-contained.
