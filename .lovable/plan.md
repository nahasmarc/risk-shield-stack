
## Airbnb-Style Color System Redesign

### What changes and why

The request is purely a **color/styling system update** — not a layout overhaul. The existing architecture (components, routing, logic) stays intact. We're replacing:
- Saturated gradient card headers → white cards with thin pastel accent bars
- Blue primary (`hsl(221 83% 53%)`) → Airbnb coral-red (`#FF385C` = `hsl(348 100% 59%`)
- Saturated category colors → soft pastels
- Heavy gradient fills → subtle icon badges + thin top accent bars
- Button styles → pill-shaped, Airbnb-red

---

### Files to change (7 total)

**1. `src/index.css`**
- `--background`: change to `0 0% 97%` (#F7F7F7)
- `--primary`: change to `348 100% 59%` (#FF385C)
- `--ring`: follow primary
- Category color tokens: swap to pastel versions
  - `--color-energy: 38 97% 72%` (#FDBA74 — warm amber)
  - `--color-technology: 258 89% 86%` (#C4B5FD — soft violet)
  - `--color-geopolitics: 0 93% 82%` (#FCA5A5 — soft red)
  - `--color-politics: 214 95% 78%` (#93C5FD — sky blue)
  - `--color-macro: 142 77% 73%` (#86EFAC — soft green)
- Remove all `background-image` radial gradients from `body` (keep it clean flat #F7F7F7)
- Update `--sidebar-primary` to match new primary

**2. `tailwind.config.ts`**
- Add the Airbnb primary as a named token: `airbnb: "hsl(var(--primary))"` (no-op if already mapped)
- No structural changes, just ensure `--primary` change flows through

**3. `src/data/bundles.ts`**
- Update `categoryColor` fields in `HEDGE_BUNDLES` array to use pastel hex values
- Update `CATEGORY_CONFIG` gradients — replace saturated gradients with very light pastel backgrounds:
  - ENERGY gradient: `linear-gradient(135deg, #FFF7ED, #FFEDD5)` (warm cream)
  - TECHNOLOGY: `linear-gradient(135deg, #F5F3FF, #EDE9FE)`
  - GEOPOLITICS: `linear-gradient(135deg, #FFF1F2, #FFE4E6)`
  - POLITICS: `linear-gradient(135deg, #EFF6FF, #DBEAFE)`
  - MACRO: `linear-gradient(135deg, #F0FDF4, #DCFCE7)`
- Update `LIVE_SIGNALS_BASE` `categoryColor` to pastel hex values
- Update `RISK_LEVEL_CONFIG` to use softer colors (still readable)

**4. `src/components/HedgeCard.tsx`**
- Replace the tall `h-[88px]` gradient header div with:
  - A thin 4px top accent bar (`border-t-[4px]` or a small div `h-1`) using pastel category color
  - An icon badge in the card body (small circle with pastel bg + colored icon), not white-on-gradient
- Icon badge: `w-10 h-10 rounded-2xl` with pastel background, icon in the category's deeper color
- Risk pill: soft pastel bg, dark text, no white-on-gradient
- Category label: small, normal weight, colored with pastel-adjacent darker tone
- "View Bundle" link: use `text-primary` (#FF385C)
- Hover shadow: neutral (`rgba(0,0,0,0.08)`) — no colored glow

**5. `src/components/Navigation.tsx`**
- Active nav pill: `bg-primary text-white` (now Airbnb red)
- Logo gradient: update to `#FF385C` tones
- BETA badge: switch from `bg-accent` (orange) to `bg-primary/10 text-primary`

**6. `src/components/CoverageCalculator.tsx`**
- "Execute Hedge" button: update inline gradient style to use `#FF385C` → `#E31C5F`
- Cost display: update `text-primary` will auto-update to red

**7. `src/components/ContractRow.tsx`**
- `getBarColor`: replace the three HSL colors with more neutral/Airbnb-aligned tones
  - High (≥60%): `hsl(0 93% 60%)` (pastel red, more readable)
  - Mid (≥35%): `hsl(214 95% 52%)` (Airbnb-blue-ish for mid)
  - Low: `hsl(142 52% 47%)` (soft green)

**8. `src/pages/BundleDetail.tsx`**
- Replace the `h-[100px]` saturated gradient header with:
  - Thin 4px top accent bar
  - Icon badge with pastel bg (same as HedgeCard treatment)
- Tags: keep existing muted pill style (already looks clean)
- Disclaimer: already uses `bg-primary/5 border-primary/15` — will auto-update to red tone

**9. `src/components/LiveSignalsPanel.tsx`** 
- Category dot colors in `SignalRow` come from `signal.categoryColor` which flows from `LIVE_SIGNALS_BASE` — will auto-update when we fix bundles.ts
- The mini bars also use `categoryColor` — will be pastel after data update
- No structural changes needed

---

### Key design decisions
- **No colored gradient blocks** anywhere — replaced with pastel backgrounds (5-10% saturation) or thin accent bars
- **Single brand color** (#FF385C) for all interactive elements: buttons, links, active states
- **Pastel category accents** used only for: icon badge backgrounds, thin accent bars, probability bar fills
- All text stays dark on light — no white-on-color text in body content
- Cards stay white with `shadow-[0_1px_3px_rgba(0,0,0,0.04),_0_4px_16px_rgba(0,0,0,0.06)]`
- Background stays clean `#F7F7F7` with no gradient overlays

### Implementation order
1. `src/index.css` + `src/data/bundles.ts` (tokens + data colors)
2. `src/components/HedgeCard.tsx` + `src/pages/BundleDetail.tsx` (remove gradient headers, add accent bars)
3. `src/components/Navigation.tsx` (brand color)
4. `src/components/CoverageCalculator.tsx` + `src/components/ContractRow.tsx` (button + bars)
5. LiveSignalsPanel auto-updates from data layer — verify only
