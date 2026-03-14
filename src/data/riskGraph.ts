export interface RiskNode {
  id: string;
  label: string;
  probability: number;
  category: "GEOPOLITICS" | "ENERGY" | "MACRO" | "TECHNOLOGY" | "POLITICS";
  bundleIds: string[];
  x: number;
  y: number;
}

export interface RiskEdge {
  from: string;
  to: string;
}

// Fixed layout positions within a 920×400 SVG viewBox
// Chain 1: Middle East → Oil → Inflation → Rate Hikes → Stock Decline  (y=70)
// Chain 2: Taiwan → Semi → Tech Collapse → Market Volatility            (y=200)
// Chain 3: US Election → Policy Reversal → Dollar Weakness → (to Inflation) (y=330)
// Cross-chain: Dollar Weakness → Inflation Spike

export const RISK_NODES: RiskNode[] = [
  // ── Chain 1 ──────────────────────────────────────────────────────────
  {
    id: "me-conflict",
    label: "Middle East Conflict",
    probability: 35,
    category: "GEOPOLITICS",
    bundleIds: ["oil-shock", "taiwan-conflict"],
    x: 60,
    y: 60,
  },
  {
    id: "oil-shock",
    label: "Oil Supply Shock",
    probability: 41,
    category: "ENERGY",
    bundleIds: ["oil-shock"],
    x: 240,
    y: 60,
  },
  {
    id: "inflation-spike",
    label: "Inflation Spike",
    probability: 27,
    category: "MACRO",
    bundleIds: ["inflation-spike"],
    x: 420,
    y: 60,
  },
  {
    id: "rate-hikes",
    label: "Interest Rate Hikes",
    probability: 33,
    category: "MACRO",
    bundleIds: ["inflation-spike"],
    x: 620,
    y: 60,
  },
  {
    id: "stock-decline",
    label: "Stock Market Decline",
    probability: 29,
    category: "MACRO",
    bundleIds: ["us-election-volatility", "inflation-spike"],
    x: 800,
    y: 60,
  },

  // ── Chain 2 ──────────────────────────────────────────────────────────
  {
    id: "taiwan-crisis",
    label: "Taiwan Crisis",
    probability: 18,
    category: "GEOPOLITICS",
    bundleIds: ["taiwan-conflict"],
    x: 60,
    y: 200,
  },
  {
    id: "semi-shortage",
    label: "Semiconductor Shortage",
    probability: 21,
    category: "TECHNOLOGY",
    bundleIds: ["taiwan-conflict", "ai-regulation"],
    x: 240,
    y: 200,
  },
  {
    id: "tech-collapse",
    label: "Tech Sector Collapse",
    probability: 16,
    category: "TECHNOLOGY",
    bundleIds: ["ai-regulation", "taiwan-conflict"],
    x: 420,
    y: 200,
  },
  {
    id: "market-volatility",
    label: "Market Volatility",
    probability: 38,
    category: "MACRO",
    bundleIds: ["us-election-volatility", "taiwan-conflict"],
    x: 620,
    y: 200,
  },

  // ── Chain 3 ──────────────────────────────────────────────────────────
  {
    id: "us-election",
    label: "US Election Volatility",
    probability: 44,
    category: "POLITICS",
    bundleIds: ["us-election-volatility"],
    x: 60,
    y: 340,
  },
  {
    id: "policy-reversal",
    label: "Policy Reversal",
    probability: 38,
    category: "POLITICS",
    bundleIds: ["us-election-volatility"],
    x: 240,
    y: 340,
  },
  {
    id: "dollar-weakness",
    label: "Dollar Weakness",
    probability: 31,
    category: "MACRO",
    bundleIds: ["inflation-spike"],
    x: 420,
    y: 340,
  },
];

export const RISK_EDGES: RiskEdge[] = [
  // Chain 1
  { from: "me-conflict", to: "oil-shock" },
  { from: "oil-shock", to: "inflation-spike" },
  { from: "inflation-spike", to: "rate-hikes" },
  { from: "rate-hikes", to: "stock-decline" },
  // Chain 2
  { from: "taiwan-crisis", to: "semi-shortage" },
  { from: "semi-shortage", to: "tech-collapse" },
  { from: "tech-collapse", to: "market-volatility" },
  // Chain 3
  { from: "us-election", to: "policy-reversal" },
  { from: "policy-reversal", to: "dollar-weakness" },
  // Cross-chain: dollar weakness feeds into inflation spike
  { from: "dollar-weakness", to: "inflation-spike" },
  // Cross-chain: market volatility and stock decline share a link
  { from: "market-volatility", to: "stock-decline" },
];
