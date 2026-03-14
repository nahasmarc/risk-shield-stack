
## Plan: Modern Fintech Dashboard UI Overhaul

### Scope of changes across 8 files + 1 new component

---

### 1. `src/index.css` — Dark gradient background + glow utilities
- Replace flat `--background` with a radial/mesh gradient that blends deep navy-charcoal
- Add CSS custom properties for category colors: `--energy-color`, `--tech-color`, `--geo-color`, `--politics-color`, `--macro-color`
- Add `.glow-card` hover utility: `box-shadow` with category-colored glow on hover
- Add `.live-signals-panel` gradient for the side panel
- Add Inter as body font weight refinements (300/400/500/600/700 already imported)

### 2. `tailwind.config.ts` — Extended design tokens
- Add `"mesh-bg"` background image (radial gradient overlays)
- Add keyframes: `float` (subtle y-axis drift), `shimmer` (loading shine), `glow-pulse` (ring pulse)
- Add animation classes for the above

### 3. `src/data/bundles.ts` — Enriched category metadata
- Add `CATEGORY_CONFIG` map: `{ ENERGY: { color, icon, gradient }, TECHNOLOGY: {...}, GEOPOLITICS: {...}, POLITICS: {...}, MACRO: {...} }`
  - Energy: `orange (#f97316)`, 🔥 / Flame icon
  - Technology: `purple (#a855f7)`, 🤖 / Cpu icon
  - Geopolitics: `red (#ef4444)`, 🌏 / Globe icon
  - Politics: `blue (#3b82f6)`, 🗳️ / Vote icon
  - Economics/Macro: `green (#22c55e)`, 📈 / TrendingUp icon
- Export a `LIVE_SIGNALS` array of mock probability deltas for the side panel (e.g. `{ contractId, title, change: +3.2, direction: "up" }`)

### 4. `src/components/HedgeCard.tsx` — Elevated card with glow + probability bars
- Add colored top border strip using `categoryColor` (2px, with gradient fade)
- Add category color icon badge (using `CATEGORY_CONFIG` Lucide icon)
- Embed a proper `ProbabilityGauge` bar (height `h-1.5`, thicker, more visible)
- On hover: `translateY(-4px)` + `box-shadow` glow using inline style with `categoryColor`
- Add risk level pill with matching color

### 5. `src/pages/Index.tsx` — Expanded hero + "Build a Hedge" CTA + Live Signals panel
- Hero text: bump to `text-5xl font-bold` with gradient text span
- Add "Build a Hedge →" button (primary, links to `/builder`) below the description
- Add a 3-column stat bar below hero: "5 Bundles Active | $142M Total Liquidity | Avg Coverage 27%"
- Wrap main content in a `flex` layout with the `LiveSignalsPanel` component in the right sidebar (hidden on mobile, shown `xl:block` as a fixed-width `w-72` column)
- Grid adjusts to 2 columns max when sidebar is present

### 6. New `src/components/LiveSignalsPanel.tsx` — Real-time signals side panel
- Sticky panel, `glass-card` background
- Header: "LIVE EVENT SIGNALS" + pulsing green dot
- List of 6-8 mock signals showing:
  - Contract short title
  - Probability change `+2.1%` (green) or `-1.4%` (red)
  - Category color dot
  - Sparkline-style mini bar (simple CSS, no chart lib)
- Refresh animation: each item fades in/out on a staggered timer (using `useEffect` with intervals, simulating live ticks)
- "UPDATING LIVE" footer badge

### 7. `src/pages/AIBuilder.tsx` — Modern chat interface redesign
- Replace terminal-style header with a clean chat UI header (avatar + name + status)
- Add **suggestion chips** row at top of chat input area:
  - "🛢️ Oil price spike" | "🤖 AI regulation" | "🌏 Taiwan conflict" | "🗳️ US election" | "📈 Inflation surge"
  - Clicking a chip pre-fills and submits the input
- Style system messages as assistant bubbles with a small icon avatar (BrainCircuit in a colored circle)
- Style user messages as right-aligned bubbles with a subtle gradient
- Add typing indicator (3 animated dots) replacing the Loader2 spinner
- Improve bundle output card: add category color top border, hover glow, cleaner layout

### 8. `src/components/Navigation.tsx` — Polished nav
- Add Inter font weight refinements + subtle gradient underline for active route
- Add a "BETA" pill badge next to AI BUILDER link

### 9. `src/components/ProbabilityGauge.tsx` — Visual upgrade
- Increase bar height to `h-2` for `md` size, `h-1.5` for `sm`
- Add gradient fill: left-to-right from category color to brighter variant
- Show percentage with a slightly larger mono number

---

### Implementation order
1. `tailwind.config.ts` + `index.css` (foundation)
2. `bundles.ts` (data additions)
3. `ProbabilityGauge.tsx` + `HedgeCard.tsx` (core card improvements)
4. New `LiveSignalsPanel.tsx`
5. `Index.tsx` (hero + layout with signals)
6. `AIBuilder.tsx` (chat redesign)
7. `Navigation.tsx` (polish)

---

### Technical notes (internal)
- No new npm packages needed — Framer Motion + Lucide already installed
- `LiveSignalsPanel` uses `useState` + `useEffect` with `setInterval` to simulate live ticks (probability ±0.5–3.0% random walk every 4 seconds)
- Category colors injected via inline `style` props to keep them dynamic (not hardcoded in Tailwind classes)
- Glow effect on cards done via inline `style` on the `whileHover` Framer Motion variant (avoids Tailwind purge issues with dynamic colors)
- Live Signals panel is `sticky top-[4.5rem]` so it stays visible while scrolling the bundle grid
