/**
 * polymarket_service.ts
 * Fetches live binary prediction market data from the Polymarket Gamma API.
 *
 * Polymarket Gamma API docs: https://docs.polymarket.com/developers/gamma-api
 * No API key required — it is a public REST endpoint.
 *
 * Classifies markets into coverage bundles via keyword matching and
 * caches results in-memory with a 5-minute TTL.
 * Falls back to MOCK_MARKETS if the API is unreachable.
 */

import type { Market, MarketsFilter } from "./market_fetcher.ts";
import { MOCK_MARKETS } from "./market_fetcher.ts";

// ── Gamma API response shape ───────────────────────────────────────────────────

interface GammaToken {
  token_id: string;
  outcome: string;   // "Yes" | "No"
  price: number;     // float 0..1
  winner: boolean;
}

interface GammaMarket {
  id: string;
  slug?: string;             // event slug for polymarket.com/event/{slug}
  question: string;
  description?: string;
  tokens?: GammaToken[];
  outcomePrices?: string;    // JSON string e.g. '["0.28","0.72"]'
  liquidityNum?: number;
  volumeNum?: number;
  volume24hr?: number;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  tags?: Array<{ id: string; label: string; slug?: string }>;
}

// ── Blocklist ─────────────────────────────────────────────────────────────────

const BLOCKLIST_PHRASES: string[] = [
  "gta", "grand theft auto", "world cup", "fifa", "masters tournament",
  "champions league", "super bowl", "nba", "nfl", "mlb", "nhl", "ufc",
  "wimbledon", "us open", "french open", "australian open", "formula 1",
  "f1", "pga", "golf", "tennis", "soccer", "football championship",
  "basketball", "baseball", "hockey", "olympic", "esport",
  "oscar", "grammy", "emmy", "golden globe", "box office", "film",
  "movie", "album", "song", "taylor swift", "spotify", "netflix",
  "youtube", "twitch", "celebrity", "kardashian",
  "dogecoin", "shiba", "memecoin", "nft ", "metaverse", "minecraft",
  "fortnite", "roblox", "pokemon", "anime",
  "jesus christ", "god ", "alien", "ufo", "extraterrestrial", "bigfoot",
  "zombie", "apocalypse",
  "measles", "covid", "pandemic", "flu ", "hurricane name",
];

// ── Bundle keyword map ────────────────────────────────────────────────────────

interface BundleEntry {
  keywords: string[];
  bundleId: string;
  category: string;
  minMatches: number;
}

const KEYWORD_BUNDLE_MAP: BundleEntry[] = [
  {
    keywords: [
      "crude oil", "oil price", "oil shock", "opec", "brent", "wti",
      "petroleum", "natural gas", "lng", "gasoline price", "fuel price",
      "energy price", "oil barrel", "oil supply", "oil demand",
    ],
    bundleId: "oil-shock",
    category: "ENERGY",
    minMatches: 1,
  },
  {
    keywords: [
      "artificial intelligence regulation", "ai regulation", "ai ban",
      "ai safety bill", "eu ai act", "ai policy", "frontier model",
      "openai regulation", "anthropic", "ai governance", "ai liability",
      "llm regulation", "generative ai law", "ai act",
    ],
    bundleId: "ai-regulation",
    category: "TECHNOLOGY",
    minMatches: 1,
  },
  {
    keywords: [
      "taiwan invasion", "china invade taiwan", "taiwan strait",
      "tsmc", "semiconductor war", "chip ban", "ukraine war",
      "ukraine ceasefire", "russia invade", "nato expansion",
      "iran nuclear", "iran war", "us forces enter", "us attack iran",
      "north korea missile", "north korea nuclear",
      "israel hamas", "israel iran", "hezbollah",
      "xi jinping", "pla military", "south china sea",
    ],
    bundleId: "taiwan-conflict",
    category: "GEOPOLITICS",
    minMatches: 1,
  },
  {
    keywords: [
      "us presidential election", "presidential nomination",
      "democratic nomination", "republican nomination",
      "senate majority", "house majority", "midterm election",
      "electoral college", "us congress", "impeach",
      "trump presidency", "trump administration", "trump out",
      "us president 2028", "us election 2026", "us election 2028",
      "fed chair", "federal reserve chair", "treasury secretary",
    ],
    bundleId: "us-election-volatility",
    category: "POLITICS",
    minMatches: 1,
  },
  {
    keywords: [
      "inflation rate", "cpi report", "core inflation",
      "federal reserve rate", "interest rate hike", "rate cut",
      "fomc meeting", "fed funds rate", "tariff", "trade war",
      "gdp growth", "recession", "debt ceiling", "us default",
      "treasury yield", "10-year yield", "dollar index", "dxy",
      "nonfarm payroll", "unemployment rate", "jobs report",
    ],
    bundleId: "inflation-spike",
    category: "MACRO",
    minMatches: 1,
  },
];

function classifyMarket(question: string, description: string, tags: string[]): {
  bundleIds: string[];
  category: string;
} {
  const text = [question, description, ...tags].join(" ").toLowerCase();

  for (const phrase of BLOCKLIST_PHRASES) {
    if (text.includes(phrase)) {
      return { bundleIds: [], category: "OTHER" };
    }
  }

  const matchedBundleIds: string[] = [];
  let category = "OTHER";

  for (const entry of KEYWORD_BUNDLE_MAP) {
    const matchCount = entry.keywords.filter((kw) => text.includes(kw)).length;
    if (matchCount >= entry.minMatches) {
      if (!matchedBundleIds.includes(entry.bundleId)) {
        matchedBundleIds.push(entry.bundleId);
      }
      if (category === "OTHER") category = entry.category;
    }
  }

  return { bundleIds: matchedBundleIds, category };
}

// ── Parse probability ─────────────────────────────────────────────────────────

function parseProbability(raw: GammaMarket): number {
  if (raw.tokens && raw.tokens.length > 0) {
    const yesToken = raw.tokens.find(
      (t) => t.outcome.toLowerCase() === "yes"
    );
    if (yesToken && typeof yesToken.price === "number") {
      return Math.round(yesToken.price * 100);
    }
    const first = raw.tokens[0];
    if (typeof first?.price === "number") return Math.round(first.price * 100);
  }

  if (raw.outcomePrices) {
    try {
      const prices = JSON.parse(raw.outcomePrices) as (string | number)[];
      const first = parseFloat(String(prices[0] ?? "0.5"));
      if (!isNaN(first)) return Math.round(first * 100);
    } catch {
      // ignore
    }
  }

  return 50;
}

// Extract the YES outcome CLOB token_id (256-bit hex) from the tokens array
function parseYesTokenId(raw: GammaMarket): string | undefined {
  if (!raw.tokens || raw.tokens.length === 0) return undefined;
  const yesToken = raw.tokens.find((t) => t.outcome.toLowerCase() === "yes");
  return yesToken?.token_id ?? raw.tokens[0]?.token_id;
}

function normaliseMarket(raw: GammaMarket): Market | null {
  if (raw.closed === true || raw.archived === true) return null;
  if (raw.active === false) return null;

  const tagLabels = (raw.tags ?? []).map((t) => t.label.toLowerCase());
  const { bundleIds, category } = classifyMarket(
    raw.question ?? "",
    raw.description ?? "",
    tagLabels
  );

  if (bundleIds.length === 0) return null;

  const probability = parseProbability(raw);
  if (probability <= 1 || probability >= 99) return null;

  return {
    id: raw.id,
    slug: raw.slug,
    yesTokenId: parseYesTokenId(raw),
    title: raw.question,
    probability,
    liquidity: Math.min((raw.liquidityNum ?? 0) / 1_000_000, 999),
    volume: Math.min((raw.volumeNum ?? 0) / 1_000_000, 999),
    category,
    direction: "YES",
    tags: tagLabels,
    bundleIds,
  };
}

// ── Deduplication: strip near-identical strike-price variants ─────────────────
// Markets that share the same "stem" (title minus any numbers/symbols) are
// grouped and only the most liquid one per stem+bundle is kept.
// Also caps each bundle at MAX_PER_BUNDLE markets sorted by liquidity desc.

const MAX_PER_BUNDLE = 6;

function titleStem(title: string): string {
  // Remove numbers, currency symbols, common suffixes → canonical stem
  return title
    .toLowerCase()
    .replace(/\$[\d,]+(\.\d+)?/g, "")     // $85, $100.5
    .replace(/\d+(\.\d+)?%/g, "")          // 80%
    .replace(/\b\d{1,4}\b/g, "")           // standalone numbers
    .replace(/[^\w\s]/g, " ")              // punctuation
    .replace(/\s+/g, " ")
    .trim();
}

function deduplicateMarkets(markets: Market[]): Market[] {
  // Group by bundleId × titleStem, keep highest-liquidity representative
  const bundles = new Map<string, Market[]>();

  for (const market of markets) {
    for (const bundleId of market.bundleIds) {
      if (!bundles.has(bundleId)) bundles.set(bundleId, []);
      bundles.get(bundleId)!.push(market);
    }
  }

  const kept = new Set<string>();
  for (const [, bundleMarkets] of bundles) {
    // Sort by liquidity desc
    const sorted = [...bundleMarkets].sort((a, b) => b.liquidity - a.liquidity);

    // Group by stem within this bundle
    const stemSeen = new Map<string, string>(); // stem → id of kept market

    for (const m of sorted) {
      const stem = titleStem(m.title);
      if (!stemSeen.has(stem)) {
        stemSeen.set(stem, m.id);
        kept.add(m.id + "::" + m.bundleIds[0]);
      }
      // Break once we have enough distinct markets for this bundle
      if (stemSeen.size >= MAX_PER_BUNDLE) break;
    }
  }

  // Return markets that were kept in at least one bundle, trimming bundleIds to kept ones
  const result: Market[] = [];
  const seen = new Set<string>();

  for (const market of markets) {
    const keptBundles = market.bundleIds.filter(
      (bid) => kept.has(market.id + "::" + bid)
    );
    if (keptBundles.length > 0 && !seen.has(market.id)) {
      seen.add(market.id);
      result.push({ ...market, bundleIds: keptBundles });
    }
  }

  return result;
}

// ── Gamma API fetch ───────────────────────────────────────────────────────────

const GAMMA_ENDPOINTS = [
  "https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=500&order=volumeNum&ascending=false",
  "https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=500&order=liquidityNum&ascending=false",
];

const TTL_MS = 5 * 60 * 1_000;

let _cache: Market[] = [];
let _fetchedAt: Date | null = null;
let _source: "live" | "mock" = "mock";

function isCacheFresh(): boolean {
  return (
    _cache.length > 0 &&
    _fetchedAt !== null &&
    Date.now() - _fetchedAt.getTime() < TTL_MS
  );
}

async function fetchFromEndpoint(url: string): Promise<GammaMarket[]> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "PolyBundle/1.0 (hackathon)",
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Gamma API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<GammaMarket[]>;
}

async function fetchAndCacheMarkets(): Promise<void> {
  try {
    const [byVolume, byLiquidity] = await Promise.allSettled(
      GAMMA_ENDPOINTS.map(fetchFromEndpoint)
    );

    const rawMarkets: GammaMarket[] = [];
    const seenIds = new Set<string>();

    for (const result of [byVolume, byLiquidity]) {
      if (result.status === "fulfilled") {
        for (const m of result.value) {
          if (m.id && !seenIds.has(m.id)) {
            seenIds.add(m.id);
            rawMarkets.push(m);
          }
        }
      }
    }

    if (rawMarkets.length === 0) {
      throw new Error("Gamma API returned 0 markets across both endpoints");
    }

    const normalised = rawMarkets
      .map(normaliseMarket)
      .filter((m): m is Market => m !== null);

    if (normalised.length === 0) {
      throw new Error(
        `Gamma API returned ${rawMarkets.length} raw markets but 0 matched any bundle keyword`
      );
    }

    // Deduplicate strike-price spam and cap bundle sizes
    const deduped = deduplicateMarkets(normalised);

    _cache = deduped;
    _fetchedAt = new Date();
    _source = "live";

    console.log(
      `[polymarket_service] ✅ Live data: ${deduped.length} markets (deduplicated from ${normalised.length}) via Gamma API`
    );
  } catch (err) {
    console.warn(
      `[polymarket_service] ⚠️ Gamma API unavailable — falling back to MOCK_MARKETS. Reason: ${err}`
    );
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
    markets = markets.filter(
      (m) => m.category === filter.category!.toUpperCase()
    );
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
      m.tags.some((tag) =>
        searchTags.some((st) => tag.toLowerCase().includes(st))
      )
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

export function getCacheStatus(): {
  size: number;
  fetchedAt: Date | null;
  source: "live" | "mock";
} {
  return { size: _cache.length, fetchedAt: _fetchedAt, source: _source };
}
