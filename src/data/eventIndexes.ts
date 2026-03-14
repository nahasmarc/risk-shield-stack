import { Globe, Cpu, TrendingUp, Vote } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface IndexMarket {
  id: string;
  title: string;
  probability: number;
  weight: number; // 0–1, sum per index = 1
  direction: "YES" | "NO";
  liquidity: number;
  volume: number;
}

export interface IndexHistoryPoint {
  day: number; // 0 = oldest, N = newest
  value: number; // composite probability 0–100
}

export interface EventIndex {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  color: string;       // deep hsl
  pastel: string;      // pastel bg
  accentHex: string;
  Icon: LucideIcon;
  currentValue: number;   // composite 0–100
  change7d: number;       // percentage point change over 7 days
  markets: IndexMarket[];
  history: IndexHistoryPoint[]; // 30 daily data points
  tags: string[];
}

/* ─── helpers ─── */
function makeHistory(base: number, volatility: number): IndexHistoryPoint[] {
  const pts: IndexHistoryPoint[] = [];
  let val = base - (volatility * 2);
  for (let i = 0; i < 30; i++) {
    val += (Math.random() - 0.44) * volatility;
    val = Math.max(5, Math.min(95, val));
    pts.push({ day: i, value: Math.round(val * 10) / 10 });
  }
  // Anchor final value to currentValue
  pts[pts.length - 1].value = base;
  return pts;
}

/* ─── Index definitions ─── */
export const EVENT_INDEXES: EventIndex[] = [
  {
    id: "geopolitical-risk",
    title: "Geopolitical Risk Index",
    subtitle: "GRI · Global",
    description:
      "Tracks the aggregate probability of major geopolitical disruptions — military conflicts, sanctions, and interstate tensions — weighted by market liquidity and correlation to broader asset classes.",
    category: "GEOPOLITICS",
    color: "hsl(0 72% 51%)",
    pastel: "hsl(0 93% 95%)",
    accentHex: "#FCA5A5",
    Icon: Globe,
    currentValue: 31,
    change7d: +3.8,
    tags: ["conflict", "sanctions", "Taiwan", "Middle East"],
    history: makeHistory(31, 2.4),
    markets: [
      {
        id: "geo-1",
        title: "China military action against Taiwan before 2027",
        probability: 18,
        weight: 0.30,
        direction: "YES",
        liquidity: 8.9,
        volume: 47.3,
      },
      {
        id: "geo-2",
        title: "Iran-Israel military escalation in 2025",
        probability: 35,
        weight: 0.25,
        direction: "YES",
        liquidity: 5.2,
        volume: 21.4,
      },
      {
        id: "geo-3",
        title: "US imposes comprehensive sanctions on China",
        probability: 27,
        weight: 0.25,
        direction: "YES",
        liquidity: 6.4,
        volume: 28.1,
      },
      {
        id: "geo-4",
        title: "Russia-NATO direct confrontation in 2025",
        probability: 12,
        weight: 0.20,
        direction: "YES",
        liquidity: 4.1,
        volume: 17.6,
      },
    ],
  },
  {
    id: "ai-regulation",
    title: "AI Regulation Index",
    subtitle: "AIRI · Technology",
    description:
      "Composite index measuring the probability of binding AI legislation passing across major economies. Incorporates EU AI Act enforcement, US Congressional action, and G7 coordination efforts.",
    category: "TECHNOLOGY",
    color: "hsl(258 60% 55%)",
    pastel: "hsl(258 89% 95%)",
    accentHex: "#C4B5FD",
    Icon: Cpu,
    currentValue: 38,
    change7d: +1.2,
    tags: ["AI", "legislation", "EU", "Big Tech"],
    history: makeHistory(38, 1.8),
    markets: [
      {
        id: "ai-1",
        title: "EU AI Act enforcement triggers major fine by 2026",
        probability: 52,
        weight: 0.30,
        direction: "YES",
        liquidity: 2.7,
        volume: 9.1,
      },
      {
        id: "ai-2",
        title: "US Congress passes binding AI safety legislation",
        probability: 31,
        weight: 0.30,
        direction: "YES",
        liquidity: 4.5,
        volume: 18.2,
      },
      {
        id: "ai-3",
        title: "Frontier model capability freeze mandated by G7",
        probability: 14,
        weight: 0.20,
        direction: "YES",
        liquidity: 1.1,
        volume: 3.7,
      },
      {
        id: "ai-4",
        title: "DOJ antitrust action against Microsoft AI division",
        probability: 23,
        weight: 0.20,
        direction: "YES",
        liquidity: 3.8,
        volume: 14.5,
      },
    ],
  },
  {
    id: "inflation-risk",
    title: "Inflation Risk Index",
    subtitle: "IRI · Macro",
    description:
      "Aggregates prediction markets linked to inflation-driving factors: energy shocks, dollar weakness, commodity surges, and Federal Reserve policy responses. A rising index signals heightened inflationary pressure.",
    category: "MACRO",
    color: "hsl(142 60% 38%)",
    pastel: "hsl(142 77% 93%)",
    accentHex: "#86EFAC",
    Icon: TrendingUp,
    currentValue: 26,
    change7d: +5.1,
    tags: ["CPI", "Fed", "commodities", "dollar"],
    history: makeHistory(26, 3.1),
    markets: [
      {
        id: "inf-1",
        title: "US CPI above 5% for 3 consecutive months in 2025",
        probability: 19,
        weight: 0.25,
        direction: "YES",
        liquidity: 6.8,
        volume: 29.4,
      },
      {
        id: "inf-2",
        title: "Federal Reserve raises rates 50bps+ in single meeting",
        probability: 24,
        weight: 0.30,
        direction: "YES",
        liquidity: 9.1,
        volume: 41.7,
      },
      {
        id: "inf-3",
        title: "USD index (DXY) falls below 95 in 2025",
        probability: 31,
        weight: 0.25,
        direction: "YES",
        liquidity: 4.4,
        volume: 18.3,
      },
      {
        id: "inf-4",
        title: "Bloomberg Commodity Index gains >25% in 2025",
        probability: 27,
        weight: 0.20,
        direction: "YES",
        liquidity: 3.7,
        volume: 15.2,
      },
    ],
  },
  {
    id: "election-volatility",
    title: "Election Volatility Index",
    subtitle: "EVI · Politics",
    description:
      "Tracks political uncertainty across electoral cycles, policy reversal risk, and market impact of contested elections. Particularly sensitive to polling swings, legal challenges, and post-election congressional dynamics.",
    category: "POLITICS",
    color: "hsl(213 80% 50%)",
    pastel: "hsl(214 95% 93%)",
    accentHex: "#93C5FD",
    Icon: Vote,
    currentValue: 36,
    change7d: -1.4,
    tags: ["election", "policy", "Congress", "volatility"],
    history: makeHistory(36, 2.7),
    markets: [
      {
        id: "elec-1",
        title: "2026 US midterms flip the House to Democrats",
        probability: 44,
        weight: 0.30,
        direction: "YES",
        liquidity: 7.3,
        volume: 31.2,
      },
      {
        id: "elec-2",
        title: "Presidential election results contested in court",
        probability: 29,
        weight: 0.25,
        direction: "YES",
        liquidity: 5.1,
        volume: 22.7,
      },
      {
        id: "elec-3",
        title: "Major tax policy reversal within 90 days of election",
        probability: 38,
        weight: 0.25,
        direction: "YES",
        liquidity: 3.9,
        volume: 16.4,
      },
      {
        id: "elec-4",
        title: "S&P 500 correction >10% in 30 days post-election",
        probability: 33,
        weight: 0.20,
        direction: "YES",
        liquidity: 4.6,
        volume: 19.8,
      },
    ],
  },
];

export function getIndexById(id: string): EventIndex | undefined {
  return EVENT_INDEXES.find((idx) => idx.id === id);
}
