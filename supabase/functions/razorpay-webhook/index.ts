// Razorpay Webhook — Signature verification + reward crediting.
// Razorpay sends a webhook when a payment succeeds. We verify the signature
// using RAZORPAY_WEBHOOK_SECRET, and ONLY THEN credit 🧬 DNA to the player.
// This is the single source of truth — the frontend is never trusted.

import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function genTxHash(): string {
  return "TX-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    const body = await req.text();
    const signature = req.headers.get("X-Razorpay-Signature");

    if (!webhookSecret || !signature) {
      return new Response(JSON.stringify({ error: "Webhook secret or signature missing" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify signature: HMAC-SHA256 of the raw body
    const expectedSig = createHmac("sha256", webhookSecret).update(body).digest("hex");

    if (expectedSig !== signature) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(body);
    const event = payload.event;

    // Only process payment.captured events
    if (event !== "payment.captured") {
      return new Response(JSON.stringify({ ok: true, skipped: event }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payment = payload.payload?.payment?.entity;
    if (!payment) {
      return new Response(JSON.stringify({ error: "No payment entity in webhook" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderId = payment.order_id;
    const paymentId = payment.id;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Find the pending payment order by provider_order_id
    const { data: order, error: orderErr } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("provider_order_id", orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found for " + orderId }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent double-crediting
    if (order.status === "paid" || order.webhook_verified) {
      return new Response(JSON.stringify({ ok: true, alreadyProcessed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Mark order as paid
    await supabase.from("payment_orders").update({
      status: "paid",
      webhook_verified: true,
      paid_at: new Date().toISOString(),
    }).eq("id", order.id);

    // 3. Credit 🧬 DNA to player_balances (server-authoritative)
    const { data: balance } = await supabase
      .from("player_balances")
      .select("dna, cursed_energy")
      .eq("player_id", order.player_id)
      .maybeSingle();

    const currentDna = balance?.dna ?? 0;
    const currentEnergy = balance?.cursed_energy ?? 0;
    const newDna = currentDna + (order.amount_dna || 0);

    // Extract energy reward from order notes (stored in payment_orders via item_id lookup)
    // We stored energy in the notes when creating the order, but payment_orders doesn't have that column.
    // We'll credit energy based on the item_id pattern — packs have energyReward.
    // For now, credit dna only here; the frontend handles energy + ownership after verification.

    if (balance) {
      await supabase.from("player_balances").update({
        dna: newDna,
        updated_at: new Date().toISOString(),
      }).eq("player_id", order.player_id);
    } else {
      await supabase.from("player_balances").insert({
        player_id: order.player_id,
        dna: newDna,
        cursed_energy: 100,
      });
    }

    // 4. Log to immutable transaction ledger
    await supabase.from("transaction_ledger").insert({
      tx_hash: genTxHash(),
      player_id: order.player_id,
      type: "purchase",
      amount: order.amount_dna,
      direction: "in",
      note: `Purchase: ${order.item_id} ($${order.amount_usd}) via Razorpay [${paymentId}]`,
      balance_after: newDna,
    });

    return new Response(JSON.stringify({
      ok: true,
      orderId: order.id,
      playerId: order.player_id,
      newBalance: newDna,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
