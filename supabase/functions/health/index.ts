/**
 * health/index.ts
 * Returns the current state of the Polymarket data connection.
 * Used by the frontend to show a "Live / Mock" badge.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCacheStatus, getPolymarkets } from "../_shared/polymarket_service.ts";

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
    // Trigger a market fetch so the cache is warm and status is accurate
    await getPolymarkets();
    const status = getCacheStatus();

    return new Response(
      JSON.stringify({
        dataSource: status.source,
        marketCount: status.size,
        cachedAt: status.fetchedAt?.toISOString() ?? null,
        polymarketApiUrl: "https://gamma-api.polymarket.com/markets",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
