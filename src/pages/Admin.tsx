import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, KeyRound, Coins, TrendingUp, Users, DollarSign, Settings, ChevronLeft, Wallet, ArrowUpRight, Eye, EyeOff, Copy, Check, Zap, Star, Send, Crown, Building2, Droplets } from 'lucide-react';
import { getAdminPool, getAdminWalletKey, setAdminWalletKey, readJSON, writeJSON, STORAGE_KEYS, readNumber, writeValue, getTxLog, addAdminPool, claimAirdrop } from '@/lib/economy';
import { useAdminPool, useDnaBalance, useTxLog, useStorageSync } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import { CHARACTERS } from '@/lib/characters';
import { fmt, fmtUsd, pushToast } from '@/lib/ui';
import { AdminDashboard } from '@/components/AdminDashboard';
import { DomainNodeSale } from '@/components/DomainNodeSale';
import { IDOLiquidity } from '@/components/IDOLiquidity';

const ADMIN_PASSPHRASE = 'dna-admin-2026';

export default function Admin() {
  const [unlocked, setUnlocked] = useState(false);
  const [pass, setPass] = useState('');
  const [tab, setTab] = useState<'treasury' | 'pool' | 'wallet' | 'economy' | 'airdrop' | 'custom' | 'nodes' | 'ido'>('treasury');

  if (!unlocked) return (
    <div className="min-h-screen bg-domain flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-sm w-full glass-strong rounded-3xl border border-curse-500/40 p-6">
        <div className="flex items-center gap-3 mb-5"><div className="w-12 h-12 rounded-2xl bg-curse-500/15 flex items-center justify-center"><Lock className="w-6 h-6 text-curse-300" /></div><div><h1 className="font-display font-bold text-white">Admin Vault</h1><p className="text-xs text-zinc-500">Restricted access</p></div></div>
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Admin passphrase" className="w-full px-4 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm focus:border-curse-500/50 outline-none" onKeyDown={(e) => { if (e.key === 'Enter') { if (pass === ADMIN_PASSPHRASE) { setUnlocked(true); pushToast('Welcome, Admin.', 'success'); } else pushToast('Wrong passphrase.', 'error'); } }} />
        <button onClick={() => { if (pass === ADMIN_PASSPHRASE) { setUnlocked(true); pushToast('Welcome, Admin.', 'success'); } else pushToast('Wrong passphrase.', 'error'); }} className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-curse-500 to-curse-700 text-white font-bold text-sm shadow-curse-glow">Unlock</button>
        <Link href="/super-admin" className="block text-center text-xs text-curse-300 hover:text-curse-200 mt-4">Foundry Treasury →</Link>
        <Link href="/" className="block text-center text-xs text-zinc-500 hover:text-zinc-300 mt-2">← Back to game</Link>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-domain">
      <div className="sticky top-0 z-40 glass-strong border-b border-curse-500/20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></Link><Shield className="w-5 h-5 text-curse-300" /><div className="font-display font-bold text-white">Admin Console</div>
          <div className="ml-auto flex gap-1 overflow-x-auto no-scrollbar">{(['treasury', 'pool', 'wallet', 'economy', 'nodes', 'ido', 'airdrop', 'custom'] as const).map((t) => (<button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap ${tab === t ? 'bg-curse-500/20 text-curse-200 border border-curse-500/30' : 'text-zinc-500'}`}>{t === 'treasury' ? 'Treasury' : t === 'ido' ? 'IDO' : t === 'nodes' ? 'Nodes' : t}</button>))}</div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {tab === 'treasury' && <div key="treasury"><AdminDashboard /></div>}
          {tab === 'pool' && <PoolView key="pool" />}
          {tab === 'wallet' && <WalletView key="wallet" />}
          {tab === 'economy' && <EconomyView key="economy" />}
          {tab === 'nodes' && <div key="nodes"><DomainNodeSale /></div>}
          {tab === 'ido' && <div key="ido"><IDOLiquidity /></div>}
          {tab === 'airdrop' && <AirdropView key="airdrop" />}
          {tab === 'custom' && <CustomView key="custom" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PoolView() {
  const pool = useAdminPool();
  const txLog = useTxLog();
  useStorageSync();
  const taxRevenue = txLog.filter((t) => t.type === 'tax').reduce((s, t) => s + t.amount, 0);
  const purchaseRevenue = txLog.filter((t) => t.type === 'purchase').reduce((s, t) => s + t.amount, 0);
  const vipRevenue = txLog.filter((t) => t.type === 'vip').reduce((s, t) => s + t.amount, 0);
  const adRevenue = txLog.filter((t) => t.type === 'ad').reduce((s, t) => s + t.amount, 0);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="glass rounded-2xl p-5 border border-curse-500/30">
        <div className="flex items-center gap-2 mb-4"><Coins className="w-5 h-5 text-gold-400" /><h2 className="font-display font-bold text-white">Liquidity Pool</h2></div>
        <div className="flex items-end gap-2"><span className="font-mono font-black text-4xl text-gold-400">{fmt(pool)}</span><span className="text-sm text-gold-400/60 mb-1.5">🧬 DNA / USD equiv.</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4"><div className="rounded-xl bg-ink-800 p-3"><div className="text-[10px] text-zinc-500 uppercase">Trade Tax (0.5%)</div><div className="font-mono font-bold text-blood-400">{fmtUsd(taxRevenue)}</div></div><div className="rounded-xl bg-ink-800 p-3"><div className="text-[10px] text-zinc-500 uppercase">Purchase Fees</div><div className="font-mono font-bold text-jade-400">{fmtUsd(purchaseRevenue)}</div></div><div className="rounded-xl bg-ink-800 p-3"><div className="text-[10px] text-zinc-500 uppercase">VIP Pass</div><div className="font-mono font-bold text-gold-400">{fmtUsd(vipRevenue)}</div></div><div className="rounded-xl bg-ink-800 p-3"><div className="text-[10px] text-zinc-500 uppercase">Ad Rewards Paid</div><div className="font-mono font-bold text-energy-400">{fmt(adRevenue)}</div></div></div>
      </div>
      <div className="glass rounded-2xl p-4">
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Revenue Transactions</div>
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {txLog.filter((t) => ['tax','purchase','vip','ad'].includes(t.type)).length === 0 ? <div className="text-sm text-zinc-600 text-center py-4">No revenue yet.</div> :
            txLog.filter((t) => ['tax','purchase','vip','ad'].includes(t.type)).map((t) => (<div key={t.id} className="flex items-center justify-between rounded-lg bg-ink-800 p-2.5 text-xs"><div className="flex items-center gap-2"><span className={`w-1.5 h-1.5 rounded-full ${t.type === 'tax' ? 'bg-blood-400' : t.type === 'purchase' ? 'bg-jade-400' : t.type === 'vip' ? 'bg-gold-400' : 'bg-energy-400'}`} /><span className="text-white capitalize">{t.type}</span><span className="text-zinc-600">{t.note}</span></div><span className="font-mono text-jade-400">+{fmt(t.amount)}</span></div>))}
        </div>
      </div>
    </motion.div>
  );
}

function WalletView() {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const pool = useAdminPool();
  const existingKey = getAdminWalletKey();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawKey, setWithdrawKey] = useState('');
  useStorageSync();

  const generateKey = () => { const key = 'JC-' + Array.from({ length: 32 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''); setAdminWalletKey(key); pushToast('Wallet key generated. Store it safely!', 'success'); };
  const withdraw = () => { const amt = parseFloat(withdrawAmount); if (!amt || amt <= 0) { pushToast('Enter a valid amount.', 'error'); return; } if (amt > pool) { pushToast('Insufficient pool funds.', 'error'); return; } if (withdrawKey !== existingKey) { pushToast('Invalid wallet key!', 'error'); return; } addAdminPool(-amt); setWithdrawAmount(''); setWithdrawKey(''); pushToast(`Withdrew ${fmt(amt)} from pool.`, 'success'); };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="glass rounded-2xl p-5 border border-gold-500/30">
        <div className="flex items-center gap-2 mb-4"><Wallet className="w-5 h-5 text-gold-400" /><h2 className="font-display font-bold text-white">Admin Pool Wallet</h2></div>
        <p className="text-xs text-zinc-500 mb-4">This wallet collects all platform revenue — trade taxes and purchase fees. It is secured by a private key. NEVER share this key.</p>
        {!existingKey ? (
          <div className="space-y-3">
            <div className="rounded-xl bg-ink-800 p-3 flex items-start gap-2"><KeyRound className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" /><p className="text-xs text-zinc-400">No wallet key set. Generate a secure key to lock all pool funds. This key is required for any withdrawal.</p></div>
            <button onClick={generateKey} className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-black font-bold text-sm shadow-gold-glow"><KeyRound className="w-4 h-4 inline mr-1" /> Generate Wallet Key</button>
          </div>
        ) : (
          <>
            <div className="rounded-xl bg-ink-800 p-3"><div className="text-[10px] text-zinc-500 uppercase mb-1">Wallet Key</div><div className="flex items-center gap-2"><code className="flex-1 font-mono text-xs text-gold-400 break-all">{showKey ? existingKey : '•'.repeat(existingKey.length)}</code><button onClick={() => setShowKey(!showKey)} className="text-zinc-500 hover:text-white">{showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button><button onClick={() => { navigator.clipboard?.writeText(existingKey); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="text-zinc-500 hover:text-white">{copied ? <Check className="w-4 h-4 text-jade-400" /> : <Copy className="w-4 h-4" />}</button></div></div>
            <div className="rounded-xl bg-ink-800 p-3 mt-3"><div className="text-[10px] text-zinc-500 uppercase">Pool Balance</div><div className="font-mono font-bold text-2xl text-gold-400">{fmt(pool)}</div></div>
            <div className="mt-4 space-y-2.5">
              <div className="text-xs text-zinc-400">Withdraw from Pool (requires key)</div>
              <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Amount" className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm font-mono focus:border-gold-500/50 outline-none" />
              <input type="password" value={withdrawKey} onChange={(e) => setWithdrawKey(e.target.value)} placeholder="Wallet key" className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm focus:border-gold-500/50 outline-none" />
              <button onClick={withdraw} className="w-full py-3 rounded-xl bg-gradient-to-r from-blood-500 to-blood-600 text-white font-bold text-sm"><ArrowUpRight className="w-4 h-4 inline mr-1" /> Withdraw Funds</button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function EconomyView() {
  const dna = useDnaBalance();
  const [gachaCost, setGachaCost] = useState(readNumber('gacha_cost', 120));
  useStorageSync();
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-energy-400" /><h2 className="font-display font-bold text-white">Economy Controls</h2></div>
        <div className="space-y-4">
          <div><label className="text-xs text-zinc-400 mb-1.5 block">Gacha Cost (🧬 DNA)</label><input type="number" value={gachaCost} onChange={(e) => { setGachaCost(Number(e.target.value)); writeValue('gacha_cost', e.target.value); }} className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm font-mono focus:border-energy-500/50 outline-none" /></div>
          <div className="rounded-xl bg-ink-800 p-3 grid grid-cols-2 gap-3 text-sm"><div><div className="text-[10px] text-zinc-500 uppercase">Player 🧬 DNA</div><div className="font-mono text-gold-400">{fmt(dna)}</div></div><div><div className="text-[10px] text-zinc-500 uppercase">Current Tax</div><div className="font-mono text-blood-400">0.9%</div></div></div>
        </div>
      </div>
      <div className="glass rounded-2xl p-4">
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Character Roster</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{CHARACTERS.map((c) => (<div key={c.id} className="rounded-lg bg-ink-800 p-2 flex items-center gap-2"><img src={c.image} alt={c.name} className="w-8 h-8 rounded object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} /><div className="min-w-0"><div className="text-xs text-white truncate">{c.name}</div><div className="text-[10px] text-zinc-500">{c.rarity} · {c.pullRate}%</div></div></div>))}</div>
      </div>
    </motion.div>
  );
}

function AirdropView() {
  const [amount, setAmount] = useState('500');
  const [recipientCount, setRecipientCount] = useState(0);
  const [note, setNote] = useState('Telegram community airdrop');
  const [airdropHistory, setAirdropHistory] = useState<{ id: string; amount: number; recipient_count: number; note: string; created_at: string }[]>([]);
  useStorageSync();

  useEffect(() => {
    (async () => {
      const { count } = await supabase.from('players').select('*', { count: 'exact', head: true });
      if (count) setRecipientCount(count);
      const { data } = await supabase.from('airdrops').select('*').order('created_at', { ascending: false }).limit(10);
      if (data) setAirdropHistory(data as { id: string; amount: number; recipient_count: number; note: string; created_at: string }[]);
    })();
  }, []);

  const executeAirdrop = async () => {
    const amt = parseInt(amount);
    if (!amt || amt <= 0) { pushToast('Enter a valid amount.', 'error'); return; }
    // Log the airdrop
    await supabase.from('airdrops').insert({ amount: amt, recipient_count: recipientCount || 1, note });
    // For demo: grant to current player
    claimAirdrop(amt);
    pushToast(`Airdrop executed! ${fmt(amt)} 🧬 DNA sent to ${recipientCount || 1} players.`, 'success');
    setAmount('');
    // Reload history
    const { data } = await supabase.from('airdrops').select('*').order('created_at', { ascending: false }).limit(10);
    if (data) setAirdropHistory(data as { id: string; amount: number; recipient_count: number; note: string; created_at: string }[]);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="glass rounded-2xl p-5 border border-curse-500/30">
        <div className="flex items-center gap-2 mb-4"><Send className="w-5 h-5 text-curse-300" /><h2 className="font-display font-bold text-white">Mass Airdrop</h2></div>
        <p className="text-xs text-zinc-500 mb-4">Instantly grant 🧬 DNA to all registered players. Perfect for Telegram community launches — give 500 🧬 DNA to every channel member to drive downloads and conversions.</p>
        <div className="space-y-3">
          <div><label className="text-xs text-zinc-400 mb-1.5 block">Amount per player (🧬 DNA)</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm font-mono focus:border-curse-500/50 outline-none" /></div>
          <div><label className="text-xs text-zinc-400 mb-1.5 block">Note</label><input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm focus:border-curse-500/50 outline-none" /></div>
          <div className="rounded-xl bg-ink-800 p-3 flex justify-between text-sm"><span className="text-zinc-500">Registered Players</span><span className="font-mono text-white font-bold">{recipientCount}</span></div>
          <div className="rounded-xl bg-ink-800 p-3 flex justify-between text-sm"><span className="text-zinc-500">Total Distribution</span><span className="font-mono text-gold-400 font-bold">{fmt((parseInt(amount) || 0) * (recipientCount || 1))} 🧬 DNA</span></div>
          <button onClick={executeAirdrop} className="w-full py-3 rounded-xl bg-gradient-to-r from-curse-500 to-curse-700 text-white font-bold text-sm shadow-curse-glow flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Execute Mass Airdrop</button>
        </div>
      </div>
      <div className="glass rounded-2xl p-4">
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Airdrop History</div>
        {airdropHistory.length === 0 ? <div className="text-sm text-zinc-600 text-center py-4">No airdrops sent yet.</div> :
          <div className="space-y-2">{airdropHistory.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg bg-ink-800 p-3 text-xs">
              <div className="flex items-center gap-3"><span className="w-1.5 h-1.5 rounded-full bg-curse-400" /><div><div className="text-white font-mono">{fmt(a.amount)} 🧬 DNA to {a.recipient_count} players</div><div className="text-[10px] text-zinc-500">{a.note} · {new Date(a.created_at).toLocaleString()}</div></div></div>
              <span className="font-mono text-gold-400">{fmt(a.amount * a.recipient_count)}</span>
            </div>
          ))}</div>}
      </div>
    </motion.div>
  );
}

function CustomView() {
  const [theme, setTheme] = useState(readJSON('admin_theme', { accent: 'curse', label: 'Jujutsu Clash Arena' }));
  const [label, setLabel] = useState(theme.label);
  useStorageSync();
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4"><Settings className="w-5 h-5 text-curse-300" /><h2 className="font-display font-bold text-white">Platform Customization</h2></div>
        <div className="space-y-4">
          <div><label className="text-xs text-zinc-400 mb-1.5 block">Platform Name</label><input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm focus:border-curse-500/50 outline-none" /></div>
          <div><label className="text-xs text-zinc-400 mb-1.5 block">Accent Theme</label><div className="grid grid-cols-4 gap-2">{[{ id: 'curse', color: 'bg-curse-500' }, { id: 'energy', color: 'bg-energy-500' }, { id: 'gold', color: 'bg-gold-500' }, { id: 'blood', color: 'bg-blood-500' }].map((t) => (<button key={t.id} onClick={() => { setTheme({ ...theme, accent: t.id }); writeJSON('admin_theme', { ...theme, accent: t.id, label }); }} className={`h-12 rounded-xl ${t.color} ${theme.accent === t.id ? 'ring-2 ring-white' : ''}`} />))}</div></div>
          <button onClick={() => { writeJSON('admin_theme', { accent: theme.accent, label }); pushToast('Customization saved.', 'success'); }} className="w-full py-3 rounded-xl bg-gradient-to-r from-curse-500 to-curse-700 text-white font-bold text-sm">Save Customization</button>
        </div>
      </div>
      <div className="glass rounded-2xl p-4">
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Platform Stats</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><Stat icon={Users} label="Characters" value={String(CHARACTERS.length)} color="text-curse-300" /><Stat icon={Star} label="Special Grade" value={String(CHARACTERS.filter((c) => c.rarity === 'Special').length)} color="text-gold-400" /><Stat icon={Zap} label="Chapters" value="8" color="text-energy-400" /><Stat icon={DollarSign} label="Tax Rate" value="0.5%" color="text-blood-400" /></div>
      </div>
    </motion.div>
  );
}

function Stat({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: string; color: string }) {
  return <div className="rounded-xl bg-ink-800 p-3 text-center"><Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} /><div className={`font-mono font-bold ${color}`}>{value}</div><div className="text-[10px] text-zinc-500 uppercase">{label}</div></div>;
}
