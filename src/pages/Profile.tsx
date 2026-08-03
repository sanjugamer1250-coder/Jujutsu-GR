import { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, Coins, Zap, Trophy, Star, TrendingUp, RotateCcw, Shield, Hash, Lock } from 'lucide-react';
import { useDnaBalance, useCursedEnergy, useRoster, useTxLog, useStorageSync } from '@/lib/hooks';
import { CHARACTERS, RARITY_META } from '@/lib/characters';
import { fmt, fmtUsd, pushToast } from '@/lib/ui';
import { resetAccount, readJSON, STORAGE_KEYS } from '@/lib/economy';

export default function Profile() {
  const dna = useDnaBalance();
  const energy = useCursedEnergy();
  const roster = useRoster();
  const txLog = useTxLog();
  useStorageSync();
  const owned = CHARACTERS.filter((c) => roster.includes(c.id));
  const [tab, setTab] = useState<'roster' | 'stats' | 'history'>('roster');

  const battles = readJSON<{ result: 'win' | 'loss' }[]>(STORAGE_KEYS.battleHistory, []);
  const wins = battles.filter((b) => b.result === 'win').length;
  const winRate = battles.length ? Math.round((wins / battles.length) * 100) : 0;
  const storyProgress = readJSON<string[]>(STORAGE_KEYS.storyProgress, []);
  const collectionRate = Math.round((owned.length / CHARACTERS.length) * 100);
  const power = owned.reduce((s, c) => s + c.atk + c.def + c.hp / 10 + c.speed, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl glass-strong border border-curse-500/30 p-6">
        <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-curse-500/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-curse-500 to-energy-600 flex items-center justify-center shadow-curse-glow-lg shrink-0">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-curse-300/70 tracking-[0.2em] uppercase">Sorcerer</div>
            <h1 className="font-display font-black text-2xl text-white text-glow truncate">Commander</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge icon={Coins} color="text-gold-400" label={`${fmt(dna)} 🧬 DNA`} />
              <Badge icon={Zap} color="text-energy-400" label={`${fmt(energy)} CE`} />
              <Badge icon={Trophy} color="text-curse-300" label={`${wins}W / ${battles.length - wins}L`} />
            </div>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span className="flex items-center gap-1"><Swords className="w-3 h-3" /> Total Power</span>
            <span className="font-mono text-white">{Math.round(power)}</span>
          </div>
          <div className="h-2 rounded-full bg-ink-700 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (power / 6000) * 100)}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-gradient-to-r from-curse-500 via-energy-500 to-gold-400" />
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat icon={Star} label="Collection" value={`${collectionRate}%`} color="text-gold-400" />
        <MiniStat icon={Trophy} label="Win Rate" value={`${winRate}%`} color="text-jade-400" />
        <MiniStat icon={Hash} label="Roster" value={`${owned.length}/${CHARACTERS.length}`} color="text-curse-300" />
        <MiniStat icon={TrendingUp} label="Story" value={`${storyProgress.length}/8`} color="text-energy-400" />
      </section>

      <section>
        <div className="flex gap-2 mb-4">
          {(['roster', 'stats', 'history'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-curse-500/20 text-curse-200 border border-curse-500/40 shadow-curse-glow' : 'glass text-zinc-400 border border-transparent'}`}>{t}</button>
          ))}
        </div>

        {tab === 'roster' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {CHARACTERS.map((c) => {
              const has = roster.includes(c.id);
              const meta = RARITY_META[c.rarity];
              return (
                <div key={c.id} className={`relative rounded-2xl overflow-hidden border ${has ? 'border-curse-500/30 glass' : 'border-ink-700 bg-ink-850/60'}`}>
                  <div className="aspect-[3/4] relative">
                    <img src={c.image} alt={c.name} className={`w-full h-full object-cover ${has ? '' : 'grayscale opacity-30'}`} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                    {!has && <div className="absolute inset-0 flex items-center justify-center"><Lock className="w-6 h-6 text-zinc-600" /></div>}
                    <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] font-bold font-mono ${meta.color}`}>{meta.label}</div>
                  </div>
                  <div className="p-2">
                    <div className={`text-xs font-semibold truncate ${has ? 'text-white' : 'text-zinc-600'}`}>{c.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{c.title}</div>
                    {has && <div className="flex gap-2 mt-1 text-[9px] font-mono text-zinc-400"><span>ATK {c.atk}</span><span>HP {c.hp}</span></div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'stats' && (
          <div className="glass rounded-2xl p-5 space-y-4">
            <StatRow label="Total 🧬 DNA" value={fmtUsd(dna)} />
            <StatRow label="Cursed Energy" value={fmt(energy)} />
            <StatRow label="Characters owned" value={`${owned.length} / ${CHARACTERS.length}`} />
            <StatRow label="Battles fought" value={`${battles.length}`} />
            <StatRow label="Wins" value={`${wins}`} />
            <StatRow label="Story chapters cleared" value={`${storyProgress.length}`} />
            <StatRow label="Total Power" value={String(Math.round(power))} />
            <div className="pt-3 border-t border-ink-700">
              <button onClick={() => { if (confirm('Reset your entire account? This wipes all progress, 🧬 DNA, and characters.')) { resetAccount(); pushToast('Account reset.', 'info'); } }} className="flex items-center gap-2 text-blood-400 hover:text-blood-500 text-sm font-medium">
                <RotateCcw className="w-4 h-4" /> Reset Account
              </button>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="glass rounded-2xl divide-y divide-ink-700">
            {txLog.length === 0 ? <div className="p-6 text-center text-zinc-500 text-sm">No transactions yet.</div> :
              txLog.slice(0, 30).map((t) => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${t.direction === 'in' ? 'bg-jade-400' : 'bg-blood-400'}`} />
                    <div>
                      <div className="text-sm text-white capitalize">{t.type}</div>
                      <div className="text-[10px] text-zinc-500">{t.note || new Date(t.ts).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className={`font-mono text-sm ${t.direction === 'in' ? 'text-jade-400' : 'text-blood-400'}`}>{t.direction === 'in' ? '+' : '-'}{fmt(t.amount)}</div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Badge({ icon: Icon, color, label }: { icon: typeof Coins; color: string; label: string }) {
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ink-800/80 border border-ink-700 text-xs font-mono font-semibold ${color}`}><Icon className="w-3 h-3" /> {label}</span>;
}
function MiniStat({ icon: Icon, label, value, color }: { icon: typeof Coins; label: string; value: string; color: string }) {
  return <div className="glass rounded-2xl p-3 text-center"><Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} /><div className={`font-mono font-bold text-lg ${color}`}>{value}</div><div className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</div></div>;
}
function StatRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="text-sm text-zinc-400">{label}</span><span className="font-mono font-semibold text-white">{value}</span></div>;
}
