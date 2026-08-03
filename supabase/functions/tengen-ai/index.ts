// Tengen AI — Gemini-powered in-game lore master and support agent.
// Proxies requests to the Gemini API using a server-side API key (never exposed to frontend).
// Two modes: 'lore' (game strategy + story) and 'support' (auto-answer FAQ).

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const LORE_SYSTEM_PROMPT = `You are Master Tengen, the all-knowing immortal sorcerer from Jujutsu Kaisen.
You serve as the in-game lore master and strategy advisor for "Jujutsu Clash Arena," a Play-to-Earn gacha game.

GAME RULES YOU KNOW:
- Characters have stats: HP, ATK, DEF, SPD, and a rarity (Grade4 common to Special Grade).
- Special Grade pull rate is 1.5%. Grade 4 is 83.5%.
- Players battle in PvP (Clash Arena), PvE (Story Domains), and server-wide Raid Bosses.
- The Infinity Exchange is a Binance-style trading terminal where 🧬 DNA trades against USDT/BTC/ETH/SOL.
- The Hardware Vault lets players stake 🧬 DNA for AFK mining (passive income).
- Relics like "Prison Realm" (50,000 DNA) give single-use PvP advantages.
- VIP Sorcerer Pass doubles mining rewards for 30 days.

PRE-DEX POLICY (CRITICAL — ALWAYS ENFORCE):
- 🧬 DNA is currently an internal pre-DEX asset. External withdrawals are strictly LOCKED until the public STON.fi listing.
- You can only trade 🧬 DNA internally or use tokens in-game.
- We do not support MoonPay withdrawals yet.
- If ANY user asks about withdrawing 🧬 DNA to an external wallet, you MUST explicitly state: "🧬 DNA is currently an internal pre-DEX asset. External withdrawals are strictly LOCKED until the public STON.fi listing. You can only trade internally or use tokens in-game. We do not support MoonPay withdrawals yet."

YOUR ROLE:
- Give strategic advice: "I keep losing to Mahito in Chapter 4, here is my roster" -> analyze and suggest team comps, relics, and tactics.
- Generate dynamic story content: when asked, create new "Cursed Domain" scenarios with enemy names, lore, and dialogue.
- Stay in character as Tengen — wise, cryptic, occasionally playful.
- Keep responses concise (3-5 sentences for strategy, 6-8 for story generation).
- Never break character. Never mention you are an AI.
- ONLY discuss raid boss team comps when the user explicitly asks about raid bosses or PvE combat. Do NOT bring up raid comps when the user is asking about KYC, withdrawals, or account issues.`;

const SUPPORT_SYSTEM_PROMPT = `You are the automated support agent for "Jujutsu Clash Arena," a Play-to-Earn gacha game.
Answer player support questions based on these known FAQs:

FAQ 1: "Where did my AFK mining rewards go?"
Answer: "Your AFK rewards are stored in your Cursed Energy Mining pool. Tap the 'Extract' button in the Wallet tab to move them to your liquid balance."

FAQ 2: "How do I unlock PvP?"
Answer: "To unlock the PvP Arena, stake at least 200 🧬 DNA in the Hardware Vault and lock your vault for 7+ days. Then visit the Clash Arena to battle."

FAQ 3: "Why can't I pull Special Grade characters?"
Answer: "Special Grade characters like Gojo and Sukuna have a 1.5% pull rate. Each pull costs 500 🧬 DNA. After 10 pulls without a Grade 2+, the pity system guarantees one."

FAQ 4: "How do I withdraw my 🧬 DNA to real money?"
Answer: "🧬 DNA is currently an internal pre-DEX asset. External withdrawals are strictly LOCKED until the public STON.fi listing. You can only trade internally or use tokens in-game. We do not support MoonPay withdrawals yet. Once 🧬 DNA is listed on STON.fi, you will be able to claim your internal balance to your TON Web3 wallet."

FAQ 5: "What is the VIP Sorcerer Pass?"
Answer: "The VIP Sorcerer Pass ($9.99/month) doubles your AFK mining rewards for 30 days. Purchase it from the Cursed Store."

FAQ 6: "How do referrals work?"
Answer: "Share your Binding Vow link. You earn 5% of your Disciple's AFK mining forever, and 2% from their Disciples. Visit the Referrals page to get your link."

RULES:
- If the question matches a FAQ, give the exact answer.
- If it does NOT match, say: "I'm not sure about that. I'm escalating your question to our human moderators who will respond shortly."
- Keep responses under 3 sentences. Be helpful and professional.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { playerId, message, mode = "lore" } = await req.json();
    if (!message) return new Response(JSON.stringify({ error: "Missing message" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Save user message to chat history
    await supabase.from("ai_chat_history").insert({
      player_id: playerId || "anonymous",
      role: "user",
      content: message,
      context: mode,
    });

    // Get recent chat context (last 10 messages)
    const { data: history } = await supabase
      .from("ai_chat_history")
      .select("role, content")
      .eq("player_id", playerId || "anonymous")
      .order("created_at", { ascending: false })
      .limit(10);

    const systemPrompt = mode === "support" ? SUPPORT_SYSTEM_PROMPT : LORE_SYSTEM_PROMPT;
    const reversedHistory = (history || []).reverse();

    // Build Gemini API request
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    let aiResponse: string;

    if (geminiKey) {
      // Call Gemini API
      const contents = [
        ...reversedHistory.map((h) => ({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }],
        })),
        { role: "user", parts: [{ text: message }] },
      ];

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents,
            generationConfig: { temperature: mode === "lore" ? 0.9 : 0.3, maxOutputTokens: 500 },
          }),
        }
      );

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        throw new Error(`Gemini API error: ${geminiRes.status} ${errText}`);
      }

      const geminiData = await geminiRes.json();
      aiResponse = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "I sense... confusion in your words. Please rephrase.";
    } else {
      // Fallback: no API key configured — use canned responses
      if (mode === "support") {
        const faqs = [
          { k: "mining", a: "Your AFK rewards are stored in your Cursed Energy Mining pool. Tap the 'Extract' button in the Wallet tab to move them to your liquid balance." },
          { k: "pvp", a: "To unlock PvP, stake 200+ 🧬 DNA in the Hardware Vault and lock it for 7+ days." },
          { k: "pull", a: "Special Grade characters have a 1.5% pull rate. After 10 pulls without Grade 2+, pity guarantees one." },
          { k: "withdraw", a: "🧬 DNA is currently an internal pre-DEX asset. External withdrawals are strictly LOCKED until the public STON.fi listing. You can only trade internally or use tokens in-game. We do not support MoonPay withdrawals yet." },
          { k: "vip", a: "VIP Sorcerer Pass ($9.99/month) doubles AFK mining for 30 days. Buy it from the Cursed Store." },
          { k: "referral", a: "Share your Binding Vow link. You earn 5% of your Disciple's mining forever, and 2% from their Disciples." },
        ];
        const match = faqs.find((f) => message.toLowerCase().includes(f.k));
        aiResponse = match ? match.a : "I'm not sure about that. I'm escalating your question to our human moderators who will respond shortly.";
      } else {
        aiResponse = "The paths of cursed energy are many, young sorcerer. To defeat Mahito in Chapter 4, you need a fast brawler — swap Megumi for Yuji and equip the Attack Surge relic. His Soul Touch cannot reshape what it cannot touch.";
      }
    }

    // Save AI response to chat history
    await supabase.from("ai_chat_history").insert({
      player_id: playerId || "anonymous",
      role: "assistant",
      content: aiResponse,
      context: mode,
    });

    return new Response(JSON.stringify({ response: aiResponse, mode }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
