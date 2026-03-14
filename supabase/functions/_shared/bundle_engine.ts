/**
 * bundle_engine.ts
 * Matches a detected risk category to the best hedge bundle(s).
 * Scores bundles by category match, tag overlap, and probability weight.
 */

import { type ParsedRisk } from "./risk_parser.ts";
import { getAllMarkets } from "./market_fetcher.ts";

export interface BundleContract {
  id: string;
  title: string;
  probability: number;
  liquidity: number;
  volume: number;
  category: string;
  direction: "YES" | "NO";
}

export interface HedgeBundle {
  id: string;
  title: string;
  description: string;
  category: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  tags: string[];
  contracts: BundleContract[];
}

export interface BundleMatch {
  bundle: HedgeBundle;
  matchScore: number;       // 0–100
  matchReasons: string[];
}

// Static bundle catalogue — mirrors src/data/bundles.ts
const BUNDLES: HedgeBundle[] = [
  {
    id: "oil-shock",
    title: "Oil Shock Protection",
    description:
      "Guards against a sudden spike in global oil prices driven by OPEC+ supply cuts, Middle East escalation, or sanctions that threaten energy infrastructure.",
    category: "ENERGY",
    riskLevel: "HIGH",
    tags: ["energy", "commodities", "geopolitics", "inflation"],
    contracts: [],
  },
  {
    id: "ai-regulation",
    title: "AI Regulation Risk",
    description:
      "Protects against sudden regulatory clampdowns on AI development including model bans, liability laws, and antitrust actions targeting Big Tech AI divisions.",
    category: "TECHNOLOGY",
    riskLevel: "MEDIUM",
    tags: ["AI", "regulation", "big-tech", "EU", "legislation"],
    contracts: [],
  },
  {
    id: "taiwan-conflict",
    title: "Taiwan Conflict Hedge",
    description:
      "Provides coverage for the economic and supply chain impact of a Taiwan Strait crisis, including semiconductor disruption, US sanctions, and tech sector collapse.",
    category: "GEOPOLITICS",
    riskLevel: "CRITICAL",
    tags: ["taiwan", "china", "semiconductors", "geopolitics", "supply-chain"],
    contracts: [],
  },
  {
    id: "us-election-volatility",
    title: "US Election Volatility",
    description:
      "Shields against electoral uncertainty including contested results, sharp policy reversals, and the equity market correction that historically follows high-tension election cycles.",
    category: "POLITICS",
    riskLevel: "HIGH",
    tags: ["election", "US politics", "volatility", "policy", "markets"],
    contracts: [],
  },
  {
    id: "inflation-spike",
    title: "Inflation Spike Protection",
    description:
      "Hedges against a resurgence of inflation driven by energy shocks, fiscal stimulus, or dollar weakness, including Fed rate hike risk and commodity price surges.",
    category: "MACRO",
    riskLevel: "MEDIUM",
    tags: ["inflation", "CPI", "Fed", "commodities", "dollar", "rates"],
    contracts: [],
  },
];

const CATEGORY_TO_BUNDLE: Record<string, string> = {
  ENERGY:      "oil-shock",
  TECHNOLOGY:  "ai-regulation",
  GEOPOLITICS: "taiwan-conflict",
  POLITICS:    "us-election-volatility",
  MACRO:       "inflation-spike",
};

async function hydrateBundleContracts(bundle: HedgeBundle): Promise<HedgeBundle> {
  const markets = await getAllMarkets({ bundleId: bundle.id });
  return {
    ...bundle,
    contracts: markets.map((m) => ({
      id: m.id,
      title: m.title,
      probability: m.probability,
      liquidity: m.liquidity,
      volume: m.volume,
      category: m.category,
      direction: m.direction,
    })),
  };
}

export async function matchBundle(risk: ParsedRisk, sectors?: string[]): Promise<BundleMatch[]> {
  const results: BundleMatch[] = [];

  for (const rawBundle of BUNDLES) {
    const bundle = await hydrateBundleContracts(rawBundle);
    let score = 0;
    const reasons: string[] = [];

    // 1. Category exact match — 50 pts
    const primaryBundleId = CATEGORY_TO_BUNDLE[risk.riskCategory];
    if (bundle.id === primaryBundleId) {
      score += 50;
      reasons.push(`Exact category match: ${risk.riskCategory}`);
    }

    // 2. Bundle ID match from risk_parser — 30 pts
    if (risk.bundleId && bundle.id === risk.bundleId) {
      score += 30;
      reasons.push("Bundle ID confirmed by AI parser");
    }

    // 3. Keyword / tag overlap — up to 15 pts
    const riskTerms = [...risk.keywords, risk.riskLabel.toLowerCase()].map((k) => k.toLowerCase());
    const bundleTags = bundle.tags.map((t) => t.toLowerCase());
    const tagHits = bundleTags.filter((t) =>
      riskTerms.some((rt) => rt.includes(t) || t.includes(rt))
    ).length;
    if (tagHits > 0) {
      const tagScore = Math.min(tagHits * 5, 15);
      score += tagScore;
      reasons.push(`${tagHits} matching tag(s): ${bundleTags.slice(0, 3).join(", ")}`);
    }

    // 4. Sector overlap — up to 5 pts
    if (sectors && sectors.length > 0) {
      const sectorLower = sectors.map((s) => s.toLowerCase());
      const sectorHit = bundleTags.some((t) => sectorLower.some((s) => s.includes(t) || t.includes(s)));
      if (sectorHit) {
        score += 5;
        reasons.push("Sector overlap detected");
      }
    }

    // 5. Confidence scaling: high confidence → slightly higher score
    score = Math.round(score * (0.85 + (risk.confidence / 100) * 0.15));

    if (score > 5) {
      results.push({ bundle, matchScore: Math.min(score, 100), matchReasons: reasons });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.matchScore - a.matchScore);
  return results;
}

export async function getBestBundle(risk: ParsedRisk, sectors?: string[]): Promise<BundleMatch | null> {
  const matches = await matchBundle(risk, sectors);
  return matches[0] ?? null;
}
