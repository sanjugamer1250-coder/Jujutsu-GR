import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Zap, Coins, Check, X, CreditCard, Bitcoin, Wallet, Lock, Gift, Play, Sparkles, Shield, Crown, Star, Flame, Sword, Palette } from 'lucide-react';
import { useDnaBalance, useCursedEnergy, useStorageSync, useVipUntil, useOwnedItems, useOwnedRelics } from '@/lib/hooks';
import { addDna, addCursedEnergy, spendDna, addAdminPool, logTx, canClaimAdReward, claimAdReward, activateVip, ownItem, buyRelic, RELICS, STORAGE_KEYS } from '@/lib/economy';
import { fmt, fmtUsd, pushToast } from '@/lib/ui';
import { useApp } from '@/lib/store';
import { getPlayerName } from '@/lib/supabase';

type Tier = 'Basic' | 'Premium' | 'Exclusive';
type ItemType = 'pack' | 'skin' | 'buff' | 'cheat';

interface ShopItem {
  id: string; name: string; desc: string; tier: Tier; type: ItemType;
  priceUsd?: number; dnaReward?: number; energyReward?: number;
  dnaCost?: number; icon: typeof Coins; color: string; popular?: boolean;
}

const ITEMS: ShopItem[] = [
  // Basic tier — packs
  { id: 'pack_basic', name: 'Basic Cursed Energy', desc: 'A small surge of cursed energy.', tier: 'Basic', type: 'pack', dnaReward: 100, energyReward: 50, priceUsd: 0.99, icon: Zap, color: 'text-energy-400' },
  { id: 'pack_sorcerer', name: 'Sorcerer Pack', desc: 'Moderate reserves for a rising sorcerer.', tier: 'Basic', type: 'pack', dnaReward: 500, energyReward: 200, priceUsd: 4.99, icon: Coins, color: 'text-gold-400', popular: true },
  { id: 'pack_premium', name: 'Premium Cursed Energy', desc: 'Large reserves for serious sorcerers.', tier: 'Premium', type: 'pack', dnaReward: 1500, energyReward: 600, priceUsd: 19.99, icon: Zap, color: 'text-energy-400' },
  { id: 'pack_special', name: 'Special Grade Pack', desc: 'Massive cursed energy reserves.', tier: 'Premium', type: 'pack', dnaReward: 4000, energyReward: 1500, priceUsd: 49.99, icon: Coins, color: 'text-gold-400' },
  { id: 'pack_sukuna', name: 'Sukuna\'s Vessel', desc: 'Unleash your domain with elite reserves.', tier: 'Exclusive', type: 'pack', dnaReward: 10000, energyReward: 5000, priceUsd: 99.99, icon: Flame, color: 'text-blood-400' },
  // Skins
  { id: 'skin_gojo_prison', name: 'Gojo Prison Realm Skin', desc: 'Cosmetic skin — Prison Realm aura for Gojo.', tier: 'Premium', type: 'skin', dnaCost: 2000, icon: Palette, color: 'text-curse-300' },
  { id: 'skin_sukuna_throne', name: 'Sukuna Throne Skin', desc: 'Cosmetic skin — Malevolent Shrine aura for Sukuna.', tier: 'Exclusive', type: 'skin', dnaCost: 5000, icon: Palette, color: 'text-blood-400' },
  { id: 'skin_yuji_black', name: 'Yuji Black Flash Skin', desc: 'Cosmetic skin — Black Flash trail effect for Yuji.', tier: 'Basic', type: 'skin', dnaCost: 800, icon: Palette, color: 'text-energy-400' },
  // Buffs
  { id: 'buff_atk', name: 'Cursed ATK Boost', desc: '+20% ATK for all characters in your roster.', tier: 'Basic', type: 'buff', dnaCost: 500, icon: Sword, color: 'text-blood-400' },
  { id: 'buff_def', name: 'Reversed DEF Ward', desc: '+20% DEF for all characters in your roster.', tier: 'Premium', type: 'buff', dnaCost: 1500, icon: Shield, color: 'text-jade-400' },
  { id: 'buff_speed', name: 'Flash Speed Charm', desc: '+15% SPD for all characters in your roster.', tier: 'Premium', type: 'buff', dnaCost: 1500, icon: Star, color: 'text-energy-400' },
  // Cheats
  { id: 'cheat_maxlvl', name: 'Instant Max Level', desc: 'Instantly max-level one character of your choice.', tier: 'Exclusive', type: 'cheat', dnaCost: 8000, icon: Crown, color: 'text-gold-400' },
  { id: 'cheat_skip', name: 'Chapter Skip Pass', desc: 'Skip any one locked story chapter instantly.', tier: 'Exclusive', type: 'cheat', dnaCost: 6000, icon: Sparkles, color: 'text-curse-300' },
];

const TIER_META: Record<Tier, { color: string; border: string; label: string }> = {
  Basic: { color: 'text-zinc-300', border: 'border-zinc-500/30', label: 'Basic' },
  Premium: { color: 'text-gold-400', border: 'border-gold-500/40', label: 'Premium' },
  Exclusive: { color: 'text-curse-300', border: 'border-curse-500/50', label: 'Exclusive' },
};

const VIP_PRICE_USD = 9.99;

export default function StorePage() {
  const dna = useDnaBalance();
  const energy = useCursedEnergy();
  const vipUntil = useVipUntil();
  const ownedItems = useOwnedItems();
  const ownedRelics = useOwnedRelics();
  const { recordTransaction } = useApp();
  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [payMethod, setPayMethod] = useState<'stars' | 'fiat' | 'crypto'>('fiat');
  const [tab, setTab] = useState<'all' | Tier | 'vip'>('all');
  const [processing, setProcessing] = useState(false);
  useStorageSync();
  const vipActive = Date.now() < vipUntil;

  const claimAd = () => {
    if (!canClaimAdReward()) { pushToast('Come back tomorrow for your next free reward!', 'error'); return; }
    claimAdReward();
    addDna(50);
    logTx('ad', 50, 'in', 'Daily ad reward');
    pushToast('Watched ad! +50 🧬 DNA', 'success');
  };

  const buyWithDna = (item: ShopItem) => {
    if (!item.dnaCost) return;
    if (spendDna(item.dnaCost)) {
      if (item.type === 'pack' && item.energyReward) addCursedEnergy(item.energyReward);
      if (item.type === 'pack' && item.dnaReward) addDna(item.dnaReward);
      ownItem(item.id);
      pushToast(`Purchased ${item.name}!`, 'success');
    } else pushToast('Not enough 🧬 DNA.', 'error');
  };

  const buyWithFiat = async () => {
    if (!selected || !selected.priceUsd || processing) return;
    setProcessing(true);

    try {
      const { supabase, getPlayerId } = await import('@/lib/supabase');
      const playerId = getPlayerId();
      const pillar = payMethod === 'stars' ? 'stars' : payMethod === 'crypto' ? 'crypto' : 'fiat';

      // 1. Call edge function to create a real Razorpay order (server-side)
      const { data: orderData, error: orderErr } = await supabase.functions.invoke('razorpay-create-order', {
        body: {
          playerId,
          itemId: selected.id,
          itemName: selected.name,
          amountUsd: selected.priceUsd,
          amountDna: selected.dnaReward || 0,
          energyReward: selected.energyReward || 0,
          pillar,
        },
      });

      if (orderErr || !orderData?.ok) {
        pushToast(orderData?.error || 'Could not start payment. Please try again.', 'error');
        setProcessing(false);
        return;
      }

      // 2. Open Razorpay checkout modal
      const rzp = new (window as any).Razorpay({
        key_id: orderData.keyId,
        order_id: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Jujutsu Clash Arena',
        description: selected.name,
        prefill: { name: getPlayerName() },
        theme: { color: '#d4a017' },
        handler: async () => {
          // 3. Payment succeeded on Razorpay — but we DON'T trust the frontend.
          // The webhook credits DNA server-side. We poll payment_orders to confirm.
          pushToast('Payment received! Verifying...', 'success');
          await pollOrderStatus(orderData.orderId, playerId);
          setProcessing(false);
        },
        modal: {
          ondismiss: () => {
            pushToast('Payment cancelled.', 'error');
            setProcessing(false);
          },
        },
      });

      rzp.on('payment.failed', () => {
        pushToast('Payment failed. Please try again.', 'error');
        setProcessing(false);
      });

      rzp.open();
    } catch {
      pushToast('Payment failed. Try again.', 'error');
      setProcessing(false);
    }
  };

  // Poll payment_orders until the webhook marks it paid, then grant local rewards.
  const pollOrderStatus = async (orderId: string, _playerId: string) => {
    const { supabase } = await import('@/lib/supabase');
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const { data: order } = await supabase
        .from('payment_orders')
        .select('status, webhook_verified, amount_dna, item_id')
        .eq('provider_order_id', orderId)
        .maybeSingle();

      if (order?.status === 'paid' && order?.webhook_verified) {
        // Webhook confirmed — grant local rewards (energy, ownership, admin fee)
        const item = ITEMS.find((it) => it.id === order.item_id);
        if (item) {
          if (item.energyReward) addCursedEnergy(item.energyReward);
          ownItem(item.id);
        }
        if (selected?.dnaReward) addDna(selected.dnaReward);
        const adminCut = (selected?.priceUsd || 0) * 0.15;
        addAdminPool(adminCut);
        await recordTransaction('purchase', selected?.priceUsd || 0, 'USD', 'out', `Purchased ${selected?.name} via Razorpay`);
        if (selected?.dnaReward) await recordTransaction('reward', selected.dnaReward, 'DNA', 'in', `Reward from ${selected?.name}`);
        pushToast(`Purchase verified! ${selected?.dnaReward ? fmt(selected.dnaReward) + ' DNA credited' : ''}`, 'success');
        setSelected(null);
        return;
      }
    }
    // Webhook didn't arrive in time — don't grant rewards (payment may still be processing)
    pushToast('Payment is being verified. Your rewards will arrive shortly.', 'success');
    setSelected(null);
  };

  const buyVip = () => {
    activateVip(30);
    addAdminPool(VIP_PRICE_USD * 0.30);
    logTx('vip', VIP_PRICE_USD, 'out', 'VIP Sorcerer Pass (30 days)');
    pushToast('VIP Sorcerer Pass activated! Double mining for 30 days.', 'success');
  };

  const filtered = tab === 'all' ? ITEMS : ITEMS.filter((i) => i.tier === tab);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <section className="relative overflow-hidden rounded-3xl border-gradient p-6">
        <div className="absolute -top-12 -right-8 w-44 h-44 rounded-full bg-gold-500/20 blur-3xl animate-pulse-glow" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-gold-glow"><Store className="w-6 h-6 text-black" /></div>
          <div><h1 className="font-display font-black text-2xl text-white">Cursed Store</h1><p className="text-xs text-zinc-400">Fiat on-ramp, skins, buffs, and cheats. A 15% platform fee funds the liquidity pool.</p></div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-3 flex items-center gap-3"><Coins className="w-5 h-5 text-gold-400" /><div><div className="font-mono font-bold text-gold-400">{fmt(dna)}</div><div className="text-[10px] text-zinc-500 uppercase">🧬 DNA</div></div></div>
        <div className="glass rounded-2xl p-3 flex items-center gap-3"><Zap className="w-5 h-5 text-energy-400" /><div><div className="font-mono font-bold text-energy-400">{fmt(energy)}</div><div className="text-[10px] text-zinc-500 uppercase">Cursed Energy</div></div></div>
      </section>

      {/* Daily Ad Reward */}
      <section className="glass rounded-2xl p-4 border border-jade-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-jade-500/15 flex items-center justify-center"><Play className="w-5 h-5 text-jade-400" /></div>
            <div><div className="font-display font-bold text-white text-sm">Daily Free Reward</div><div className="text-xs text-zinc-500">Watch a short ad for 50 🧬 DNA</div></div>
          </div>
          <button onClick={claimAd} disabled={!canClaimAdReward()} className={`px-4 py-2 rounded-xl font-bold text-sm ${canClaimAdReward() ? 'bg-gradient-to-r from-jade-500 to-jade-600 text-white shadow-[0_0_16px_rgba(74,222,128,0.3)]' : 'bg-ink-800 text-zinc-600'}`}>{canClaimAdReward() ? 'Claim +50' : 'Claimed'}</button>
        </div>
      </section>

      {/* VIP Sorcerer Pass */}
      <section className={`relative overflow-hidden rounded-2xl p-4 border ${vipActive ? 'border-gold-500/40 shadow-gold-glow' : 'border-curse-500/40'}`}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gold-500/15 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center"><Crown className="w-5 h-5 text-black" /></div>
            <div>
              <div className="font-display font-bold text-white text-sm flex items-center gap-2">VIP Sorcerer Pass {vipActive && <span className="px-1.5 py-0.5 rounded bg-jade-500/20 text-jade-400 text-[9px] font-bold">ACTIVE</span>}</div>
              <div className="text-xs text-zinc-500">{vipActive ? `Expires in ${Math.ceil((vipUntil - Date.now()) / 86400000)}d — Double AFK mining!` : 'Double AFK mining rewards for 30 days'}</div>
            </div>
          </div>
          {!vipActive && <button onClick={buyVip} className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-black font-bold text-sm shadow-gold-glow">${VIP_PRICE_USD}/mo</button>}
        </div>
      </section>

      {/* Tier tabs */}
      <section>
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          {(['all', 'Basic', 'Premium', 'Exclusive'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${tab === t ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30' : 'glass text-zinc-500 border border-transparent'}`}>{t === 'all' ? 'All Items' : t}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((item, i) => {
            const owned = ownedItems.includes(item.id) && item.type !== 'pack';
            const Icon = item.icon;
            const tier = TIER_META[item.tier];
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={`relative rounded-2xl p-4 border ${item.popular ? 'border-gold-500/40 shadow-gold-glow' : tier.border} glass`}>
                {item.popular && <div className="absolute -top-2 left-4 px-2 py-0.5 rounded-full bg-gold-500 text-black text-[10px] font-bold">POPULAR</div>}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-ink-800 flex items-center justify-center shrink-0`}><Icon className={`w-5 h-5 ${item.color}`} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${tier.color} bg-black/40`}>{tier.label}</span><span className="text-[9px] text-zinc-600 uppercase">{item.type}</span></div>
                    <h3 className="font-display font-bold text-white text-sm mt-0.5">{item.name}</h3>
                    <p className="text-[11px] text-zinc-500">{item.desc}</p>
                  </div>
                  {owned && <Check className="w-4 h-4 text-jade-400 shrink-0" />}
                </div>
                <div className="flex items-center justify-between mt-3">
                  {item.priceUsd ? <><span className="font-mono font-bold text-lg text-white">${item.priceUsd}</span><button onClick={() => setSelected(item)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-black font-bold text-sm">Buy</button></> :
                  <><span className="font-mono font-bold text-gold-400">{fmt(item.dnaCost || 0)} 🧬 DNA</span><button onClick={() => buyWithDna(item)} disabled={dna < (item.dnaCost || 0)} className={`px-4 py-2 rounded-xl font-bold text-sm ${dna >= (item.dnaCost || 0) ? 'bg-gradient-to-r from-curse-500 to-curse-700 text-white' : 'bg-ink-800 text-zinc-600'}`}>{owned ? 'Owned' : 'Buy'}</button></>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Relics & Consumables (Token Sink) */}
      <section>
        <div className="flex items-center gap-2 mb-3"><Sword className="w-4 h-4 text-blood-400" /><h2 className="font-display font-bold text-lg text-white">Relics & Consumables</h2><span className="text-[10px] text-zinc-500 uppercase tracking-wider">Token Sink</span></div>
        <p className="text-xs text-zinc-500 mb-3">Burn 🧬 DNA for single-use PvP advantages. These items drain tokens from the economy to protect the trading price.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RELICS.map((relic, i) => {
            const owned = ownedRelics.includes(relic.id);
            return (
              <motion.div key={relic.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={`relative rounded-2xl p-4 border ${owned ? 'border-jade-500/40' : 'border-blood-500/30'} glass`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blood-500/15 flex items-center justify-center shrink-0"><Sword className="w-5 h-5 text-blood-400" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold text-blood-400 bg-black/40 uppercase">{relic.type}</span><span className="text-[9px] text-zinc-600">{relic.effect}</span></div>
                    <h3 className="font-display font-bold text-white text-sm mt-0.5">{relic.name}</h3>
                    <p className="text-[11px] text-zinc-500">{relic.desc}</p>
                  </div>
                  {owned && <Check className="w-4 h-4 text-jade-400 shrink-0" />}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-mono font-bold text-gold-400">{fmt(relic.cost)} 🧬 DNA</span>
                  <button onClick={() => { if (buyRelic(relic.id)) pushToast(`Bought ${relic.name}!`, 'success'); else pushToast('Not enough 🧬 DNA.', 'error'); }} disabled={owned || dna < relic.cost} className={`px-4 py-2 rounded-xl font-bold text-sm ${owned ? 'bg-ink-800 text-zinc-600' : dna >= relic.cost ? 'bg-gradient-to-r from-blood-500 to-blood-600 text-white' : 'bg-ink-800 text-zinc-600'}`}>{owned ? 'Owned' : 'Buy'}</button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="max-w-sm w-full glass-strong rounded-3xl border border-gold-500/40 p-5">
              <div className="flex items-center justify-between mb-4"><h3 className="font-display font-bold text-white">{selected.name}</h3><button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button></div>
              <div className="rounded-xl bg-ink-800 p-3 flex justify-between text-sm mb-4"><span className="text-zinc-400">You get:</span><span className="text-white font-mono">{selected.dnaReward ? `${fmt(selected.dnaReward)} DNA` : ''} {selected.energyReward ? `+ ${selected.energyReward} CE` : ''}</span></div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Payment Method — 3-Pillar Gateway</div>
              <div className="space-y-2">
                {([
                  { id: 'stars', label: 'Telegram Stars', desc: 'Apple Pay / Google Pay via Telegram', icon: Star },
                  { id: 'fiat', label: 'Credit Card / BNPL', desc: 'Visa, Mastercard, Klarna, Affirm', icon: CreditCard },
                  { id: 'crypto', label: 'TON / Crypto Wallet', desc: 'Tonkeeper, USDT, $TON', icon: Bitcoin },
                ] as const).map((m) => (
                  <button key={m.id} onClick={() => setPayMethod(m.id)} className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all ${payMethod === m.id ? 'border-gold-500/50 bg-gold-500/10' : 'border-ink-700'}`}><m.icon className={`w-4 h-4 mt-0.5 ${payMethod === m.id ? 'text-gold-400' : 'text-zinc-500'}`} /><div className="flex-1 text-left"><div className="text-sm text-white">{m.label}</div><div className="text-[10px] text-zinc-500">{m.desc}</div></div>{payMethod === m.id && <Check className="w-4 h-4 text-gold-400 mt-0.5" />}</button>
                ))}
              </div>
              {payMethod === 'stars' && <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2 p-2 rounded-lg bg-ink-800"><Star className="w-3 h-3" /> Telegram Stars are subject to 30% platform fee. Seamless Apple/Google Pay experience.</div>}
              {payMethod === 'fiat' && <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2 p-2 rounded-lg bg-ink-800"><CreditCard className="w-3 h-3" /> Stripe processes the payment. BNPL available via Klarna/Affirm. Your game receives funds instantly.</div>}
              {payMethod === 'crypto' && <div className="flex items-center gap-2 text-xs text-zinc-500 mt-2 p-2 rounded-lg bg-ink-800"><Bitcoin className="w-3 h-3" /> Connect Tonkeeper or Telegram @Wallet. Near-zero gas, 6-second finality on TON.</div>}
              <div className="flex justify-between mt-4 mb-4"><span className="text-zinc-400">Total</span><span className="font-mono font-bold text-xl text-white">${selected.priceUsd}</span></div>
              <button onClick={buyWithFiat} disabled={processing} className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-black font-bold text-sm shadow-gold-glow disabled:opacity-50 disabled:cursor-not-allowed">{processing ? 'Processing...' : 'Confirm Purchase'}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
