/**
 * polymarket_service.ts
 * Fetches live prediction market data from the Polymarket Gamma API.
 * Normalises raw fields to the internal Market shape, auto-classifies
 * into bundle IDs using keyword matching, and caches results for 5 minutes.
 * Falls back to MOCK_MARKETS if the API is unreachable.
 */

import type { Market, MarketsFilter } from "./market_fetcher.ts";
import { MOCK_MARKETS } from "./market_fetcher.ts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GammaTag {
  id: string;
  label: string;
  slug?: string;
}

interface GammaMarket {
  id: string;
  question: string;
  outcomePrices?: string;   // JSON-encoded string: '["0.28","0.72"]'
  liquidityNum?: number;
  volumeNum?: number;
  volume24hr?: number;
  tags?: GammaTag[];
  active?: boolean;
  closed?: boolean;
}

// ── Keyword → Bundle classification map ──────────────────────────────────────

const KEYWORD_BUNDLE_MAP: Array<{ keywords: string[]; bundleId: string; category: string }> = [
  {
    keywords: ["oil", "opec", "crude", "petroleum", "brent", "wti", "energy"],
    bundleId: "oil-shock",
    category: "ENERGY",
  },
  {
    keywords: ["ai", "artificial intelligence", "openai", "anthropic", "llm", "machine learning", "deepmind", "gpt", "chatgpt"],
    bundleId: "ai-regulation",
    category: "TECHNOLOGY",
  },
  {
    keywords: ["taiwan", "china", "semiconductor", "chip", "nvidia", "tsmc", "strait", "pla"],
    bundleId: "taiwan-conflict",
    category: "GEOPOLITICS",
  },
  {
    keywords: ["election", "midterm", "congress", "vote", "democrat", "republican", "senate", "ballot", "trump", "harris", "potus"],
    bundleId: "us-election-volatility",
    category: "POLITICS",
  },
  {
    keywords: ["inflation", "cpi", "fed", "federal reserve", "interest rate", "tariff", "pce", "fomc", "hike", "dollar", "dxy"],
    bundleId: "inflation-spike",
    category: "MACRO",
  },
];

function classifyMarket(question: string, tags: string[]): { bundleIds: string[]; category: string } {
  const text = [question, ...tags].join(" ").toLowerCase();
  const matchedBundleIds: string[] = [];
  let category = "OTHER";

  for (const entry of KEYWORD_BUNDLE_MAP) {
    if (entry.keywords.some((kw) => text.includes(kw))) {
      if (!matchedBundleIds.includes(entry.bundleId)) {
        matchedBundleIds.push(entry.bundleId);
      }
      if (category === "OTHER") category = entry.category;
    }
  }

  return { bundleIds: matchedBundleIds, category };
}

// ── Normalisation ─────────────────────────────────────────────────────────────

function parseProbability(outcomePrices?: string): number {
  if (!outcomePrices) return 50;
  try {
    const prices = JSON.parse(outcomePrices) as string[];
    const first = parseFloat(prices[0] ?? "0.5");
    return Math.round(first * 100);
  } catch {
    return 50;
  }
}

function normaliseMarket(raw: GammaMarket): Market | null {
  if (!raw.active || raw.closed) return null;

  const tagLabels = (raw.tags ?? []).map((t) => t.label.toLowerCase());
  const { bundleIds, category } = classifyMarket(raw.question, tagLabels);

  // Only keep markets that belong to at least one bundle
  if (bundleIds.length === 0) return null;

  return {
    id: raw.id,
    title: raw.question,
    probability: parseProbability(raw.outcomePrices),
    liquidity: (raw.liquidityNum ?? 0) / 1_000_000,
    volume: (raw.volumeNum ?? 0) / 1_000_000,
    category,
    direction: "YES",
    tags: tagLabels,
    bundleIds,
  };
}

// ── In-memory cache ───────────────────────────────────────────────────────────

const TTL_MS = 5 * 60 * 1_000; // 5 minutes

let _cache: Market[] = [];
let _fetchedAt: Date | null = null;
let _source: "live" | "mock" = "mock";

function isCacheFresh(): boolean {
  return _cache.length > 0 && _fetchedAt !== null && Date.now() - _fetchedAt.getTime() < TTL_MS;
}

async function fetchAndCacheMarkets(): Promise<void> {
  const url =
    "https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=100&order=volumeNum&ascending=false";

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      throw new Error(`Gamma API responded ${res.status}`);
    }

    const raw: GammaMarket[] = await res.json();

    const normalised = raw
      .map(normaliseMarket)
      .filter((m): m is Market => m !== null);

    if (normalised.length === 0) {
      throw new Error("Gamma API returned 0 classifiable markets");
    }

    _cache = normalised;
    _fetchedAt = new Date();
    _source = "live";
    console.log(`[polymarket_service] Cached ${normalised.length} live markets from Gamma API`);
  } catch (err) {
    console.warn(`[polymarket_service] Gamma API fetch failed — using MOCK_MARKETS. Reason: ${err}`);
    _cache = MOCK_MARKETS;
    _fetchedAt = new Date();
    _source = "mock";
  }
}

async function ensureCache(): Promise<void> {
  if (!isCacheFresh()) {
    await fetchAndCacheMarkets();
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getPolymarkets(filter?: MarketsFilter): Promise<Market[]> {
  await ensureCache();
  let markets = [..._cache];

  if (filter?.category) {
    markets = markets.filter((m) => m.category === filter.category!.toUpperCase());
  }
  if (filter?.minLiquidity !== undefined) {
    markets = markets.filter((m) => m.liquidity >= filter.minLiquidity!);
  }
  if (filter?.bundleId) {
    markets = markets.filter((m) => m.bundleIds.includes(filter.bundleId!));
  }
  if (filter?.tags && filter.tags.length > 0) {
    const searchTags = filter.tags.map((t) => t.toLowerCase());
    markets = markets.filter((m) =>
      m.tags.some((tag) => searchTags.some((st) => tag.toLowerCase().includes(st)))
    );
  }

  return markets;
}

export async function getPolymarketsByBundle(bundleId: string): Promise<Market[]> {
  await ensureCache();
  return _cache.filter((m) => m.bundleIds.includes(bundleId));
}

export async function getPolymarketById(id: string): Promise<Market | undefined> {
  await ensureCache();
  return _cache.find((m) => m.id === id);
}

export function getCacheStatus(): { size: number; fetchedAt: Date | null; source: "live" | "mock" } {
  return { size: _cache.length, fetchedAt: _fetchedAt, source: _source };
}
