// Razorpay Create Order — Server-side order creation.
// The frontend calls this to get a real Razorpay order_id before opening checkout.
// NEVER create orders on the frontend — the key secret lives only here.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { playerId, itemId, itemName, amountUsd, amountDna, energyReward, pillar } = await req.json();

    if (!playerId || !amountUsd || !amountDna) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!keyId || !keySecret) {
      return new Response(JSON.stringify({ error: "Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET as edge function secrets." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Razorpay expects amount in paise (for INR) or smallest currency unit.
    // We convert USD to INR at a fixed rate if needed, but Razorpay also supports USD.
    // Using INR since the user is India-based. Rate: 1 USD ≈ 83 INR (approximate).
    const inrAmount = Math.round(amountUsd * 83 * 100); // convert to paise

    // 1. Create order on Razorpay
    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(keyId + ":" + keySecret),
      },
      body: JSON.stringify({
        amount: inrAmount,
        currency: "INR",
        receipt: "rcpt_" + playerId + "_" + Date.now(),
        notes: {
          player_id: playerId,
          item_id: itemId,
          item_name: itemName,
          amount_usd: String(amountUsd),
          amount_dna: String(amountDna),
          energy_reward: String(energyReward || 0),
          pillar: pillar || "fiat",
        },
      }),
    });

    if (!orderRes.ok) {
      const errText = await orderRes.text();
      return new Response(JSON.stringify({ error: "Razorpay order creation failed", details: errText }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const order = await orderRes.json();

    // 2. Insert payment_orders row as pending
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase.from("payment_orders").insert({
      player_id: playerId,
      pillar: pillar || "fiat",
      item_id: itemId,
      amount_usd: amountUsd,
      amount_dna: amountDna,
      status: "pending",
      provider: "razorpay",
      provider_order_id: order.id,
      webhook_verified: false,
    });

    // 3. Return order details + key_id (safe to expose key_id on frontend)
    return new Response(JSON.stringify({
      ok: true,
      orderId: order.id,
      keyId: keyId,
      amount: inrAmount,
      currency: "INR",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
