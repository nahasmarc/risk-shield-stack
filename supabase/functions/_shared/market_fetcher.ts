/**
 * market_fetcher.ts
 * Central source of truth for prediction market data.
 * Delegates live data to polymarket_service (Polymarket Gamma API)
 * with automatic fallback to MOCK_MARKETS.
 */

export interface Market {
  id: string;
  title: string;
  probability: number;   // 0–100
  liquidity: number;     // USD millions
  volume: number;        // USD millions
  category: string;
  direction: "YES" | "NO";
  tags: string[];
  bundleIds: string[];   // which bundles this market belongs to
}

export interface MarketsFilter {
  category?: string;
  minLiquidity?: number;
  bundleId?: string;
  tags?: string[];
}

// ── Static mock catalogue (fallback) ─────────────────────────────────────────

export const MOCK_MARKETS: Market[] = [
  // ── ENERGY / OIL ───────────────────────────────────────────────────────────
  {
    id: "oil-1",
    title: "Brent Crude above $120/barrel before Dec 2025",
    probability: 28, liquidity: 3.4, volume: 12.7,
    category: "ENERGY", direction: "YES",
    tags: ["oil", "energy", "commodities"],
    bundleIds: ["oil-shock"],
  },
  {
    id: "oil-2",
    title: "OPEC+ emergency production cut announcement",
    probability: 41, liquidity: 1.8, volume: 6.3,
    category: "ENERGY", direction: "YES",
    tags: ["opec", "oil", "supply"],
    bundleIds: ["oil-shock"],
  },
  {
    id: "oil-3",
    title: "Iran-Israel military escalation in 2025",
    probability: 35, liquidity: 5.2, volume: 21.4,
    category: "GEOPOLITICS", direction: "YES",
    tags: ["iran", "israel", "middle east", "conflict"],
    bundleIds: ["oil-shock"],
  },
  {
    id: "oil-4",
    title: "Energy sector ETF (XLE) down 15%+ in Q3 2025",
    probability: 22, liquidity: 2.1, volume: 8.9,
    category: "MARKETS", direction: "YES",
    tags: ["xle", "energy", "etf"],
    bundleIds: ["oil-shock"],
  },
  // ── AI REGULATION ──────────────────────────────────────────────────────────
  {
    id: "ai-1",
    title: "EU AI Act enforcement triggers major fine by 2026",
    probability: 52, liquidity: 2.7, volume: 9.1,
    category: "REGULATION", direction: "YES",
    tags: ["ai", "eu", "regulation", "fine"],
    bundleIds: ["ai-regulation"],
  },
  {
    id: "ai-2",
    title: "US Congress passes binding AI safety legislation",
    probability: 31, liquidity: 4.5, volume: 18.2,
    category: "REGULATION", direction: "YES",
    tags: ["ai", "congress", "safety", "legislation"],
    bundleIds: ["ai-regulation"],
  },
  {
    id: "ai-3",
    title: "Frontier model capability freeze mandated by G7",
    probability: 14, liquidity: 1.1, volume: 3.7,
    category: "REGULATION", direction: "YES",
    tags: ["ai", "g7", "frontier", "freeze"],
    bundleIds: ["ai-regulation"],
  },
  {
    id: "ai-4",
    title: "DOJ antitrust action against Microsoft AI division",
    probability: 23, liquidity: 3.8, volume: 14.5,
    category: "ANTITRUST", direction: "YES",
    tags: ["microsoft", "ai", "antitrust", "doj"],
    bundleIds: ["ai-regulation"],
  },
  // ── TAIWAN / GEOPOLITICS ───────────────────────────────────────────────────
  {
    id: "taiwan-1",
    title: "China military action against Taiwan before 2027",
    probability: 18, liquidity: 8.9, volume: 47.3,
    category: "GEOPOLITICS", direction: "YES",
    tags: ["china", "taiwan", "military", "conflict"],
    bundleIds: ["taiwan-conflict"],
  },
  {
    id: "taiwan-2",
    title: "US imposes comprehensive sanctions on China",
    probability: 27, liquidity: 6.4, volume: 28.1,
    category: "GEOPOLITICS", direction: "YES",
    tags: ["china", "us", "sanctions"],
    bundleIds: ["taiwan-conflict"],
  },
  {
    id: "taiwan-3",
    title: "Global semiconductor supply disruption >30%",
    probability: 21, liquidity: 4.2, volume: 17.6,
    category: "SUPPLY CHAIN", direction: "YES",
    tags: ["semiconductors", "supply-chain", "chips"],
    bundleIds: ["taiwan-conflict"],
  },
  {
    id: "taiwan-4",
    title: "Nvidia revenue declines >25% in any 2025-26 quarter",
    probability: 16, liquidity: 5.7, volume: 23.9,
    category: "MARKETS", direction: "YES",
    tags: ["nvidia", "semiconductors", "revenue"],
    bundleIds: ["taiwan-conflict"],
  },
  // ── US ELECTION ────────────────────────────────────────────────────────────
  {
    id: "election-1",
    title: "2026 US midterms flip the House to Democrats",
    probability: 44, liquidity: 7.3, volume: 31.2,
    category: "POLITICS", direction: "YES",
    tags: ["election", "democrats", "house", "midterms"],
    bundleIds: ["us-election-volatility"],
  },
  {
    id: "election-2",
    title: "Presidential election results contested in court",
    probability: 29, liquidity: 5.1, volume: 22.7,
    category: "POLITICS", direction: "YES",
    tags: ["election", "contested", "court"],
    bundleIds: ["us-election-volatility"],
  },
  {
    id: "election-3",
    title: "Major tax policy reversal within 90 days of election",
    probability: 38, liquidity: 3.9, volume: 16.4,
    category: "POLICY", direction: "YES",
    tags: ["tax", "policy", "election"],
    bundleIds: ["us-election-volatility"],
  },
  {
    id: "election-4",
    title: "S&P 500 correction >10% in 30 days post-election",
    probability: 33, liquidity: 4.6, volume: 19.8,
    category: "MARKETS", direction: "YES",
    tags: ["sp500", "correction", "election"],
    bundleIds: ["us-election-volatility"],
  },
  // ── INFLATION ──────────────────────────────────────────────────────────────
  {
    id: "inflation-1",
    title: "US CPI above 5% for 3 consecutive months in 2025",
    probability: 19, liquidity: 6.8, volume: 29.4,
    category: "MACRO", direction: "YES",
    tags: ["inflation", "cpi", "macro"],
    bundleIds: ["inflation-spike"],
  },
  {
    id: "inflation-2",
    title: "Federal Reserve raises rates 50bps+ in single meeting",
    probability: 24, liquidity: 9.1, volume: 41.7,
    category: "MACRO", direction: "YES",
    tags: ["fed", "rates", "hike"],
    bundleIds: ["inflation-spike"],
  },
  {
    id: "inflation-3",
    title: "USD index (DXY) falls below 95 in 2025",
    probability: 31, liquidity: 4.4, volume: 18.3,
    category: "MACRO", direction: "YES",
    tags: ["dollar", "dxy", "currency"],
    bundleIds: ["inflation-spike"],
  },
  {
    id: "inflation-4",
    title: "Bloomberg Commodity Index gains >25% in 2025",
    probability: 27, liquidity: 3.7, volume: 15.2,
    category: "COMMODITIES", direction: "YES",
    tags: ["commodities", "bcom", "inflation"],
    bundleIds: ["inflation-spike"],
  },
];

// ── Public async API — delegates to polymarket_service ────────────────────────

import {
  getPolymarkets,
  getPolymarketsByBundle,
  getPolymarketById,
} from "./polymarket_service.ts";

export async function getAllMarkets(filter?: MarketsFilter): Promise<Market[]> {
  return getPolymarkets(filter);
}

export async function getMarketsByBundle(bundleId: string): Promise<Market[]> {
  return getPolymarketsByBundle(bundleId);
}

export async function getMarketById(id: string): Promise<Market | undefined> {
  return getPolymarketById(id);
}
