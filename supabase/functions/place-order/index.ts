import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CLOB_URL = "https://clob.polymarket.com";

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

    // Use getUser instead of deprecated getClaims
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    // Get user's Polymarket credentials
    const { data: creds, error: credsError } = await supabase
      .from("polymarket_credentials")
      .select("api_key, api_secret, api_passphrase")
      .eq("user_id", userId)
      .single();

    if (credsError || !creds) {
      return new Response(
        JSON.stringify({ error: "No Polymarket credentials found. Please add them in Settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Build CLOB API request with HMAC authentication
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = "POST";
    const path = "/order";
    const body = JSON.stringify({
      tokenID: tokenId,
      side: side.toUpperCase(),
      size: parseFloat(size),
      price: parseFloat(price),
      type: "GTC", // Good Till Cancelled
    });

    // HMAC-SHA256 signature for Polymarket CLOB
    const message = timestamp + method + path + body;
    const hmac = createHmac("sha256", creds.api_secret);
    hmac.update(message);
    const signature = hmac.digest("base64");

    const clobResponse = await fetch(`${CLOB_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "POLY_API_KEY": creds.api_key,
        "POLY_SIGNATURE": signature,
        "POLY_TIMESTAMP": timestamp,
        "POLY_PASSPHRASE": creds.api_passphrase,
      },
      body,
    });

    const result = await clobResponse.json();

    if (!clobResponse.ok) {
      console.error("CLOB API error:", result);

      // Save failed order to history
      if (bundleId && contractId) {
        await supabase.from("orders").insert({
          user_id: userId,
          bundle_id: bundleId || "unknown",
          bundle_title: bundleTitle || "Unknown Bundle",
          contract_id: contractId || tokenId,
          contract_title: contractTitle || tokenId,
          side: side.toUpperCase(),
          size: parseFloat(size),
          price: parseFloat(price),
          status: "failed",
          polymarket_order_id: null,
        });
      }

      return new Response(
        JSON.stringify({ error: result.message || "Polymarket order failed", details: result }),
        { status: clobResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save successful order to history
    const orderId = result.orderID || result.id || null;
    await supabase.from("orders").insert({
      user_id: userId,
      bundle_id: bundleId || "unknown",
      bundle_title: bundleTitle || "Unknown Bundle",
      contract_id: contractId || tokenId,
      contract_title: contractTitle || tokenId,
      side: side.toUpperCase(),
      size: parseFloat(size),
      price: parseFloat(price),
      status: "filled",
      polymarket_order_id: orderId,
    });

    return new Response(JSON.stringify({ success: true, order: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("place-order error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
