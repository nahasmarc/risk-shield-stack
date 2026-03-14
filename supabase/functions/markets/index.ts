import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAllMarkets, type MarketsFilter } from "../_shared/market_fetcher.ts";
import { getCacheStatus } from "../_shared/polymarket_service.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const filter: MarketsFilter = {};

    const category = url.searchParams.get("category");
    if (category) filter.category = category.toUpperCase();

    const minLiquidity = url.searchParams.get("minLiquidity");
    if (minLiquidity) {
      const parsed = parseFloat(minLiquidity);
      if (!isNaN(parsed)) filter.minLiquidity = parsed;
    }

    const bundleId = url.searchParams.get("bundleId");
    if (bundleId) filter.bundleId = bundleId;

    const tags = url.searchParams.get("tags");
    if (tags) filter.tags = tags.split(",").map((t) => t.trim()).filter(Boolean);

    const markets = await getAllMarkets(filter);
    const cacheStatus = getCacheStatus();

    return new Response(
      JSON.stringify({
        markets,
        total: markets.length,
        dataSource: cacheStatus.source,
        cachedAt: cacheStatus.fetchedAt?.toISOString() ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("markets error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
