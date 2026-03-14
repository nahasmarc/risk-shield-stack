/**
 * usePolymarkets.ts
 * Fetches live market data from the /markets edge function and merges it
 * with static bundle metadata from bundles.ts.
 * Falls back to static HEDGE_BUNDLES / LIVE_SIGNALS_BASE if the API is unavailable.
 * Refreshes every 60 seconds.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  HEDGE_BUNDLES,
  LIVE_SIGNALS_BASE,
  type HedgeBundle,
  type LiveSignal,
  type Contract,
} from "@/data/bundles";

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

export interface PolymarketsState {
  bundles: HedgeBundle[];
  signals: LiveSignal[];
  markets: Market[];
  loading: boolean;
  error: string | null;
  dataSource: "live" | "mock";
  lastFetched: Date | null;
}

const REFRESH_INTERVAL_MS = 60_000;

// Merge live markets into a static bundle shell, replacing contracts.
function buildBundleFromMarkets(
  staticBundle: HedgeBundle,
  markets: Market[]
): HedgeBundle {
  const bundleMarkets = markets.filter((m) =>
    m.bundleIds.includes(staticBundle.id)
  );
  if (bundleMarkets.length === 0) return staticBundle;

  const contracts: Contract[] = bundleMarkets.map((m) => ({
    id: m.id,
    title: m.title,
    probability: m.probability,
    liquidity: m.liquidity,
    volume: m.volume,
    category: m.category,
    direction: m.direction,
  }));

  return { ...staticBundle, contracts };
}

// Derive the top 8 most-liquid markets as live signals.
function buildSignalsFromMarkets(
  markets: Market[],
  bundles: HedgeBundle[]
): LiveSignal[] {
  const colorMap: Record<string, string> = {};
  for (const b of bundles) {
    colorMap[b.id] = b.categoryColor;
  }

  const sorted = [...markets].sort((a, b) => b.liquidity - a.liquidity);
  const top8 = sorted.slice(0, 8);
  if (top8.length === 0) return LIVE_SIGNALS_BASE;

  return top8.map((m, i) => {
    const bundleId = m.bundleIds[0] ?? "";
    const staticSignal = LIVE_SIGNALS_BASE[i];
    return {
      id: `ls-live-${m.id}`,
      contractTitle:
        m.title.length > 42 ? m.title.slice(0, 42) + "…" : m.title,
      bundleCategory: m.category,
      categoryColor:
        colorMap[bundleId] ?? staticSignal?.categoryColor ?? "#6366F1",
      probability: m.probability,
      change: staticSignal?.change ?? 0,
    };
  });
}

export function usePolymarkets(): PolymarketsState {
  const [state, setState] = useState<PolymarketsState>({
    bundles: HEDGE_BUNDLES,
    signals: LIVE_SIGNALS_BASE,
    markets: [],
    loading: true,
    error: null,
    dataSource: "mock",
    lastFetched: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMarkets = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("markets");

      if (error) throw new Error(error.message);
      if (!data?.markets) throw new Error("No markets in response");

      const markets: Market[] = data.markets;
      const source: "live" | "mock" = data.dataSource ?? "mock";

      const liveBundles = HEDGE_BUNDLES.map((b) =>
        buildBundleFromMarkets(b, markets)
      );
      const liveSignals = buildSignalsFromMarkets(markets, liveBundles);

      setState({
        bundles: liveBundles,
        signals: liveSignals,
        markets,
        loading: false,
        error: null,
        dataSource: source,
        lastFetched: new Date(),
      });
    } catch (err) {
      console.warn(
        "[usePolymarkets] API unavailable, using static fallback:",
        err
      );
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
        dataSource: "mock",
      }));
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
    intervalRef.current = setInterval(fetchMarkets, REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchMarkets]);

  return state;
}
