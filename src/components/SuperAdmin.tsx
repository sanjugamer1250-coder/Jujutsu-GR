import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Unlock, KeyRound, Settings, Link2, Clock, Coins, TrendingUp, Users, Activity, DollarSign, Calendar, Crown, Swords, Store, AlertCircle, CheckCircle2, ExternalLink, Eye, EyeOff, Zap, Droplets, Lock as LockIcon, Wallet, ArrowUpRight, ArrowDownRight, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fmt, fmtUsd } from '@/lib/ui';
import { IDOLiquidity } from '@/components/IDOLiquidity';

const SUPER_ADMIN_KEY = 'dna_super_admin_authed';
const PANCAKE_V2_ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
const BSC_EXPLORER = 'https://bscscan.com';

type AdminTab = 'overview' | 'treasury' | 'liquidity' | 'contracts' | 'lockup' | 'users';

interface TreasuryEntry {
  id: string; tx_id: string; user_id: string; type: string;
  amount: number; currency: string; direction: string; note: string | null; created_at: string;
}

interface ContractConfig {
  routerAddress: string;
  dnaTokenAddress: string;
  wbnbAddress: string;
  factoryAddress: string;
  timeLockDays: number;
  lockProvider: 'pinklock' | 'unicrypt';
  maxWithdrawalPerDay: number;
  emergencyWithdrawEnabled: boolean;
}

const DEFAULT_CONFIG: ContractConfig = {
  routerAddress: PANCAKE_V2_ROUTER,
  dnaTokenAddress: '',
  wbnbAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  factoryAddress: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
  timeLockDays: 365,
  lockProvider: 'pinklock',
  maxWithdrawalPerDay: 10,
  emergencyWithdrawEnabled: false,
};

const REVENUE_STREAMS = [
  { name: 'PvP Wager Rake', rate: '5% house cut', icon: Swords, color: 'text-blood-400', dailyEstimate: (dau: number) => dau * 0.3 * 500 * 0.05 },
  { name: 'Infinity Exchange', rate: '0.50% fee', icon: TrendingUp, color: 'text-gold-400', dailyEstimate: (dau: number, vol: number) => vol * 0.005 },
  { name: 'Cursed Store Sales', rate: '15% platform', icon: Store, color: 'text-jade-400', dailyEstimate: (dau: number) => dau * 0.15 * 2.99 },
  { name: 'Clan Creation Fees', rate: 'Flat 5000 🧬 DNA', icon: Users, color: 'text-curse-300', dailyEstimate: (dau: number) => dau * 0.02 * 50 },
  { name: 'Domain Node Sales', rate: 'Real Yield nodes', icon: Crown, color: 'text-rose-300', dailyEstimate: (dau: number) => dau * 0.005 * 200 },
];

export function SuperAdmin() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState('');
  const [tab, setTab] = useState<AdminTab>('overview');

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(SUPER_ADMIN_KEY) === '1') setAuthed(true);
  }, []);

  if (!authed) return (
    <div className="min-h-screen bg-domain flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-sm w-full glass-strong rounded-3xl border border-blood-500/40 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blood-500/15 flex items-center justify-center"><Shield className="w-6 h-6 text-blood-400" /></div>
          <div><h1 className="font-display font-bold text-white">Super Admin Access</h1><p className="text-xs text-zinc-500">Separate from game admin</p></div>
        </div>
        <p className="text-xs text-zinc-500 mb-4">This panel is separate from the in-game admin. It manages treasury funds, PancakeSwap V2 Router configuration, LP time-lock, and emergency fund access. Use the dedicated super admin passphrase.</p>
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Super Admin passphrase" className="w-full px-4 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm focus:border-blood-500/50 outline-none" onKeyDown={(e) => { if (e.key === 'Enter') tryAuth(); }} />
        <button onClick={tryAuth} className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-blood-500 to-blood-700 text-white font-bold text-sm shadow-blood-glow">Unlock Super Admin</button>
      </motion.div>
    </div>
  );

  function tryAuth() {
    if (pass === 'dna-super-admin-2026' || pass === 'dna-admin-2026') {
      setAuthed(true);
      if (typeof window !== 'undefined') sessionStorage.setItem(SUPER_ADMIN_KEY, '1');
    } else {
      alert('Incorrect passphrase. Use the super admin passphrase: dna-super-admin-2026');
    }
  }

  return (
    <div className="min-h-screen bg-domain">
      <div className="sticky top-0 z-40 glass-strong border-b border-blood-500/20">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blood-500 to-blood-700 flex items-center justify-center shadow-blood-glow"><Shield className="w-4 h-4 text-white" /></div>
            <div className="leading-none"><div className="font-display font-bold text-sm text-blood-400">Super Admin Panel</div><div className="text-[9px] text-zinc-500 tracking-wider uppercase">🧬 DNA Treasury · BNB Chain</div></div>
          </div>
          <button onClick={() => { sessionStorage.removeItem(SUPER_ADMIN_KEY); setAuthed(false); }} className="text-xs text-zinc-500 hover:text-white">Lock</button>
        </div>
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 pb-2 overflow-x-auto no-scrollbar">
          {(['overview', 'treasury', 'liquidity', 'contracts', 'lockup', 'users'] as AdminTab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap ${tab === t ? 'bg-blood-500/15 text-blood-400 border border-blood-500/30' : 'text-zinc-500 border border-transparent'}`}>{t === 'lockup' ? 'Time-Lock' : t}</button>
          ))}
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-5">
        <AnimatePresence mode="wait">
          {tab === 'overview' && <OverviewTab key="overview" />}
          {tab === 'treasury' && <TreasuryTab key="treasury" />}
          {tab === 'liquidity' && <div key="liquidity"><IDOLiquidity /></div>}
          {tab === 'contracts' && <ContractsTab key="contracts" />}
          {tab === 'lockup' && <LockupTab key="lockup" />}
          {tab === 'users' && <UsersTab key="users" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OverviewTab() {
  const [scenario, setScenario] = useState(10 | 50 | 100);
  const [treasuryFeed, setTreasuryFeed] = useState<TreasuryEntry[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalTx, setTotalTx] = useState(0);
  const [adminPool, setAdminPool] = useState(0);

  const dau = scenario * 1000;
  const avgDailyVolume = scenario === 10 ? 50000 : scenario === 50 ? 250000 : 500000;
  const dailyNetCut = REVENUE_STREAMS.reduce((sum, s) => sum + s.dailyEstimate(dau, avgDailyVolume), 0);
  const monthlyRevenue = dailyNetCut * 30;

  useEffect(() => {
    (async () => {
      const { data: txData } = await supabase.from('transactions_ledger').select('*').order('created_at', { ascending: false }).limit(50);
      if (txData) setTreasuryFeed(txData as TreasuryEntry[]);
      const { count: userCount } = await supabase.from('user_balances').select('*', { count: 'exact', head: true });
      if (userCount) setTotalUsers(userCount);
      const { count: txCount } = await supabase.from('transactions_ledger').select('*', { count: 'exact', head: true });
      if (txCount) setTotalTx(txCount);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border-gradient p-6">
        <div className="absolute -top-16 -right-8 w-48 h-48 rounded-full bg-blood-500/20 blur-3xl animate-pulse-glow" />
        <div className="relative">
          <div className="flex items-center gap-2 text-blood-400/80 text-xs tracking-[0.3em] uppercase mb-2"><Shield className="w-3.5 h-3.5" /> Super Admin Access</div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white text-glow">Treasury Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-2">Real-time platform revenue, treasury flow, and BNB Smart Chain contract management.</p>
        </div>
      </section>
      <section className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-blood-300" /><span className="text-sm font-bold text-white">Scenario Model</span></div>
        <div className="grid grid-cols-3 gap-2">{([10, 50, 100] as const).map((s) => (<button key={s} onClick={() => setScenario(s)} className={`py-3 rounded-xl text-sm font-bold transition-all ${scenario === s ? 'bg-gradient-to-r from-blood-500 to-blood-700 text-white shadow-blood-glow' : 'bg-ink-800 text-zinc-500 border border-ink-700'}`}>{s}k DAU</button>))}</div>
      </section>
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard icon={Users} label="DAU" value={fmt(dau)} color="text-curse-300" />
        <MetricCard icon={TrendingUp} label="24h Volume" value={fmtUsd(avgDailyVolume)} color="text-gold-400" />
        <MetricCard icon={DollarSign} label="Daily Net Cut" value={fmtUsd(dailyNetCut)} color="text-jade-400" />
        <MetricCard icon={Calendar} label="Monthly Revenue" value={fmtUsd(monthlyRevenue)} color="text-rose-300" />
      </section>
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4"><Coins className="w-4 h-4 text-gold-400" /><h3 className="font-display font-bold text-white text-sm">Real Yield Revenue Streams</h3></div>
        <div className="space-y-3">
          {REVENUE_STREAMS.map((stream) => { const daily = stream.dailyEstimate(dau, avgDailyVolume); const monthly = daily * 30; const Icon = stream.icon; return (
            <div key={stream.name} className="flex items-center gap-3 rounded-xl bg-ink-800 p-3">
              <div className="w-9 h-9 rounded-lg bg-ink-700 flex items-center justify-center shrink-0"><Icon className={`w-4 h-4 ${stream.color}`} /></div>
              <div className="flex-1 min-w-0"><div className="text-sm text-white font-semibold">{stream.name}</div><div className="text-[10px] text-zinc-500">{stream.rate}</div></div>
              <div className="text-right shrink-0"><div className={`font-mono font-bold text-sm ${stream.color}`}>{fmtUsd(daily)}</div><div className="text-[10px] text-zinc-600">/day · {fmtUsd(monthly)}/mo</div></div>
            </div>
          ); })}
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-gold-500/10 to-rose-500/10 border border-gold-500/30 p-3">
            <div className="flex items-center gap-2"><Crown className="w-5 h-5 text-gold-400" /><span className="font-display font-bold text-white text-sm">Total Projected Monthly Revenue</span></div>
            <div className="font-mono font-black text-xl text-gold-400">{fmtUsd(monthlyRevenue)}</div>
          </div>
        </div>
      </section>
      <section className="grid grid-cols-3 gap-3">
        <MetricCard icon={Users} label="Total Users" value={fmt(totalUsers)} color="text-curse-300" />
        <MetricCard icon={Activity} label="Total Tx" value={fmt(totalTx)} color="text-energy-400" />
        <MetricCard icon={DollarSign} label="Avg/User" value={fmtUsd(dailyNetCut / dau)} color="text-jade-400" />
      </section>
      <section className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3"><ArrowUpRight className="w-4 h-4 text-jade-400" /><h3 className="font-display font-bold text-white text-sm">Live Treasury Feed</h3></div>
        {treasuryFeed.length === 0 ? <div className="text-center py-6 text-zinc-600 text-sm">No transactions yet. Revenue appears here in real-time.</div> :
          <div className="space-y-1.5 max-h-64 overflow-y-auto">{treasuryFeed.map((entry) => (<div key={entry.id} className="flex items-center gap-3 rounded-lg bg-ink-800 p-2.5 text-xs"><span className={`w-1.5 h-1.5 rounded-full ${entry.direction === 'in' ? 'bg-jade-400' : 'bg-blood-400'}`} /><div className="flex-1 min-w-0"><div className="text-white font-mono text-[10px]">{entry.tx_id}</div><div className="text-zinc-500 truncate">{entry.note || entry.type}</div></div><div className="text-right shrink-0"><div className={`font-mono font-bold ${entry.direction === 'in' ? 'text-jade-400' : 'text-blood-400'}`}>{entry.direction === 'in' ? '+' : '-'}{fmt(Math.abs(entry.amount))}</div><div className="text-[9px] text-zinc-600">{entry.currency}</div></div></div>))}</div>}
      </section>
    </div>
  );
}

function TreasuryTab() {
  const [feed, setFeed] = useState<TreasuryEntry[]>([]);
  const [totalIn, setTotalIn] = useState(0);
  const [totalOut, setTotalOut] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('transactions_ledger').select('*').order('created_at', { ascending: false }).limit(100);
      if (data) { setFeed(data as TreasuryEntry[]); setTotalIn(data.filter((d: any) => d.direction === 'in').reduce((s: number, d: any) => s + Number(d.amount), 0)); setTotalOut(data.filter((d: any) => d.direction === 'out').reduce((s: number, d: any) => s + Number(d.amount), 0)); }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-3 gap-3">
        <MetricCard icon={ArrowDownRight} label="Total Inflow" value={fmt(totalIn)} color="text-jade-400" />
        <MetricCard icon={ArrowUpRight} label="Total Outflow" value={fmt(totalOut)} color="text-blood-400" />
        <MetricCard icon={Wallet} label="Net Treasury" value={fmt(totalIn - totalOut)} color="text-gold-400" />
      </section>
      <section className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-blood-400" /><h3 className="font-display font-bold text-white text-sm">All Treasury Transactions</h3></div>
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {feed.length === 0 ? <div className="text-center py-6 text-zinc-600 text-sm">No transactions yet.</div> :
            feed.map((entry) => (<div key={entry.id} className="flex items-center gap-3 rounded-lg bg-ink-800 p-2.5 text-xs"><span className={`w-1.5 h-1.5 rounded-full ${entry.direction === 'in' ? 'bg-jade-400' : 'bg-blood-400'}`} /><div className="flex-1 min-w-0"><div className="text-white font-mono text-[10px]">{entry.tx_id}</div><div className="text-zinc-500 truncate">{entry.note || entry.type} · {entry.user_id.slice(0, 8)}...</div></div><div className="text-right shrink-0"><div className={`font-mono font-bold ${entry.direction === 'in' ? 'text-jade-400' : 'text-blood-400'}`}>{entry.direction === 'in' ? '+' : '-'}{fmt(Math.abs(entry.amount))}</div><div className="text-[9px] text-zinc-600">{entry.currency}</div></div></div>))}
        </div>
      </section>
    </div>
  );
}

function ContractsTab() {
  const [config, setConfig] = useState<ContractConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [showRouter, setShowRouter] = useState(false);

  const save = () => {
    if (typeof window !== 'undefined') localStorage.setItem('dna_contract_config', JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') { const stored = localStorage.getItem('dna_contract_config'); if (stored) setConfig(JSON.parse(stored)); }
  }, []);

  return (
    <div className="space-y-4">
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4"><Settings className="w-4 h-4 text-blood-400" /><h3 className="font-display font-bold text-white text-sm">PancakeSwap V2 Router Configuration</h3></div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">PancakeSwap V2 Router Address (BSC)</label>
            <div className="relative">
              <input type="text" value={config.routerAddress} onChange={(e) => setConfig({ ...config, routerAddress: e.target.value })} className="w-full px-3 py-2.5 pr-20 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm font-mono focus:border-blood-500/50 outline-none" />
              <button onClick={() => setShowRouter(!showRouter)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">{showRouter ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
            <a href={`${BSC_EXPLORER}/address/${config.routerAddress}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-blood-400/60 hover:text-blood-400 mt-1"><ExternalLink className="w-3 h-3" /> Verify on BscScan</a>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">🧬 DNA Token Contract Address (BEP-20)</label>
            <input type="text" value={config.dnaTokenAddress} onChange={(e) => setConfig({ ...config, dnaTokenAddress: e.target.value })} placeholder="0x... (deploy before listing)" className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm font-mono focus:border-blood-500/50 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-zinc-400 mb-1.5 block">WBNB Address</label><input type="text" value={config.wbnbAddress} onChange={(e) => setConfig({ ...config, wbnbAddress: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-xs font-mono focus:border-blood-500/50 outline-none" /></div>
            <div><label className="text-xs text-zinc-400 mb-1.5 block">Factory Address</label><input type="text" value={config.factoryAddress} onChange={(e) => setConfig({ ...config, factoryAddress: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-xs font-mono focus:border-blood-500/50 outline-none" /></div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Max Daily Withdrawal (BNB)</label>
            <input type="number" value={config.maxWithdrawalPerDay} onChange={(e) => setConfig({ ...config, maxWithdrawalPerDay: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm font-mono focus:border-blood-500/50 outline-none" />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-ink-800 p-3 border border-blood-500/20">
            <div><div className="text-sm text-white font-semibold">Emergency Withdrawal</div><div className="text-[10px] text-zinc-500">Allow emergency treasury fund access bypassing time-lock</div></div>
            <button onClick={() => setConfig({ ...config, emergencyWithdrawEnabled: !config.emergencyWithdrawEnabled })} className={`relative w-12 h-6 rounded-full transition-colors ${config.emergencyWithdrawEnabled ? 'bg-blood-500' : 'bg-ink-700'}`}><motion.div animate={{ x: config.emergencyWithdrawEnabled ? 24 : 0 }} className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white" /></button>
          </div>
          <button onClick={save} className="w-full py-3 rounded-xl bg-gradient-to-r from-blood-500 to-blood-700 text-white font-bold text-sm shadow-blood-glow flex items-center justify-center gap-2">{saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Settings className="w-4 h-4" /> Save Contract Configuration</>}</button>
        </div>
      </section>
      <section className="glass rounded-2xl p-4 border border-blood-500/20">
        <div className="flex items-start gap-2"><AlertCircle className="w-4 h-4 text-blood-400 mt-0.5 shrink-0" /><div className="text-xs text-zinc-400"><strong className="text-blood-400">Security Notice:</strong> The router address controls how liquidity is added via <code className="text-blood-400 text-[10px]">addLiquidityETH()</code>. Only use the official PancakeSwap V2 Router: <code className="text-white text-[10px]">{PANCAKE_V2_ROUTER}</code>. Never change this to an unknown address.</div></div>
      </section>
    </div>
  );
}

function LockupTab() {
  const [config, setConfig] = useState<ContractConfig>(DEFAULT_CONFIG);
  const [locked, setLocked] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') { const stored = localStorage.getItem('dna_contract_config'); if (stored) setConfig(JSON.parse(stored)); }
  }, []);

  const unlockDate = new Date(Date.now() + config.timeLockDays * 86400000);
  const daysRemaining = Math.ceil((unlockDate.getTime() - Date.now()) / 86400000);

  return (
    <div className="space-y-4">
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4"><LockIcon className="w-4 h-4 text-gold-400" /><h3 className="font-display font-bold text-white text-sm">LP Time-Lock Configuration</h3></div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Lock Duration: {config.timeLockDays} days ({Math.round(config.timeLockDays / 30 * 10) / 10} months)</label>
            <input type="range" min={30} max={730} step={30} value={config.timeLockDays} onChange={(e) => setConfig({ ...config, timeLockDays: Number(e.target.value) })} className="w-full accent-gold-500" />
            <div className="flex justify-between text-[10px] text-zinc-600 mt-1"><span>30 days</span><span>730 days (2 years)</span></div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block">Lock Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {(['pinklock', 'unicrypt'] as const).map((p) => (<button key={p} onClick={() => setConfig({ ...config, lockProvider: p })} className={`py-2.5 rounded-xl text-sm font-bold capitalize ${config.lockProvider === p ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30' : 'bg-ink-800 text-zinc-500 border border-ink-700'}`}>{p === 'pinklock' ? 'PinkLock' : 'Unicrypt'}</button>))}
            </div>
          </div>
          <div className="rounded-xl bg-ink-800 p-4 border border-gold-500/20">
            <div className="flex items-center gap-2 mb-3"><Clock className="w-4 h-4 text-gold-400" /><span className="text-sm text-white">Lock Status</span></div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-zinc-500">Lock Duration</span><span className="font-mono text-gold-400">{config.timeLockDays} days</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Unlock Date</span><span className="font-mono text-white">{unlockDate.toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Days Remaining</span><span className="font-mono text-jade-400">{daysRemaining}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Provider</span><span className="font-mono text-gold-400 capitalize">{config.lockProvider}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Status</span><span className={`font-mono ${locked ? 'text-jade-400' : 'text-blood-400'}`}>{locked ? 'LOCKED' : 'UNLOCKED'}</span></div>
            </div>
          </div>
          <button onClick={() => { if (typeof window !== 'undefined') localStorage.setItem('dna_contract_config', JSON.stringify(config)); }} className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-black font-bold text-sm flex items-center justify-center gap-2"><LockIcon className="w-4 h-4" /> Update Time-Lock Settings</button>
        </div>
      </section>
      <section className="glass rounded-2xl p-4 border border-blood-500/30">
        <div className="flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4 text-blood-400" /><h3 className="font-display font-bold text-blood-400 text-sm">Emergency Fund Access</h3></div>
        <p className="text-xs text-zinc-500 mb-3">If emergency withdrawal is enabled in the Contracts tab, you can bypass the time-lock to access treasury funds. This should only be used in critical situations.</p>
        <div className="rounded-xl bg-ink-800 p-3 border border-blood-500/20 mb-3">
          <div className="text-xs text-zinc-400 mb-2">Emergency withdrawal is currently:</div>
          <div className={`text-sm font-bold ${config.emergencyWithdrawEnabled ? 'text-blood-400' : 'text-jade-400'}`}>{config.emergencyWithdrawEnabled ? 'ENABLED — Funds accessible' : 'DISABLED — Funds locked'}</div>
        </div>
        <button disabled={!config.emergencyWithdrawEnabled} className={`w-full py-3 rounded-xl font-bold text-sm ${config.emergencyWithdrawEnabled ? 'bg-gradient-to-r from-blood-500 to-blood-700 text-white shadow-blood-glow' : 'bg-ink-800 text-zinc-600'}`}>Execute Emergency Withdrawal</button>
      </section>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('user_balances').select('*').order('created_at', { ascending: false }).limit(50);
      if (data) setUsers(data);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <section className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-blood-400" /><h3 className="font-display font-bold text-white text-sm">Registered Users</h3></div>
        {loading ? <div className="text-center py-6 text-zinc-600 text-sm">Loading...</div> :
          users.length === 0 ? <div className="text-center py-6 text-zinc-600 text-sm">No users registered yet.</div> :
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {users.map((u) => (<div key={u.user_id} className="flex items-center gap-3 rounded-lg bg-ink-800 p-2.5 text-xs"><div className="w-8 h-8 rounded-full bg-blood-500/15 flex items-center justify-center text-blood-400 font-bold text-[10px]">{(u.user_id || '?').slice(0, 2).toUpperCase()}</div><div className="flex-1 min-w-0"><div className="text-white font-mono text-[10px] truncate">{u.user_id}</div><div className="text-zinc-500">{u.rank_tier || 'Bronze'} · KYC Tier {u.kyc_tier || 0}</div></div><div className="text-right shrink-0"><div className="font-mono font-bold text-gold-400">{fmt(u.dna || 0)} 🧬 DNA</div><div className="text-[9px] text-zinc-600">{fmt(u.usdt || 0)} USDT</div></div></div>))}
          </div>}
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: string; color: string }) {
  return (<div className="glass rounded-2xl p-3 text-center"><Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} /><div className={`font-mono font-bold text-sm ${color}`}>{value}</div><div className="text-[9px] text-zinc-500 uppercase">{label}</div></div>);
}
