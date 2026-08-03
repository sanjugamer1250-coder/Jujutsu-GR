// Server-Authoritative Gacha Roll
// The frontend NEVER calculates RNG or deducts balances.
// This edge function: 1) reads the player's secure balance, 2) deducts the gacha cost,
// 3) rolls the RNG server-side, 4) logs to the immutable ledger, 5) returns the result.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GACHA_COST = 500;
const PITY_THRESHOLD = 10;

// Character pool with pull rates (must match frontend characters.ts)
const POOL = [
  { id: "yuji", name: "Yuji Itadori", rarity: "Grade4", pullRate: 83.5 },
  { id: "nobara", name: "Nobara Kugisaki", rarity: "Grade3", pullRate: 5 },
  { id: "megumi", name: "Megumi Fushiguro", rarity: "Grade2", pullRate: 8 },
  { id: "maki", name: "Maki Zenin", rarity: "Grade2", pullRate: 0.3 },
  { id: "todo", name: "Aoi Todo", rarity: "Grade2", pullRate: 0.05 },
  { id: "inumaki", name: "Toge Inumaki", rarity: "Grade3", pullRate: 0.1 },
  { id: "nanami", name: "Kento Nanami", rarity: "Grade2", pullRate: 0.5 },
  { id: "toji", name: "Toji Fushiguro", rarity: "Grade1", pullRate: 0.8 },
  { id: "mahito", name: "Mahito", rarity: "Grade1", pullRate: 0.04 },
  { id: "jogo", name: "Jogo", rarity: "Grade1", pullRate: 0.01 },
  { id: "gojo", name: "Satoru Gojo", rarity: "Special", pullRate: 1.5 },
  { id: "sukuna", name: "Ryomen Sukuna", rarity: "Special", pullRate: 0.2 },
];

function rollGacha(pityCounter: number): { char: typeof POOL[0]; newPity: number } {
  let newPity = pityCounter + 1;
  let char: typeof POOL[0];

  if (newPity >= PITY_THRESHOLD) {
    // Pity: guaranteed Grade2+
    const pool = POOL.filter((c) => ["Grade2", "Grade1", "Special"].includes(c.rarity));
    const total = pool.reduce((s, c) => s + c.pullRate, 0);
    let r = Math.random() * total;
    char = pool[0];
    for (const c of pool) { r -= c.pullRate; if (r <= 0) { char = c; break; } }
    newPity = 0;
  } else {
    const total = POOL.reduce((s, c) => s + c.pullRate, 0);
    let r = Math.random() * total;
    char = POOL[0];
    for (const c of POOL) { r -= c.pullRate; if (r <= 0) { char = c; break; } }
    if (["Grade2", "Grade1", "Special"].includes(char.rarity)) newPity = 0;
  }
  return { char, newPity };
}

function genTxHash(): string {
  return "TX-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { playerId, multi = 1 } = await req.json();
    if (!playerId) return new Response(JSON.stringify({ error: "Missing playerId" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Read secure balance
    const { data: balance, error: balErr } = await supabase
      .from("player_balances")
      .select("dna")
      .eq("player_id", playerId)
      .maybeSingle();

    if (balErr) throw balErr;
    if (!balance) {
      // Auto-create balance row for new players
      await supabase.from("player_balances").insert({ player_id: playerId, dna: 1000 });
    }

    const currentDna = balance?.dna ?? 1000;
    const totalCost = GACHA_COST * multi;

    if (currentDna < totalCost) {
      return new Response(JSON.stringify({ error: "Insufficient 🧬 DNA", balance: currentDna }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. Deduct balance server-side
    const newBalance = currentDna - totalCost;
    await supabase.from("player_balances").update({ dna: newBalance, updated_at: new Date().toISOString() }).eq("player_id", playerId);

    // 3. Roll RNG server-side
    let pityCounter = 0;
    const results = [];
    for (let i = 0; i < multi; i++) {
      const { char, newPity } = rollGacha(pityCounter);
      pityCounter = newPity;
      results.push(char);
    }

    // 4. Log to immutable ledger
    await supabase.from("transaction_ledger").insert({
      tx_hash: genTxHash(),
      player_id: playerId,
      type: "summon",
      amount: -totalCost,
      direction: "out",
      note: `Gacha summon x${multi}: ${results.map(r => r.name).join(", ")}`,
      balance_after: newBalance,
    });

    // 5. Return result
    return new Response(JSON.stringify({
      ok: true,
      results,
      newBalance,
      cost: totalCost,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
