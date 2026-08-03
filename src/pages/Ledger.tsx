import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Receipt, ChevronLeft, Search, ArrowDownToLine, ArrowUpFromLine, Coins, Zap, Swords, Store, TrendingUp, Gift, Shield, Skull, Eye, Users, Crown, Sparkles } from 'lucide-react';
import { supabase, getPlayerId } from '@/lib/supabase';
import { fmt, fmtUsd } from '@/lib/ui';

interface LedgerEntry {
  id: string; tx_hash: string; player_id: string; type: string;
  amount: number; direction: string; note: string; balance_after: number; created_at: string;
}

const TYPE_META: Record<string, { icon: typeof Coins; color: string; label: string }> = {
  summon: { icon: Zap, color: 'text-curse-300', label: 'Summon' },
  trade: { icon: TrendingUp, color: 'text-gold-400', label: 'Trade' },
  purchase: { icon: Store, color: 'text-jade-400', label: 'Purchase' },
  mining: { icon: ArrowDownToLine, color: 'text-energy-400', label: 'Mining' },
  withdraw: { icon: ArrowUpFromLine, color: 'text-blood-400', label: 'Withdraw' },
  deposit: { icon: ArrowDownToLine, color: 'text-jade-400', label: 'Deposit' },
  raid: { icon: Skull, color: 'text-blood-400', label: 'Raid' },
  bet: { icon: Eye, color: 'text-gold-400', label: 'Bet' },
  referral: { icon: Users, color: 'text-curse-300', label: 'Referral' },
  airdrop: { icon: Gift, color: 'text-energy-400', label: 'Airdrop' },
  vip: { icon: Crown, color: 'text-gold-400', label: 'VIP' },
  ad: { icon: Sparkles, color: 'text-energy-400', label: 'Ad Reward' },
  relic: { icon: Shield, color: 'text-blood-400', label: 'Relic' },
  clan: { icon: Users, color: 'text-curse-300', label: 'Clan' },
};

export default function Ledger() {
  const playerId = getPlayerId();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => { loadLedger(); }, []);

  const loadLedger = async () => {
    setLoading(true);
    const { data } = await supabase.from('transaction_ledger').select('*').eq('player_id', playerId).order('created_at', { ascending: false }).limit(200);
    if (data) setEntries(data as LedgerEntry[]);
    setLoading(false);
  };

  const filtered = entries.filter((e) => {
    if (filter !== 'all' && e.type !== filter) return false;
    if (search && !e.tx_hash.toLowerCase().includes(search.toLowerCase()) && !e.note.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalIn = entries.filter((e) => e.direction === 'in').reduce((s, e) => s + e.amount, 0);
  const totalOut = entries.filter((e) => e.direction === 'out').reduce((s, e) => s + Math.abs(e.amount), 0);

  return (
    <div className="min-h-screen bg-domain">
      <div className="sticky top-0 z-40 glass-strong border-b border-curse-500/20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></Link>
          <Receipt className="w-5 h-5 text-curse-300" />
          <div className="font-display font-bold text-white">Transaction Ledger</div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <section className="relative overflow-hidden rounded-3xl border-gradient p-6">
          <div className="absolute -top-16 -right-8 w-48 h-48 rounded-full bg-curse-500/20 blur-3xl animate-pulse-glow" />
          <div className="relative">
            <div className="flex items-center gap-2 text-curse-300/80 text-xs tracking-[0.3em] uppercase mb-2"><Receipt className="w-3.5 h-3.5" /> Immutable Audit Trail</div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white text-glow">Receipts & Ledger</h1>
            <p className="text-zinc-400 text-sm mt-2 max-w-lg">Every action — summoning, trading, buying, mining — is permanently logged with a unique Transaction ID. If you ever lose 🧬 DNA, provide your TX ID and we can trace exactly what happened.</p>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <div className="glass rounded-2xl p-3 text-center"><ArrowDownToLine className="w-5 h-5 mx-auto mb-1 text-jade-400" /><div className="font-mono font-bold text-lg text-jade-400">{fmt(totalIn)}</div><div className="text-[10px] text-zinc-500 uppercase">Total In</div></div>
          <div className="glass rounded-2xl p-3 text-center"><ArrowUpFromLine className="w-5 h-5 mx-auto mb-1 text-blood-400" /><div className="font-mono font-bold text-lg text-blood-400">{fmt(totalOut)}</div><div className="text-[10px] text-zinc-500 uppercase">Total Out</div></div>
          <div className="glass rounded-2xl p-3 text-center"><Receipt className="w-5 h-5 mx-auto mb-1 text-curse-300" /><div className="font-mono font-bold text-lg text-curse-300">{entries.length}</div><div className="text-[10px] text-zinc-500 uppercase">Transactions</div></div>
        </section>

        <section className="glass rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search TX ID or note..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm focus:border-curse-500/50 outline-none" /></div>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm focus:border-curse-500/50 outline-none">
              <option value="all">All Types</option>
              {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-zinc-500 text-sm">Loading ledger...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8"><Receipt className="w-10 h-10 text-zinc-700 mx-auto mb-2" /><p className="text-sm text-zinc-500">No transactions found. Start playing to generate receipts!</p></div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((entry, i) => {
                const meta = TYPE_META[entry.type] || { icon: Coins, color: 'text-zinc-400', label: entry.type };
                const Icon = meta.icon;
                const isCredit = entry.direction === 'in';
                return (
                  <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.02, 0.5) }} className="flex items-center gap-3 rounded-xl bg-ink-800 p-3 hover:bg-ink-700 transition-colors">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isCredit ? 'bg-jade-500/10' : 'bg-blood-500/10'}`}><Icon className={`w-4 h-4 ${meta.color}`} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="text-xs text-white font-semibold">{meta.label}</span><span className="font-mono text-[10px] text-zinc-600">{entry.tx_hash}</span></div>
                      <div className="text-[11px] text-zinc-500 truncate">{entry.note || 'No note'}</div>
                      <div className="text-[10px] text-zinc-600">{new Date(entry.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-mono font-bold text-sm ${isCredit ? 'text-jade-400' : 'text-blood-400'}`}>{isCredit ? '+' : '-'}{fmt(Math.abs(entry.amount))}</div>
                      {entry.balance_after != null && <div className="text-[10px] text-zinc-600 font-mono">Bal: {fmt(entry.balance_after)}</div>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
