
## Complete UI Redesign: Dark Terminal → Modern Consumer Product

### Scope
Full light-theme overhaul across 9 files. No new dependencies needed. All changes are CSS variable, Tailwind config, and component-level.

---

### 1. `tailwind.config.ts`
- Change `--radius` to `16px` (large rounded corners throughout)
- `borderRadius`: `lg: "var(--radius)"` → evaluates to 16px, `md: 12px`, `sm: 10px`
- Keep existing keyframes, add no new ones

### 2. `src/index.css` — Full light theme token swap
Replace all dark HSL tokens with light equivalents:
- `--background: 210 20% 98%` (~#F8FAFC)
- `--foreground: 220 20% 12%` (near-black)
- `--card: 0 0% 100%` (pure white cards)
- `--card-foreground: 220 20% 12%`
- `--muted: 210 16% 96%` (very light grey)
- `--muted-foreground: 215 14% 48%`
- `--border: 214 20% 90%` (soft light border)
- `--input: 214 20% 90%`
- `--primary: 221 83% 53%` (vibrant blue, Stripe-like)
- `--secondary: 210 16% 96%`
- `--accent: 24 100% 50%` (keep orange as accent)
- `--radius: 16px`
- Remove all dark `glass-card`, `glass-gradient`, `signals-panel-bg` utilities — replace with light equivalents:
  - `.card-light`: `background: white; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border-radius: 16px`
  - `.glow-card`: update to lift shadow on hover
  - `.signals-panel-bg`: white with soft shadow
  - `.mesh-hero`: update gradient overlays to be very light pastels
- Update scrollbar to light colours
- Keep `typing-dot` animation (still needed for AI builder)
- Body background: `#F8FAFC` with very subtle radial gradients (5% opacity blues/purples)

### 3. `src/components/Navigation.tsx`
- White nav bar with `shadow-sm` instead of dark bg
- Logo: colored gradient circle instead of dark badge
- Nav links: pill-shaped, blue active state, grey inactive
- Remove LIVE SIM indicator or make it a subtle green pill
- Remove mono font from nav text — use Inter `font-medium`
- Add BETA badge as a coloured pill next to AI Builder

### 4. `src/components/HedgeCard.tsx`
- Replace `glass-card rounded-sm` with `bg-white rounded-2xl shadow-md hover:shadow-xl`
- Remove dark top border strip; replace with a full gradient header section (32px tall, category gradient as background)
- Icon badge: white circle with colored icon on the gradient header
- Card body padding: `p-6`
- Title: `text-gray-900 text-lg font-semibold`
- Description: `text-gray-500 text-sm`
- Risk pill: soft rounded pill with light background
- Footer "View Bundle": blue text link with arrow, no hard border-top — just `mt-auto pt-4`
- Hover: `whileHover={{ y: -6, transition: {duration: 0.2} }}` + shadow elevation via `onMouseEnter`/`onMouseLeave`
- Remove all `font-mono` and `tracking-widest uppercase` from category labels — use normal Inter text

### 5. `src/components/ProbabilityGauge.tsx`
- Track background: `bg-gray-100` (light)
- Bar height: `h-2` for md, `h-1.5` for sm
- Label: `text-gray-500 text-sm` not mono uppercase
- Value: colored bold number, larger `text-sm font-bold`
- Animate on mount with spring transition (already exists)

### 6. `src/pages/Index.tsx`
**Hero section:**
- Remove Status Bar (the dark ticker strip at top)
- Hero: large centered layout with max-w-4xl
- Headline: `text-5xl font-bold text-gray-900` with gradient span
  - "Hedge Real-World Risks with AI-Built Event Portfolios"
- Below headline: large rounded search/input bar (like Google/Airbnb hero search)
  - Full width, `rounded-2xl`, soft shadow, placeholder "Describe a risk you want to hedge..."
  - "Build a Hedge →" button inside the input on the right
- Stats bar: 4 cards with white backgrounds, soft shadows, large numbers
- Section title: `text-lg font-semibold text-gray-900` not mono uppercase

**Layout:**
- Bundle grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` (can go 3 col now on xl since cards are lighter)
- Keep Live Signals sidebar but restyle to white card

**Footer:**
- Clean white footer, normal text weight

### 7. `src/components/LiveSignalsPanel.tsx`
- Replace `signals-panel-bg` with `bg-white rounded-2xl shadow-md`
- Header: colored icon, normal Inter text, green dot
- Signal rows: clean with category dot colour, larger text
- Mini bar track: `bg-gray-100`
- Timestamps: `text-gray-400`
- Remove `font-mono tracking-widest uppercase` everywhere

### 8. `src/pages/BundleDetail.tsx`
- Header card: white bg, category gradient as a top accent bar (4px), `rounded-2xl shadow-md p-8`
- Tags: soft coloured pills
- Stats strip: white cards with soft shadows
- Contract rows: white rounded cards with soft shadow instead of dark bordered rows
- Back link: normal Inter text, not mono uppercase
- Disclaimer: soft blue/grey info box

### 9. `src/components/ContractRow.tsx`
- Replace dark border style with white card + soft shadow
- Probability bar: `h-2`, `bg-gray-100` track, coloured fill
- Text: normal Inter, not all-caps mono
- Metadata: `text-gray-400 text-xs`

### 10. `src/components/CoverageCalculator.tsx`
- Replace `glass-card` with `bg-white rounded-2xl shadow-md p-6`
- Input: large rounded-xl, white bg, light border
- Cost display: large, coloured, modern
- Button: large full-width `rounded-xl` with gradient, not flat mono font
- Stats mini-cards: `bg-gray-50 rounded-xl`

### 11. `src/pages/AIBuilder.tsx`
- Page header: clean white bar (or remove, just use nav)
- Message area: `bg-gray-50` background
- User bubbles: blue gradient, `rounded-2xl rounded-br-md`, white text
- Assistant bubbles: white, `rounded-2xl rounded-bl-md`, soft shadow
- Assistant avatar: colored gradient circle with BrainCircuit icon
- Suggestion chips: white pill buttons with coloured emoji, soft shadow on hover, `rounded-full`
- Input bar: white `rounded-2xl shadow-lg` floating bar with large padding
- Send button: blue gradient circle button
- Remove ALL mono/uppercase/tracking-widest from chat UI
- Typing indicator: inside a white bubble

---

### Key Design Principles Applied
- `rounded-2xl` (16px) everywhere on cards, `rounded-full` on pills/chips/buttons
- `shadow-[0_4px_24px_rgba(0,0,0,0.06)]` base card shadow, `shadow-[0_12px_40px_rgba(0,0,0,0.12)]` on hover
- White cards on `#F8FAFC` background
- Category colours kept intact (orange, purple, red, blue, green) but used as accents/gradients on light surfaces
- Inter font used everywhere for body; mono font removed from UI labels
- Generous padding: `p-6` to `p-8` on cards
- No hard borders (replace with shadows)
- Framer Motion hover lifts: `y: -6` with shadow increase
