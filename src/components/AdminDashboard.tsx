import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, DollarSign, Calendar, Crown, Coins, Swords, Store, Users as UsersIcon, Activity, Eye, EyeOff, Lock, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fmt, fmtUsd } from '@/lib/ui';

const ADMIN_PASSPHRASE = 'dna-admin-2026';

interface TreasuryEntry {
  id: string; tx_id: string; user_id: string; type: string;
  amount: number; currency: string; direction: string; note: string | null; created_at: string;
}

interface RevenueStream {
  name: string; rate: string; icon: typeof Coins; color: string;
  dailyEstimate: (dau: number, avgVolume: number) => number;
}

const REVENUE_STREAMS: RevenueStream[] = [
  { name: 'PvP Wager Rake', rate: '5% house cut', icon: Swords, color: 'text-blood-400',
    dailyEstimate: (dau) => dau * 0.3 * 500 * 0.05 },
  { name: 'Infinity Exchange', rate: '0.50% fee', icon: TrendingUp, color: 'text-gold-400',
    dailyEstimate: (dau, vol) => vol * 0.005 },
  { name: 'Cursed Store Sales', rate: '15% platform', icon: Store, color: 'text-jade-400',
    dailyEstimate: (dau) => dau * 0.15 * 2.99 },
  { name: 'Clan Creation Fees', rate: 'Flat 5000 🧬 DNA', icon: UsersIcon, color: 'text-curse-300',
    dailyEstimate: (dau) => dau * 0.02 * 50 },
  { name: 'Domain Node Sales', rate: 'Real Yield nodes', icon: Crown, color: 'text-rose-300',
    dailyEstimate: (dau) => dau * 0.005 * 200 },
];

export function AdminDashboard() {
  const [unlocked, setUnlocked] = useState(false);
  const [pass, setPass] = useState('');
  const [scenario, setScenario] = useState<10 | 50 | 100>(10);
  const [treasuryFeed, setTreasuryFeed] = useState<TreasuryEntry[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalTx, setTotalTx] = useState(0);

  const dau = scenario * 1000;
  const avgDailyVolume = scenario === 10 ? 50000 : scenario === 50 ? 250000 : 500000;

  useEffect(() => {
    if (unlocked) loadTreasuryData();
  }, [unlocked]);

  const loadTreasuryData = async () => {
    const { data: txData } = await supabase.from('transactions_ledger').select('*').order('created_at', { ascending: false }).limit(50);
    if (txData) setTreasuryFeed(txData as TreasuryEntry[]);
    const { count: userCount } = await supabase.from('user_balances').select('*', { count: 'exact', head: true });
    if (userCount) setTotalUsers(userCount);
    const { count: txCount } = await supabase.from('transactions_ledger').select('*', { count: 'exact', head: true });
    if (txCount) setTotalTx(txCount);
  };

  const dailyNetCut = REVENUE_STREAMS.reduce((sum, s) => sum + s.dailyEstimate(dau, avgDailyVolume), 0);
  const monthlyRevenue = dailyNetCut * 30;

  if (!unlocked) return (
    <div className="min-h-screen bg-domain flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-sm w-full glass-strong rounded-3xl border border-curse-500/40 p-6">
        <div className="flex items-center gap-3 mb-5"><div className="w-12 h-12 rounded-2xl bg-curse-500/15 flex items-center justify-center"><Lock className="w-6 h-6 text-curse-300" /></div><div><h1 className="font-display font-bold text-white">Founder's Treasury</h1><p className="text-xs text-zinc-500">Admin access only</p></div></div>
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Admin passphrase" className="w-full px-4 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm focus:border-curse-500/50 outline-none" onKeyDown={(e) => { if (e.key === 'Enter' && pass === ADMIN_PASSPHRASE) { setUnlocked(true); loadTreasuryData(); } }} />
        <button onClick={() => { if (pass === ADMIN_PASSPHRASE) { setUnlocked(true); loadTreasuryData(); } }} className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-curse-500 to-curse-700 text-white font-bold text-sm shadow-curse-glow">Unlock Dashboard</button>
      </motion.div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border-gradient p-6">
        <div className="absolute -top-16 -right-8 w-48 h-48 rounded-full bg-gold-500/20 blur-3xl animate-pulse-glow" />
        <div className="relative">
          <div className="flex items-center gap-2 text-gold-400/80 text-xs tracking-[0.3em] uppercase mb-2"><Crown className="w-3.5 h-3.5" /> Founder Access</div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white text-glow">Treasury Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-2">Real-time platform revenue, user metrics, and treasury flow.</p>
        </div>
      </section>

      {/* Scenario Toggle */}
      <section className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-curse-300" /><span className="text-sm font-bold text-white">Scenario Model</span></div>
        <div className="grid grid-cols-3 gap-2">
          {([10, 50, 100] as const).map((s) => (
            <button key={s} onClick={() => setScenario(s)} className={`py-3 rounded-xl text-sm font-bold transition-all ${scenario === s ? 'bg-gradient-to-r from-curse-500 to-curse-700 text-white shadow-curse-glow' : 'bg-ink-800 text-zinc-500 border border-ink-700'}`}>
              {s}k DAU
            </button>
          ))}
        </div>
      </section>

      {/* Key Metrics */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard icon={Users} label="DAU" value={fmt(dau)} color="text-curse-300" />
        <MetricCard icon={TrendingUp} label="24h Volume" value={fmtUsd(avgDailyVolume)} color="text-gold-400" />
        <MetricCard icon={DollarSign} label="Daily Net Cut" value={fmtUsd(dailyNetCut)} color="text-jade-400" />
        <MetricCard icon={Calendar} label="Monthly Revenue" value={fmtUsd(monthlyRevenue)} color="text-rose-300" />
      </section>

      {/* Revenue Stream Breakdown */}
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4"><Coins className="w-4 h-4 text-gold-400" /><h3 className="font-display font-bold text-white text-sm">Real Yield Revenue Streams</h3></div>
        <div className="space-y-3">
          {REVENUE_STREAMS.map((stream) => {
            const daily = stream.dailyEstimate(dau, avgDailyVolume);
            const monthly = daily * 30;
            const Icon = stream.icon;
            return (
              <div key={stream.name} className="flex items-center gap-3 rounded-xl bg-ink-800 p-3">
                <div className="w-9 h-9 rounded-lg bg-ink-700 flex items-center justify-center shrink-0"><Icon className={`w-4 h-4 ${stream.color}`} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-semibold">{stream.name}</div>
                  <div className="text-[10px] text-zinc-500">{stream.rate}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-mono font-bold text-sm ${stream.color}`}>{fmtUsd(daily)}</div>
                  <div className="text-[10px] text-zinc-600">/day · {fmtUsd(monthly)}/mo</div>
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-gold-500/10 to-rose-500/10 border border-gold-500/30 p-3">
            <div className="flex items-center gap-2"><Crown className="w-5 h-5 text-gold-400" /><span className="font-display font-bold text-white text-sm">Total Projected Monthly Revenue</span></div>
            <div className="font-mono font-black text-xl text-gold-400">{fmtUsd(monthlyRevenue)}</div>
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="grid grid-cols-3 gap-3">
        <MetricCard icon={Users} label="Total Users" value={fmt(totalUsers)} color="text-curse-300" />
        <MetricCard icon={Activity} label="Total Tx" value={fmt(totalTx)} color="text-energy-400" />
        <MetricCard icon={DollarSign} label="Avg/User" value={fmtUsd(dailyNetCut / dau)} color="text-jade-400" />
      </section>

      {/* Live Treasury Ledger */}
      <section className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3"><ArrowUpRight className="w-4 h-4 text-jade-400" /><h3 className="font-display font-bold text-white text-sm">Live Treasury Feed</h3></div>
        {treasuryFeed.length === 0 ? (
          <div className="text-center py-6 text-zinc-600 text-sm">No transactions yet. Revenue appears here in real-time.</div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {treasuryFeed.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-lg bg-ink-800 p-2.5 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full ${entry.direction === 'in' ? 'bg-jade-400' : 'bg-blood-400'}`} />
                <div className="flex-1 min-w-0"><div className="text-white font-mono text-[10px]">{entry.tx_id}</div><div className="text-zinc-500 truncate">{entry.note || entry.type}</div></div>
                <div className="text-right shrink-0"><div className={`font-mono font-bold ${entry.direction === 'in' ? 'text-jade-400' : 'text-blood-400'}`}>{entry.direction === 'in' ? '+' : '-'}{fmt(Math.abs(entry.amount))}</div><div className="text-[9px] text-zinc-600">{entry.currency}</div></div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: string; color: string }) {
  return (
    <div className="glass rounded-2xl p-3 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
      <div className={`font-mono font-bold text-sm ${color}`}>{value}</div>
      <div className="text-[9px] text-zinc-500 uppercase">{label}</div>
    </div>
  );
}
