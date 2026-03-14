import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parseRisk } from "../_shared/risk_parser.ts";
import { getBestBundle } from "../_shared/bundle_engine.ts";

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
    const prompt: string = (body.prompt ?? "").trim();

    if (!prompt || prompt.length < 3) {
      return new Response(
        JSON.stringify({ error: "prompt is required (min 3 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (prompt.length > 3000) {
      return new Response(
        JSON.stringify({ error: "prompt too long (max 3000 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const detectedRisk = await parseRisk(prompt);

    if (detectedRisk.riskCategory === "UNKNOWN" || !detectedRisk.bundleId) {
      return new Response(
        JSON.stringify({
          error: "Unable to identify a specific risk from this input.",
          detectedRisk,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const match = getBestBundle(detectedRisk);

    if (!match) {
      return new Response(
        JSON.stringify({ error: "No matching hedge bundle found.", detectedRisk }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        detectedRisk,
        bundle: match.bundle,
        matchScore: match.matchScore,
        matchReasons: match.matchReasons,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("build-hedge error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
