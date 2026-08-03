import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Building2, Zap, TrendingUp, Coins, Lock, CheckCircle2, X, Calculator, Sparkles, Shield } from 'lucide-react';
import { supabase, getPlayerId } from '@/lib/supabase';
import { getDna, spendDna, logTx } from '@/lib/economy';
import { useApp } from '@/lib/store';
import { pushToast, fmt, fmtUsd } from '@/lib/ui';

interface NodeTier {
  id: string;
  name: string;
  location: string;
  priceUSDT: number;
  multiplier: number;
  color: string;
  border: string;
  perks: string[];
}

const NODE_TIERS: NodeTier[] = [
  {
    id: 'special', name: 'Special Grade Node', location: 'Shibuya District',
    priceUSDT: 500, multiplier: 3.5, color: 'from-rose-500/30 to-rose-700/10', border: 'border-rose-500/40',
    perks: ['3.5x revenue multiplier', 'Priority tournament seeding', 'Exclusive Shibuya skin pack', '5% platform revenue share'],
  },
  {
    id: 'grade1', name: 'Grade 1 Node', location: 'Jujutsu High',
    priceUSDT: 200, multiplier: 1.5, color: 'from-curse-500/30 to-curse-700/10', border: 'border-curse-500/40',
    perks: ['1.5x revenue multiplier', 'Premium store discount', 'Jujutsu High cosmetic pack', '2% platform revenue share'],
  },
  {
    id: 'grade2', name: 'Grade 2 Node', location: 'Detention Center',
    priceUSDT: 75, multiplier: 1.0, color: 'from-energy-500/30 to-energy-700/10', border: 'border-energy-500/40',
    perks: ['1.0x baseline multiplier', 'Standard node operator status', 'Detention Center cosmetic', '1% platform revenue share'],
  },
];

const DNA_USD_RATE = 0.01; // 1 DNA = $0.01

interface OwnedNode {
  id: string; node_id: string; tier: string; owner_id: string;
  purchase_price_usdt: number; payment_currency: string; yield_earned: number; multiplier: number; purchased_at: string;
}

export function DomainNodeSale() {
  const playerId = getPlayerId();
  const { balance, recordTransaction, refreshBalance } = useApp();
  const [ownedNodes, setOwnedNodes] = useState<OwnedNode[]>([]);
  const [buyModal, setBuyModal] = useState<NodeTier | null>(null);
  const [payCurrency, setPayCurrency] = useState<'USDT' | 'DNA'>('USDT');
  const [volume, setVolume] = useState(50000);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => { loadNodes(); }, []);

  const loadNodes = async () => {
    const { data } = await supabase.from('domain_nodes').select('*').eq('owner_id', playerId).order('purchased_at', { ascending: false });
    if (data) setOwnedNodes(data as OwnedNode[]);
  };

  const dnaPrice = (tier: NodeTier) => {
    const usdPrice = tier.priceUSDT * 0.85; // 15% discount
    return Math.ceil(usdPrice / DNA_USD_RATE);
  };

  const usdtBalance = balance.usdt || 0;
  const dnaBalance = getDna();

  const buyNode = async () => {
    if (!buyModal) return;
    setConfirming(true);
    try {
      const nodeId = 'NODE-' + buyModal.id.toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
      const priceUSDT = payCurrency === 'USDT' ? buyModal.priceUSDT : buyModal.priceUSDT * 0.85;
      const dnaCost = dnaPrice(buyModal);

      if (payCurrency === 'USDT') {
        if (usdtBalance < buyModal.priceUSDT) { pushToast('Insufficient USDT balance.', 'error'); setConfirming(false); return; }
        await supabase.from('user_balances').update({ usdt: usdtBalance - buyModal.priceUSDT, updated_at: new Date().toISOString() }).eq('user_id', playerId);
        await recordTransaction('purchase', buyModal.priceUSDT, 'USDT', 'out', `Bought ${buyModal.name}`);
      } else {
        if (dnaBalance < dnaCost) { pushToast('Insufficient 🧬 DNA balance.', 'error'); setConfirming(false); return; }
        spendDna(dnaCost);
        await recordTransaction('purchase', dnaCost, 'DNA', 'out', `Bought ${buyModal.name} (15% DNA discount)`);
      }

      await supabase.from('domain_nodes').insert({
        node_id: nodeId, tier: buyModal.id, owner_id: playerId,
        purchase_price_usdt: priceUSDT, payment_currency: payCurrency,
        multiplier: buyModal.multiplier, yield_earned: 0,
      });

      pushToast(`${buyModal.name} purchased successfully!`, 'success');
      setBuyModal(null);
      setConfirming(false);
      loadNodes();
      refreshBalance();
    } catch {
      pushToast('Purchase failed.', 'error');
      setConfirming(false);
    }
  };

  const projectedMonthlyDividend = (tier: NodeTier, dailyVolume: number) => {
    const platformRevenue = dailyVolume * 0.005; // 0.5% exchange fee
    const nodeShare = platformRevenue * 0.4; // 40% goes to node operators
    const weightedShare = nodeShare * (tier.multiplier / 6.0); // normalize by total multiplier
    return weightedShare * 30; // monthly
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border-gradient p-6">
        <div className="absolute -top-16 -right-8 w-48 h-48 rounded-full bg-rose-500/20 blur-3xl animate-pulse-glow" />
        <div className="relative">
          <div className="flex items-center gap-2 text-rose-300/80 text-xs tracking-[0.3em] uppercase mb-2"><Building2 className="w-3.5 h-3.5" /> Real Yield Ecosystem</div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white text-glow">Domain Nodes</h1>
          <p className="text-zinc-400 text-sm mt-2 max-w-lg">Own digital franchise real estate. Earn real USDT dividends from platform trading volume. No inflationary rewards — just real yield from real economic activity.</p>
        </div>
      </section>

      {/* Revenue Projection Slider */}
      <section className="glass rounded-2xl p-5 border border-gold-500/20">
        <div className="flex items-center gap-2 mb-4"><Calculator className="w-4 h-4 text-gold-400" /><h3 className="font-display font-bold text-white text-sm">Revenue Projection Calculator</h3></div>
        <div className="mb-2 flex justify-between text-xs"><span className="text-zinc-500">Daily Exchange Volume</span><span className="font-mono font-bold text-gold-400">{fmtUsd(volume)}</span></div>
        <input type="range" min={10000} max={1000000} step={10000} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full accent-gold-500 mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {NODE_TIERS.map((tier) => (
            <div key={tier.id} className="rounded-xl bg-ink-800 p-3 text-center border border-ink-700">
              <div className="text-[10px] text-zinc-500 uppercase mb-1">{tier.name.split(' ')[0]} {tier.name.split(' ')[1]}</div>
              <div className="font-mono font-bold text-gold-400 text-sm">{fmtUsd(projectedMonthlyDividend(tier, volume))}</div>
              <div className="text-[9px] text-zinc-600">est. monthly USDT</div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600 mt-3">Projections based on 0.5% exchange fee, 40% allocated to node operators, weighted by multiplier. Actual yield varies with platform volume.</p>
      </section>

      {/* Node Tiers */}
      <section className="grid sm:grid-cols-3 gap-4">
        {NODE_TIERS.map((tier, i) => {
          const owned = ownedNodes.filter((n) => n.tier === tier.id).length;
          return (
            <motion.div key={tier.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tier.color} border ${tier.border} p-5`}>
              {tier.id === 'special' && <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 text-[9px] font-bold border border-rose-500/40">BEST VALUE</div>}
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">{tier.id === 'special' ? <Crown className="w-5 h-5 text-rose-300" /> : tier.id === 'grade1' ? <Shield className="w-5 h-5 text-curse-300" /> : <Building2 className="w-5 h-5 text-energy-300" />}</div>
              <h3 className="font-display font-bold text-white text-sm">{tier.name}</h3>
              <p className="text-[11px] text-zinc-400 mb-3">{tier.location}</p>
              <div className="flex items-baseline gap-1 mb-1"><span className="font-mono font-black text-2xl text-white">${tier.priceUSDT}</span><span className="text-xs text-zinc-500">USDT</span></div>
              <div className="text-[10px] text-gold-400 mb-4">or {fmt(dnaPrice(tier))} 🧬 DNA <span className="text-jade-400">(-15%)</span></div>
              <div className="space-y-1.5 mb-4">
                {tier.perks.map((perk) => (
                  <div key={perk} className="flex items-start gap-1.5 text-[11px] text-zinc-400"><CheckCircle2 className="w-3 h-3 text-jade-400 mt-0.5 shrink-0" />{perk}</div>
                ))}
              </div>
              <div className="flex items-center justify-between mb-3"><span className="text-[10px] text-zinc-500">Multiplier</span><span className="font-mono font-bold text-rose-300">{tier.multiplier}x</span></div>
              <div className="flex items-center justify-between mb-4"><span className="text-[10px] text-zinc-500">You Own</span><span className="font-mono font-bold text-white">{owned}</span></div>
              <button onClick={() => { setBuyModal(tier); setPayCurrency('USDT'); }} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-500/20">Purchase Node</button>
            </motion.div>
          );
        })}
      </section>

      {/* Owned Nodes */}
      {ownedNodes.length > 0 && (
        <section className="glass rounded-2xl p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Your Domain Nodes ({ownedNodes.length})</div>
          <div className="space-y-2">
            {ownedNodes.map((node) => (
              <div key={node.id} className="flex items-center justify-between rounded-lg bg-ink-800 p-3 text-xs">
                <div className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-rose-400" /><div><div className="text-white font-mono">{node.node_id}</div><div className="text-[10px] text-zinc-500">{node.tier} · {node.multiplier}x · {node.payment_currency}</div></div></div>
                <div className="text-right"><div className="font-mono text-gold-400">{fmtUsd(node.yield_earned)}</div><div className="text-[10px] text-zinc-600">yield earned</div></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Buy Modal */}
      <AnimatePresence>
        {buyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setBuyModal(null)} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="max-w-sm w-full glass-strong rounded-3xl border border-rose-500/40 p-5">
              <div className="flex items-center justify-between mb-4"><h3 className="font-display font-bold text-white">Purchase {buyModal.name}</h3><button onClick={() => setBuyModal(null)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button></div>
              <div className="mb-4">
                <label className="text-xs text-zinc-400 mb-2 block">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setPayCurrency('USDT')} className={`py-3 rounded-xl text-sm font-bold ${payCurrency === 'USDT' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-ink-800 text-zinc-500 border border-transparent'}`}>{fmtUsd(buyModal.priceUSDT)} USDT</button>
                  <button onClick={() => setPayCurrency('DNA')} className={`py-3 rounded-xl text-sm font-bold ${payCurrency === 'DNA' ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40' : 'bg-ink-800 text-zinc-500 border border-transparent'}`}>{fmt(dnaPrice(buyModal))} 🧬 DNA <span className="text-[9px] text-jade-400 block">-15% off</span></button>
                </div>
              </div>
              <div className="rounded-xl bg-ink-800 p-3 border border-ink-700 mb-4 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-zinc-500">Node</span><span className="text-white font-semibold">{buyModal.name}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Location</span><span className="text-white">{buyModal.location}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Multiplier</span><span className="text-rose-300 font-bold">{buyModal.multiplier}x</span></div>
                <div className="border-t border-ink-700 pt-1.5 flex justify-between font-bold"><span className="text-white">Total Cost</span><span className={payCurrency === 'USDT' ? 'text-rose-300' : 'text-gold-400'}>{payCurrency === 'USDT' ? `${fmtUsd(buyModal.priceUSDT)} USDT` : `${fmt(dnaPrice(buyModal))} DNA`}</span></div>
              </div>
              <div className="flex items-start gap-2 text-[10px] text-zinc-500 p-2 rounded-lg bg-ink-800 mb-4"><Shield className="w-3 h-3 text-rose-400 mt-0.5 shrink-0" /><span>Node ownership is permanent. Dividends are distributed monthly in USDT to your Omni-Wallet. Purchases are non-refundable.</span></div>
              <button onClick={buyNode} disabled={confirming} className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-500/30">{confirming ? 'Processing...' : 'Confirm Purchase'}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
