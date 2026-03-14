import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    // Parse order request
    const {
      tokenId,
      side,
      size,
      price,
      bundleId,
      bundleTitle,
      contractId,
      contractTitle,
    } = await req.json();

    if (!tokenId || !side || !size || !price) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: tokenId, side, size, price" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Paper trade simulation — record order directly as "simulated"
    // Real on-chain trading requires EIP-712 wallet signing (MetaMask/WalletConnect)
    const { error: insertError } = await supabase.from("orders").insert({
      user_id: userId,
      bundle_id: bundleId || "unknown",
      bundle_title: bundleTitle || "Unknown Bundle",
      contract_id: contractId || tokenId,
      contract_title: contractTitle || tokenId,
      side: side.toUpperCase(),
      size: parseFloat(size),
      price: parseFloat(price),
      status: "simulated",
      polymarket_order_id: null,
    });

    if (insertError) {
      console.error("Order insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to record simulated order." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        simulated: true,
        message: "Paper trade recorded. Real orders require wallet integration (EIP-712).",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("place-order error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
