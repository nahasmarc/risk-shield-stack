/**
 * src/lib/api.ts
 * Typed fetch helpers for the Netira AI backend edge functions.
 * All calls go through Supabase edge functions.
 */

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// ── Shared types mirroring the edge function responses ──────────────────────

export interface DetectedRisk {
  riskCategory: "ENERGY" | "TECHNOLOGY" | "GEOPOLITICS" | "POLITICS" | "MACRO" | "UNKNOWN";
  riskLabel: string;
  confidence: number;
  keywords: string[];
  reasoning: string;
  bundleId: string;
  // Granular risk signal fields
  riskType: string;   // e.g. "commodity shock", "military escalation"
  sector: string;     // e.g. "energy", "technology"
  region: string;     // e.g. "middle east", "east asia", "global"
}

export interface ApiContract {
  id: string;
  title: string;
  probability: number;
  liquidity: number;
  volume: number;
  category: string;
  direction: "YES" | "NO";
}

export interface ApiBundle {
  id: string;
  title: string;
  description: string;
  category: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  tags: string[];
  contracts: ApiContract[];
}

export interface Market {
  id: string;
  title: string;
  probability: number;
  liquidity: number;
  volume: number;
  category: string;
  direction: "YES" | "NO";
  tags: string[];
  bundleIds: string[];
}

export interface ContractScenario {
  contractId: string;
  contractTitle: string;
  probability: number;
  direction: "YES" | "NO";
  position: number;
  yesPayoff: number;
  noPayoff: number;
  expectedPayoff: number;
}

export interface SimulationResult {
  expectedPayoff: number;
  bestCase: number;
  worstCase: number;
  hedgeCost: number;
  coverageRatio: number;
  breakEven: number;
  scenarios: ContractScenario[];
}

// ── POST /build-hedge ────────────────────────────────────────────────────────

export interface BuildHedgeResponse {
  detectedRisk: DetectedRisk;
  bundle: ApiBundle;
  matchScore: number;
  matchReasons: string[];
}

export async function buildHedge(prompt: string): Promise<BuildHedgeResponse> {
  const res = await fetch(`${BASE_URL}/build-hedge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    if (res.status === 429) throw new Error("Rate limit reached — please wait a moment before retrying.");
    if (res.status === 402) throw new Error("AI credits exhausted — please top up your workspace.");
    throw new Error(err.error ?? `Request failed (${res.status})`);
  }

  return res.json();
}

// ── GET /markets ─────────────────────────────────────────────────────────────

export interface MarketsParams {
  category?: string;
  minLiquidity?: number;
  bundleId?: string;
  tags?: string[];
}

export interface MarketsResponse {
  markets: Market[];
  total: number;
}

export async function getMarkets(params?: MarketsParams): Promise<MarketsResponse> {
  const url = new URL(`${BASE_URL}/markets`);
  if (params?.category) url.searchParams.set("category", params.category);
  if (params?.minLiquidity !== undefined)
    url.searchParams.set("minLiquidity", String(params.minLiquidity));
  if (params?.bundleId) url.searchParams.set("bundleId", params.bundleId);
  if (params?.tags?.length) url.searchParams.set("tags", params.tags.join(","));

  const res = await fetch(url.toString(), {
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error ?? `Request failed (${res.status})`);
  }

  return res.json();
}

// ── POST /news-hedge ─────────────────────────────────────────────────────────

export interface NewsHedgeResponse {
  detectedRisk: DetectedRisk;
  bundle: ApiBundle;
  confidence: number;
  matchScore: number;
  matchReasons: string[];
  relevantMarkets: Market[];
}

export async function newsHedge(text: string): Promise<NewsHedgeResponse> {
  const res = await fetch(`${BASE_URL}/news-hedge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    if (res.status === 429) throw new Error("Rate limit reached — please wait a moment before retrying.");
    if (res.status === 402) throw new Error("AI credits exhausted — please top up your workspace.");
    if (res.status === 422) throw new Error(err.error ?? "Unable to identify a risk from this text.");
    throw new Error(err.error ?? `Request failed (${res.status})`);
  }

  return res.json();
}

// ── POST /analyze-portfolio ───────────────────────────────────────────────────

export interface PortfolioRiskExposure {
  category: string;
  label: string;
  confidence: number;
  keywords: string[];
  reasoning: string;
}

export interface SuggestedHedge {
  bundle: ApiBundle;
  matchScore: number;
  matchReasons: string[];
  simulation: SimulationResult;
}

export interface AnalyzePortfolioResponse {
  detectedRisk: DetectedRisk;
  riskExposures: PortfolioRiskExposure[];
  suggestedHedges: SuggestedHedge[];
  portfolioRiskScore: number;
}

export async function analyzePortfolio(
  assets: string[],
  sectors?: string[],
  coverage?: number
): Promise<AnalyzePortfolioResponse> {
  const res = await fetch(`${BASE_URL}/analyze-portfolio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assets, sectors, coverage }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    if (res.status === 429) throw new Error("Rate limit reached — please wait a moment before retrying.");
    if (res.status === 402) throw new Error("AI credits exhausted — please top up your workspace.");
    throw new Error(err.error ?? `Request failed (${res.status})`);
  }

  return res.json();
}
