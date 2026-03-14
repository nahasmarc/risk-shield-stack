
## Full Rebrand: Netira → PolyBumble + Blue/Black/White Fintech Palette

### Scope of Changes

**6 files** need editing, touching every layer of the stack (CSS vars, component text, metadata, data layer).

---

### 1. `src/index.css` — New Color System

Replace all CSS custom properties:

```
--primary: 348 100% 59%  →  221 89% 54%    (#2563EB)
--ring: same             →  221 89% 54%
--background: 0 0% 97%  →  0 0% 100%      (#FFFFFF)
--card: 0 0% 100%       →  0 0% 100%      (stays white)
--foreground: 220 20% 12% → 215 28% 9%    (#0F172A)
--muted: 210 16% 96%    →  210 40% 98%    (#F8FAFC)
--muted-foreground      →  215 16% 47%    (#475569)
--border: 214 20% 90%   →  214 32% 91%    (#E2E8F0)
--accent: 24 100% 50%   →  221 89% 54%    (blue, not orange)
```

Update category color tokens:
```
--color-energy:      213 93% 68%    (#60A5FA)
--color-technology:  239 84% 67%    (#6366F1)
--color-geopolitics: 217 91% 60%    (#3B82F6)
--color-politics:    221 89% 54%    (#2563EB)
--color-macro:       158 64% 52%    (#10B981)
```

Update scrollbar hover from red to blue. Update `card-surface` shadow to `0 10px 30px rgba(0,0,0,0.06)`.

---

### 2. `src/data/bundles.ts` — Category Colors

Update `CATEGORY_CONFIG` hex values to new blue-based palette:

| Category | Old hex | New hex |
|---|---|---|
| ENERGY | `#FDBA74` | `#60A5FA` |
| TECHNOLOGY | `#C4B5FD` | `#6366F1` |
| GEOPOLITICS | `#FCA5A5` | `#3B82F6` |
| POLITICS | `#93C5FD` | `#2563EB` |
| MACRO | `#86EFAC` | `#10B981` |

Also update deep `color`, `pastel`, `gradient`, and `hslVars` fields for each category to match the new blue palette. Update `LIVE_SIGNALS_BASE` `categoryColor` values to the new hex codes.

---

### 3. `index.html` — Metadata

```
Netira → PolyBumble (title, description, author, og:title, og:description, twitter:site)
```

---

### 4. `src/components/Navigation.tsx` — Wordmark + Logo

- Replace `"Netira"` text with `"PolyBumble"`
- Replace red gradient on the logo icon box with `background: #2563EB` (solid blue)
- Keep the `Zap` icon (works well as a bee/bolt metaphor)
- Remove `linear-gradient(135deg, hsl(var(--primary)), hsl(348 100% 48%))` → `#2563EB`

---

### 5. `src/pages/Index.tsx` — Hero + Footer

- Hero headline gradient span: remove `backgroundImage: "linear-gradient(135deg, hsl(var(--primary)), hsl(348 100% 40%))"` → replace with plain `color: #2563EB` (no gradient text)
- "Build a Hedge" button: remove red gradient → `backgroundColor: #2563EB`, hover → `#1D4ED8`, `borderRadius: 999px`
- Pill badge: update from `bg-primary/8 border-primary/15` (stays fine since `--primary` changes to blue)
- Footer: `"Netira · Risk Intelligence Platform · v0.1.0"` → `"PolyBumble · Risk Intelligence Platform · v0.1.0"`

---

### 6. `src/pages/AIBuilder.tsx` — AI name references

- Welcome message: `"Hi! I'm the **Netira AI Risk Builder**..."` → `"Hi! I'm the **PolyBumble AI Risk Builder**..."`
- Inline label: `"Netira AI"` → `"PolyBumble AI"`
- Header/title text in the page if any references `Netira`

---

### 7. `src/pages/EventIndexes.tsx` — Footer

- `"Netira · Event Indexes · v0.1.0"` → `"PolyBumble · Event Indexes · v0.1.0"`

---

### Visual Result

Before: Coral-red `#FF385C` gradient branding, pastel warm category colors
After: Clean `#2563EB` blue system, navy text `#0F172A`, pure white background — Stripe/Linear aesthetic

No structural layout changes. No new files needed. All changes are additive color/text updates in existing files.
