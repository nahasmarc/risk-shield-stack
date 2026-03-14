
## Netira — Risk Hedging Dashboard

### Design System Setup
- Update `index.css` with the Netira palette: deep charcoal background (`240 10% 3.9%`), off-white foreground, Signal Blue primary, Amber accent
- Add JetBrains Mono and Geist Sans via Google Fonts import
- Set `--radius` to `4px`, configure Tailwind with `glass-gradient` background utility
- Tailwind config: add `fontFamily.mono` for JetBrains Mono

---

### App Structure & Routing
- `/` → Dashboard (bundle grid)
- `/bundle/:id` → Bundle Detail page
- `/builder` → AI Risk Builder

---

### Mock Data Layer (`src/data/bundles.ts`)
5 pre-built `HedgeBundle` objects with realistic `Contract[]` entries:
1. **Oil Shock Protection** — 4 contracts (oil price spike, OPEC+ cuts, Middle East escalation, Energy sector ETF)
2. **AI Regulation Risk** — 4 contracts (EU AI Act, US AI legislation, model capability freeze, Big Tech antitrust)
3. **Taiwan Conflict** — 4 contracts (China invades Taiwan, US sanctions China, semiconductor disruption, Nvidia revenue decline)
4. **US Election Volatility** — 4 contracts (incumbent loss, contested results, policy reversal, market correction >10%)
5. **Inflation Spike** — 4 contracts (CPI above 5%, Fed rate hike, dollar devaluation, commodities surge)

---

### Components

#### `HedgeCard` (Homepage card)
- `rounded-sm border border-border bg-muted/30` container
- Category badge (small caps, `tracking-widest`, `text-[10px]`)
- Bundle title in Geist Sans
- Amber mono aggregate probability indicator: `AGGREGATE PROBABILITY`
- Market count + description
- "View Bundle →" link button

#### `ContractRow` (Detail page)
- Horizontal probability bar: `bg-accent/20` track, `bg-accent` fill
- Contract title left, probability % right in `font-mono`
- Metadata row: `Liquidity: $1.2M | Volume: $4.5M` in `text-[10px] tracking-widest uppercase`

#### `CoverageCalculator` (Detail page sidebar)
- Input: coverage amount in USD
- Displays: "Cost to Hedge: $XXX" (derived from avg probability × coverage)
- "Execute Hedge" button (Signal Blue, simulated)

#### `ProbabilityGauge` (reusable)
- Thin horizontal bar with amber fill, used in cards and detail

---

### Pages

#### `HomePage` (`/`)
- Sticky top nav: "NETIRA" wordmark + "AI Risk Builder" link
- Status bar: last updated timestamp + "LIVE DATA SIMULATION" badge
- Grid of `HedgeCard` components (2-col on md, 3-col on xl)
- Footer metadata strip

#### `BundleDetailPage` (`/bundle/:id`)
- Left column (2/3): risk scenario header with category + title + description, list of `ContractRow` components with stagger animation
- Right column (1/3): `CoverageCalculator` card + aggregate stats (total liquidity, avg probability)
- "← Back to Dashboard" nav link

#### `AIBuilderPage` (`/builder`)
- Terminal-style layout: output area top, command bar fixed bottom
- Command input: single-line with monospace font, placeholder: "Describe a risk you want to hedge..."
- Mock AI response: parses keywords (oil, AI, Taiwan, inflation, election) → returns matching bundle
- Contracts appear one-by-one with stagger animation (Framer Motion `staggerChildren`)
- "Save as Bundle" CTA once bundle is generated

---

### Animations (Framer Motion)
- Contract rows: `staggerChildren: 0.1` on bundle reveal
- Hover transitions: `cubic-bezier(0.16, 1, 0.3, 1)` 300ms — elements "illuminate" not "pop"
- Page transitions: fade + slight Y translate

---

### No external API calls
All data is mock. Polymarket API integration is stubbed with a `fetchContracts()` placeholder that returns mock data with a comment marking where real API calls go.
