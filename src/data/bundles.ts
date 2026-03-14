import { Flame, Cpu, Globe, Vote, TrendingUp, type LucideIcon } from "lucide-react";

export interface Contract {
  id: string;
  title: string;
  probability: number; // 0–100
  liquidity: number;   // in USD millions
  volume: number;      // in USD millions
  category: string;
  direction: "YES" | "NO";
}

export interface HedgeBundle {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryColor: string;
  icon: string;
  contracts: Contract[];
  lastUpdated: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  tags: string[];
}

export interface CategoryMeta {
  color: string;         // hsl(…) string
  hslVars: string;       // raw HSL values for CSS vars
  gradient: string;
  Icon: LucideIcon;
  label: string;
}

export const CATEGORY_CONFIG: Record<string, CategoryMeta> = {
  ENERGY: {
    color: "hsl(24 100% 50%)",
    hslVars: "24 100% 50%",
    gradient: "linear-gradient(90deg, hsl(24 100% 50%), hsl(32 100% 55%))",
    Icon: Flame,
    label: "ENERGY",
  },
  TECHNOLOGY: {
    color: "hsl(271 76% 60%)",
    hslVars: "271 76% 60%",
    gradient: "linear-gradient(90deg, hsl(271 76% 60%), hsl(280 80% 65%))",
    Icon: Cpu,
    label: "TECHNOLOGY",
  },
  GEOPOLITICS: {
    color: "hsl(0 84% 60%)",
    hslVars: "0 84% 60%",
    gradient: "linear-gradient(90deg, hsl(0 84% 60%), hsl(10 90% 63%))",
    Icon: Globe,
    label: "GEOPOLITICS",
  },
  POLITICS: {
    color: "hsl(213 93% 58%)",
    hslVars: "213 93% 58%",
    gradient: "linear-gradient(90deg, hsl(213 93% 58%), hsl(220 90% 62%))",
    Icon: Vote,
    label: "POLITICS",
  },
  MACRO: {
    color: "hsl(142 71% 45%)",
    hslVars: "142 71% 45%",
    gradient: "linear-gradient(90deg, hsl(142 71% 45%), hsl(150 72% 48%))",
    Icon: TrendingUp,
    label: "ECONOMICS",
  },
};

// Polymarket API placeholder
// TODO: Replace mock data with live API call
// export async function fetchContracts(query: string): Promise<Contract[]> {
//   const res = await fetch(`https://gamma-api.polymarket.com/markets?search=${encodeURIComponent(query)}`);
//   const data = await res.json();
//   return data.results.map(transformPolymarketContract);
// }

export const HEDGE_BUNDLES: HedgeBundle[] = [
  {
    id: "oil-shock",
    title: "Oil Shock Protection",
    description:
      "Guards against a sudden spike in global oil prices driven by OPEC+ supply cuts, Middle East escalation, or sanctions that threaten energy infrastructure.",
    category: "ENERGY",
    categoryColor: "hsl(24 100% 50%)",
    icon: "⛽",
    riskLevel: "HIGH",
    tags: ["energy", "commodities", "geopolitics", "inflation"],
    lastUpdated: "2025-03-14T09:15:00Z",
    contracts: [
      {
        id: "oil-1",
        title: "Brent Crude above $120/barrel before Dec 2025",
        probability: 28,
        liquidity: 3.4,
        volume: 12.7,
        category: "ENERGY",
        direction: "YES",
      },
      {
        id: "oil-2",
        title: "OPEC+ emergency production cut announcement",
        probability: 41,
        liquidity: 1.8,
        volume: 6.3,
        category: "ENERGY",
        direction: "YES",
      },
      {
        id: "oil-3",
        title: "Iran-Israel military escalation in 2025",
        probability: 35,
        liquidity: 5.2,
        volume: 21.4,
        category: "GEOPOLITICS",
        direction: "YES",
      },
      {
        id: "oil-4",
        title: "Energy sector ETF (XLE) down 15%+ in Q3 2025",
        probability: 22,
        liquidity: 2.1,
        volume: 8.9,
        category: "MARKETS",
        direction: "YES",
      },
    ],
  },
  {
    id: "ai-regulation",
    title: "AI Regulation Risk",
    description:
      "Protects against sudden regulatory clampdowns on AI development including model bans, liability laws, and antitrust actions targeting Big Tech AI divisions.",
    category: "TECHNOLOGY",
    categoryColor: "hsl(271 76% 60%)",
    icon: "🤖",
    riskLevel: "MEDIUM",
    tags: ["AI", "regulation", "big-tech", "EU", "legislation"],
    lastUpdated: "2025-03-14T09:15:00Z",
    contracts: [
      {
        id: "ai-1",
        title: "EU AI Act enforcement triggers major fine by 2026",
        probability: 52,
        liquidity: 2.7,
        volume: 9.1,
        category: "REGULATION",
        direction: "YES",
      },
      {
        id: "ai-2",
        title: "US Congress passes binding AI safety legislation",
        probability: 31,
        liquidity: 4.5,
        volume: 18.2,
        category: "REGULATION",
        direction: "YES",
      },
      {
        id: "ai-3",
        title: "Frontier model capability freeze mandated by G7",
        probability: 14,
        liquidity: 1.1,
        volume: 3.7,
        category: "REGULATION",
        direction: "YES",
      },
      {
        id: "ai-4",
        title: "DOJ antitrust action against Microsoft AI division",
        probability: 23,
        liquidity: 3.8,
        volume: 14.5,
        category: "ANTITRUST",
        direction: "YES",
      },
    ],
  },
  {
    id: "taiwan-conflict",
    title: "Taiwan Conflict Hedge",
    description:
      "Provides coverage for the economic and supply chain impact of a Taiwan Strait crisis, including semiconductor disruption, US sanctions, and tech sector collapse.",
    category: "GEOPOLITICS",
    categoryColor: "hsl(0 84% 60%)",
    icon: "🌏",
    riskLevel: "CRITICAL",
    tags: ["taiwan", "china", "semiconductors", "geopolitics", "supply-chain"],
    lastUpdated: "2025-03-14T09:15:00Z",
    contracts: [
      {
        id: "taiwan-1",
        title: "China military action against Taiwan before 2027",
        probability: 18,
        liquidity: 8.9,
        volume: 47.3,
        category: "GEOPOLITICS",
        direction: "YES",
      },
      {
        id: "taiwan-2",
        title: "US imposes comprehensive sanctions on China",
        probability: 27,
        liquidity: 6.4,
        volume: 28.1,
        category: "GEOPOLITICS",
        direction: "YES",
      },
      {
        id: "taiwan-3",
        title: "Global semiconductor supply disruption >30%",
        probability: 21,
        liquidity: 4.2,
        volume: 17.6,
        category: "SUPPLY CHAIN",
        direction: "YES",
      },
      {
        id: "taiwan-4",
        title: "Nvidia revenue declines >25% in any 2025-26 quarter",
        probability: 16,
        liquidity: 5.7,
        volume: 23.9,
        category: "MARKETS",
        direction: "YES",
      },
    ],
  },
  {
    id: "us-election-volatility",
    title: "US Election Volatility",
    description:
      "Shields against electoral uncertainty including contested results, sharp policy reversals, and the equity market correction that historically follows high-tension election cycles.",
    category: "POLITICS",
    categoryColor: "hsl(213 93% 58%)",
    icon: "🗳️",
    riskLevel: "HIGH",
    tags: ["election", "US politics", "volatility", "policy", "markets"],
    lastUpdated: "2025-03-14T09:15:00Z",
    contracts: [
      {
        id: "election-1",
        title: "2026 US midterms flip the House to Democrats",
        probability: 44,
        liquidity: 7.3,
        volume: 31.2,
        category: "POLITICS",
        direction: "YES",
      },
      {
        id: "election-2",
        title: "Presidential election results contested in court",
        probability: 29,
        liquidity: 5.1,
        volume: 22.7,
        category: "POLITICS",
        direction: "YES",
      },
      {
        id: "election-3",
        title: "Major tax policy reversal within 90 days of election",
        probability: 38,
        liquidity: 3.9,
        volume: 16.4,
        category: "POLICY",
        direction: "YES",
      },
      {
        id: "election-4",
        title: "S&P 500 correction >10% in 30 days post-election",
        probability: 33,
        liquidity: 4.6,
        volume: 19.8,
        category: "MARKETS",
        direction: "YES",
      },
    ],
  },
  {
    id: "inflation-spike",
    title: "Inflation Spike Protection",
    description:
      "Hedges against a resurgence of inflation driven by energy shocks, fiscal stimulus, or dollar weakness, including Fed rate hike risk and commodity price surges.",
    category: "MACRO",
    categoryColor: "hsl(142 71% 45%)",
    icon: "📈",
    riskLevel: "MEDIUM",
    tags: ["inflation", "CPI", "Fed", "commodities", "dollar", "rates"],
    lastUpdated: "2025-03-14T09:15:00Z",
    contracts: [
      {
        id: "inflation-1",
        title: "US CPI above 5% for 3 consecutive months in 2025",
        probability: 19,
        liquidity: 6.8,
        volume: 29.4,
        category: "MACRO",
        direction: "YES",
      },
      {
        id: "inflation-2",
        title: "Federal Reserve raises rates 50bps+ in single meeting",
        probability: 24,
        liquidity: 9.1,
        volume: 41.7,
        category: "MACRO",
        direction: "YES",
      },
      {
        id: "inflation-3",
        title: "USD index (DXY) falls below 95 in 2025",
        probability: 31,
        liquidity: 4.4,
        volume: 18.3,
        category: "MACRO",
        direction: "YES",
      },
      {
        id: "inflation-4",
        title: "Bloomberg Commodity Index gains >25% in 2025",
        probability: 27,
        liquidity: 3.7,
        volume: 15.2,
        category: "COMMODITIES",
        direction: "YES",
      },
    ],
  },
];

export interface LiveSignal {
  id: string;
  contractTitle: string;
  bundleCategory: string;
  categoryColor: string;
  probability: number;
  change: number;
}

export const LIVE_SIGNALS_BASE: LiveSignal[] = [
  { id: "ls-1", contractTitle: "Brent Crude above $120", bundleCategory: "ENERGY", categoryColor: "hsl(24 100% 50%)", probability: 28, change: +2.3 },
  { id: "ls-2", contractTitle: "EU AI Act enforcement fine", bundleCategory: "TECHNOLOGY", categoryColor: "hsl(271 76% 60%)", probability: 52, change: -1.1 },
  { id: "ls-3", contractTitle: "China military action vs Taiwan", bundleCategory: "GEOPOLITICS", categoryColor: "hsl(0 84% 60%)", probability: 18, change: +0.8 },
  { id: "ls-4", contractTitle: "House flips to Democrats 2026", bundleCategory: "POLITICS", categoryColor: "hsl(213 93% 58%)", probability: 44, change: +3.1 },
  { id: "ls-5", contractTitle: "US CPI above 5% (3 months)", bundleCategory: "MACRO", categoryColor: "hsl(142 71% 45%)", probability: 19, change: -0.6 },
  { id: "ls-6", contractTitle: "OPEC+ emergency supply cut", bundleCategory: "ENERGY", categoryColor: "hsl(24 100% 50%)", probability: 41, change: +1.7 },
  { id: "ls-7", contractTitle: "Fed 50bps rate hike", bundleCategory: "MACRO", categoryColor: "hsl(142 71% 45%)", probability: 24, change: -2.4 },
  { id: "ls-8", contractTitle: "US-China comprehensive sanctions", bundleCategory: "GEOPOLITICS", categoryColor: "hsl(0 84% 60%)", probability: 27, change: +0.5 },
];

export function getBundleById(id: string): HedgeBundle | undefined {
  return HEDGE_BUNDLES.find((b) => b.id === id);
}

export function getAvgProbability(bundle: HedgeBundle): number {
  const sum = bundle.contracts.reduce((acc, c) => acc + c.probability, 0);
  return Math.round(sum / bundle.contracts.length);
}

export function getTotalLiquidity(bundle: HedgeBundle): number {
  return bundle.contracts.reduce((acc, c) => acc + c.liquidity, 0);
}

export function getTotalVolume(bundle: HedgeBundle): number {
  return bundle.contracts.reduce((acc, c) => acc + c.volume, 0);
}

export function calculateHedgeCost(bundle: HedgeBundle, coverage: number): number {
  const avg = getAvgProbability(bundle) / 100;
  return Math.round(coverage * avg);
}

export function formatMillions(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}B`;
  return `$${value.toFixed(1)}M`;
}

export const RISK_LEVEL_CONFIG = {
  LOW: { label: "LOW RISK", color: "hsl(142 71% 45%)" },
  MEDIUM: { label: "MED RISK", color: "hsl(43 96% 56%)" },
  HIGH: { label: "HIGH RISK", color: "hsl(24 100% 50%)" },
  CRITICAL: { label: "CRITICAL", color: "hsl(0 84% 60%)" },
};
