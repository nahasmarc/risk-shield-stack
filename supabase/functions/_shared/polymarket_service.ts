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
// Full reference: https://gamma-api.polymarket.com/markets (GET)

interface GammaToken {
  token_id: string;
  outcome: string;   // "Yes" | "No"
  price: number;     // float 0..1
  winner: boolean;
}

interface GammaMarket {
  id: string;
  question: string;
  description?: string;
  // Nested tokens array — used when ?include_tokens=true
  tokens?: GammaToken[];
  // Flat probability fields on some endpoints
  outcomePrices?: string;          // JSON string e.g. '["0.28","0.72"]'
  // Liquidity / volume in USD (not millions — raw dollars)
  liquidityNum?: number;
  volumeNum?: number;
  volume24hr?: number;
  // Status
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  // Tags
  tags?: Array<{ id: string; label: string; slug?: string }>;
}

// ── Keyword → Bundle classification map ──────────────────────────────────────

// ── Blocklist: topics that must NEVER appear in any bundle ────────────────────
// If ANY of these phrases appear in the market title, the market is dropped entirely.
const BLOCKLIST_PHRASES: string[] = [
  // Sports & games
  "gta", "grand theft auto", "world cup", "fifa", "masters tournament",
  "champions league", "super bowl", "nba", "nfl", "mlb", "nhl", "ufc",
  "wimbledon", "us open", "french open", "australian open", "formula 1",
  "f1", "pga", "golf", "tennis", "soccer", "football championship",
  "basketball", "baseball", "hockey", "olympic", "esport",
  // Entertainment / pop culture
  "oscar", "grammy", "emmy", "golden globe", "box office", "film",
  "movie", "album", "song", "taylor swift", "spotify", "netflix",
  "youtube", "twitch", "celebrity", "kardashian",
  // Crypto / meme speculative
  "dogecoin", "shiba", "memecoin", "nft ", "metaverse", "minecraft",
  "fortnite", "roblox", "pokemon", "anime",
  // Religion / supernatural / joke markets
  "jesus christ", "god ", "alien", "ufo", "extraterrestrial", "bigfoot",
  "zombie", "apocalypse",
  // Unrelated science
  "measles", "covid", "pandemic", "flu ", "hurricane name",
];

// ── Category keyword bundles — require ≥2 distinct keywords to match ──────────
// Each entry has a required minimum match count to reduce false positives.
interface BundleEntry {
  keywords: string[];
  bundleId: string;
  category: string;
  minMatches: number; // minimum distinct keywords that must match
}

const KEYWORD_BUNDLE_MAP: BundleEntry[] = [
  {
    // Energy / oil shock — strict commodity terms only
    keywords: [
      "crude oil", "oil price", "oil shock", "opec", "brent", "wti",
      "petroleum", "natural gas", "lng", "gasoline price", "fuel price",
      "energy price", "oil barrel", "oil supply", "oil demand",
    ],
    bundleId: "oil-shock",
    category: "ENERGY",
    minMatches: 1, // these are very specific, 1 match is fine
  },
  {
    // AI regulation — must mention AI governance/policy specifically
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
    // Geopolitics — military/territorial conflict specific
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
    // US Politics — election and governance specific
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
    // Macro / inflation — financial indicators
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

  // ── Hard blocklist check — drop market entirely if any phrase matches ──────
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

// ── Parse probability from multiple field shapes ──────────────────────────────

function parseProbability(raw: GammaMarket): number {
  // Shape 1: tokens array with price per outcome
  if (raw.tokens && raw.tokens.length > 0) {
    const yesToken = raw.tokens.find(
      (t) => t.outcome.toLowerCase() === "yes"
    );
    if (yesToken && typeof yesToken.price === "number") {
      return Math.round(yesToken.price * 100);
    }
    // fallback: use first token price
    const first = raw.tokens[0];
    if (typeof first?.price === "number") return Math.round(first.price * 100);
  }

  // Shape 2: outcomePrices JSON string '["0.28","0.72"]'
  if (raw.outcomePrices) {
    try {
      const prices = JSON.parse(raw.outcomePrices) as (string | number)[];
      const first = parseFloat(String(prices[0] ?? "0.5"));
      if (!isNaN(first)) return Math.round(first * 100);
    } catch {
      // ignore
    }
  }

  return 50; // unknown — default to 50%
}

function normaliseMarket(raw: GammaMarket): Market | null {
  // Skip closed / archived markets
  if (raw.closed === true || raw.archived === true) return null;
  if (raw.active === false) return null;

  const tagLabels = (raw.tags ?? []).map((t) => t.label.toLowerCase());
  const { bundleIds, category } = classifyMarket(
    raw.question ?? "",
    raw.description ?? "",
    tagLabels
  );

  // Only keep markets that map to at least one bundle
  if (bundleIds.length === 0) return null;

  const probability = parseProbability(raw);
  // Filter out already-resolved markets (price pinned at 0 or 100)
  if (probability <= 1 || probability >= 99) return null;

  return {
    id: raw.id,
    title: raw.question,
    probability,
    // Gamma API returns raw USD — convert to millions (cap at $999M)
    liquidity: Math.min((raw.liquidityNum ?? 0) / 1_000_000, 999),
    volume: Math.min((raw.volumeNum ?? 0) / 1_000_000, 999),
    category,
    direction: "YES",
    tags: tagLabels,
    bundleIds,
  };
}

// ── Gamma API fetch ───────────────────────────────────────────────────────────

// Fetch in two passes to maximise coverage:
//   1. Top 200 by volume (most liquid / high-signal markets)
//   2. An additional 200 by liquidity (sometimes different set)
const GAMMA_ENDPOINTS = [
  "https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=200&order=volumeNum&ascending=false",
  "https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=200&order=liquidityNum&ascending=false",
];

// ── In-memory cache ───────────────────────────────────────────────────────────

const TTL_MS = 5 * 60 * 1_000; // 5 minutes

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
    // Fetch both endpoints in parallel
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

    _cache = normalised;
    _fetchedAt = new Date();
    _source = "live";

    console.log(
      `[polymarket_service] ✅ Live data: ${normalised.length} markets from ${rawMarkets.length} raw (Gamma API)`
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
