import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parseRisk } from "../_shared/risk_parser.ts";
import { matchBundle } from "../_shared/bundle_engine.ts";
import { simulateBundle } from "../_shared/scenario_simulator.ts";

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
    const body = await req.json();
    const assets: string[] = Array.isArray(body.assets) ? body.assets : [];
    const sectors: string[] = Array.isArray(body.sectors) ? body.sectors : [];
    const coverage: number = typeof body.coverage === "number" ? body.coverage : 10000;

    if (assets.length === 0 && sectors.length === 0) {
      return new Response(
        JSON.stringify({ error: "Provide at least one asset or sector." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (assets.length + sectors.length > 50) {
      return new Response(
        JSON.stringify({ error: "Too many assets/sectors (max 50 combined)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (coverage < 100 || coverage > 10_000_000) {
      return new Response(
        JSON.stringify({ error: "coverage must be between 100 and 10,000,000 USD." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build a single text blob from assets + sectors for risk parsing
    const inputText = [...assets, ...sectors].join(", ");
    const detectedRisk = await parseRisk(inputText);

    const bundleMatches = await matchBundle(detectedRisk, sectors);

    // Run scenario simulation for each matched bundle (top 3)
    const suggestedHedges = bundleMatches.slice(0, 3).map((bm) => {
      const simulation = simulateBundle(bm.bundle, coverage / Math.min(bundleMatches.length, 3));
      return {
        bundle: bm.bundle,
        matchScore: bm.matchScore,
        matchReasons: bm.matchReasons,
        simulation,
      };
    });

    // Portfolio risk score: weighted by confidence and number of matches
    const portfolioRiskScore = Math.min(
      Math.round(
        (detectedRisk.confidence * 0.7) +
        (Math.min(bundleMatches.length, 5) / 5) * 30
      ),
      100
    );

    return new Response(
      JSON.stringify({
        detectedRisk,
        riskExposures: [
          {
            category: detectedRisk.riskCategory,
            label: detectedRisk.riskLabel,
            confidence: detectedRisk.confidence,
            keywords: detectedRisk.keywords,
            reasoning: detectedRisk.reasoning,
          },
        ],
        suggestedHedges,
        portfolioRiskScore,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("analyze-portfolio error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
