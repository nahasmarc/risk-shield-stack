
## EventRiskMap Component

### What we're building
A self-contained visual node graph showing how global events cascade into downstream risks. Built entirely with SVG + React + Framer Motion — no new dependencies needed.

### Data model (new file: `src/data/riskGraph.ts`)
Define the cascade chains as static data:

```text
CHAIN 1: Middle East Conflict → Oil Supply Shock → Inflation Spike → Rate Hikes → Stock Decline
CHAIN 2: Taiwan Crisis → Semiconductor Shortage → Tech Sector Collapse → Market Volatility
CHAIN 3: US Election Volatility → Policy Reversal → Dollar Weakness → Inflation Spike
```

Each node has:
- `id`, `label`, `probability`, `category` (maps to CATEGORY_CONFIG pastel)
- `bundleIds[]` — which HEDGE_BUNDLES cover this event
- `x`, `y` — fixed pixel positions within a ~900×400 viewBox

Edges: `{ from: nodeId, to: nodeId }`

### Layout (fixed positions in SVG viewBox 920×420)
```text
Col 1 (x=80)    Col 2 (x=270)    Col 3 (x=460)    Col 4 (x=650)    Col 5 (x=840)
─────────────────────────────────────────────────────────────────────────────────
Middle East      Oil Supply        Inflation         Rate Hikes        Stock Decline
Conflict (GEO)   Shock (ENERGY)    Spike (MACRO)     (MACRO)           (MACRO)
                                                                       
Taiwan Crisis    Semi Shortage     Tech Collapse     Market            [shares Market Volatility]
(GEO)            (TECH)            (TECH)            Volatility(MACRO)

US Election      Policy            Dollar
Volatility(POL)  Reversal(POL)     Weakness(MACRO) → → → → (to Inflation Spike)
```

Nodes are arranged in 3 horizontal chains. Dollar Weakness has an edge to Inflation Spike (cross-chain merge).

### Component: `src/components/EventRiskMap.tsx`
- SVG-based, full-width responsive container with `viewBox="0 0 920 460"`
- Curved arrows: SVG `<path>` using cubic bezier `M x1,y1 C cx1,cy1 cx2,cy2 x2,y2` with arrowhead `<marker>`
- Each node: a `<foreignObject>` containing a `div` — white card, rounded-2xl, 4px left pastel border, 120×68px
  - Shows: category icon (12px), event label (12px bold), probability pill
- `selectedNode` state: when clicked, expands a panel below the SVG
  - Panel shows: "Related Hedge Bundles" with mini cards linking to `/bundle/:id`
  - Animated with Framer Motion `AnimatePresence` + `motion.div` slide-down
- Arrows animate on mount with `strokeDasharray`/`strokeDashoffset` draw-on effect
- Node hover: ring pulse using `whileHover={{ scale: 1.04 }}`
- Active/selected node: highlighted ring in category color

### Integration: `src/pages/Index.tsx`
- Add `import { EventRiskMap } from "@/components/EventRiskMap"`
- Insert new section between the stats bar and the bundle grid:
```jsx
{/* Event Risk Network */}
<section className="max-w-7xl mx-auto px-6 pb-10">
  <div className="mb-5 flex items-center justify-between">
    <h2 className="text-lg font-semibold text-foreground">Event Risk Network</h2>
    <span className="text-sm text-muted-foreground">Click a node to see hedge bundles</span>
  </div>
  <EventRiskMap />
</section>
```

### Files changed
1. **New**: `src/data/riskGraph.ts` — node/edge data with bundle mappings
2. **New**: `src/components/EventRiskMap.tsx` — the full component
3. **Edit**: `src/pages/Index.tsx` — add the section between stats and bundle grid

### Key technical decisions
- **No new npm packages**: SVG + foreignObject for node cards, Framer Motion for animations (already installed)
- **Curved arrows**: cubic bezier paths with control points at midpoint X ± 30px to get a gentle S-curve
- **Responsive**: outer div is `w-full overflow-x-auto`, SVG uses fixed viewBox → scales down on mobile
- **Bundle panel**: shows at most 2 matching bundles per node, with a "View Bundle →" link
- Probability displayed as `28%` inside a pastel pill matching category color
