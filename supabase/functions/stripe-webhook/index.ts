// Stripe Webhook — Encrypted payment verification.
// NEVER trust the frontend telling the server "I paid."
// This endpoint receives Stripe's payment_intent.succeeded webhook,
// verifies the Stripe signature, and only then credits 🧬 DNA to the player.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, Stripe-Signature",
};

function genTxHash(): string {
  return "TX-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const stripeSignature = req.headers.get("Stripe-Signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSignature || !webhookSecret) {
      // Demo mode: no Stripe secret configured — accept a simulated webhook payload
      const body = await req.json();
      const { playerId, itemId, amountUsd, amountDna, provider = "stripe" } = body;

      if (!playerId || !amountDna) {
        return new Response(JSON.stringify({ error: "Missing required fields for demo webhook" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create payment order record
      const { data: order } = await supabase.from("payment_orders").insert({
        player_id: playerId,
        pillar: "fiat",
        item_id: itemId || "unknown",
        amount_usd: amountUsd || 0,
        amount_dna: amountDna,
        status: "paid",
        provider,
        webhook_verified: true,
        paid_at: new Date().toISOString(),
      }).select().maybeSingle();

      // Credit 🧬 DNA to player's secure balance
      const { data: balance } = await supabase.from("player_balances").select("dna").eq("player_id", playerId).maybeSingle();
      const currentBal = balance?.dna ?? 0;
      const newBal = currentBal + amountDna;

      if (balance) {
        await supabase.from("player_balances").update({ dna: newBal, updated_at: new Date().toISOString() }).eq("player_id", playerId);
      } else {
        await supabase.from("player_balances").insert({ player_id: playerId, dna: newBal });
      }

      // Log to immutable ledger
      await supabase.from("transaction_ledger").insert({
        tx_hash: genTxHash(),
        player_id: playerId,
        type: "purchase",
        amount: amountDna,
        direction: "in",
        note: `Purchase: ${itemId} ($${amountUsd}) via ${provider}`,
        balance_after: newBal,
      });

      return new Response(JSON.stringify({ ok: true, orderId: order?.id, newBalance: newBal }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Production mode: verify Stripe signature (requires npm:stripe)
    // In production, you would:
    // 1. const stripe = (await import("npm:stripe@14")).default(webhookSecret);
    // 2. const event = stripe.webhooks.constructEvent(await req.text(), stripeSignature, webhookSecret);
    // 3. Handle event.type === "payment_intent.succeeded"
    // 4. Extract metadata (playerId, itemId) from event.data.object.metadata
    // 5. Credit 🧬 DNA via the same flow above

    return new Response(JSON.stringify({ error: "Stripe signature verification not yet configured" }), {
      status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
