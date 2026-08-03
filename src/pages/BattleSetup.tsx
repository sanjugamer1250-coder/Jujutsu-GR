import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Swords, ChevronLeft, Zap, Star, ArrowRight, Lock, Shield } from 'lucide-react';
import { useRoster, usePvpUnlocked } from '@/lib/hooks';
import { CHARACTERS, RARITY_META, Character } from '@/lib/characters';
import { pushToast } from '@/lib/ui';

export default function BattleSetup() {
  const roster = useRoster();
  const pvpUnlocked = usePvpUnlocked();
  const owned = CHARACTERS.filter((c) => roster.includes(c.id));
  const [selected, setSelected] = useState<Character | null>(owned[0] || null);
  const [enemy, setEnemy] = useState<Character>(CHARACTERS.find((c) => !roster.includes(c.id)) || CHARACTERS[6]);
  const power = (c: Character) => c.atk + c.def + c.speed + c.hp / 10;
  const winChance = selected ? Math.min(95, Math.max(5, Math.round((power(selected) / (power(selected) + power(enemy))) * 100))) : 0;

  return (
    <div className="min-h-screen bg-domain">
      <div className="sticky top-0 z-40 glass-strong border-b border-blood-500/20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3"><Link href="/" className="text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></Link><Swords className="w-5 h-5 text-blood-400" /><div className="font-display font-bold text-white">Clash Arena</div></div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {!pvpUnlocked && (
          <section className="glass rounded-2xl p-4 border border-blood-500/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blood-500/15 flex items-center justify-center"><Lock className="w-5 h-5 text-blood-400" /></div>
            <div className="flex-1"><div className="font-display font-bold text-white text-sm">PvP Arena Locked</div><div className="text-xs text-zinc-500">Stake 200+ 🧬 DNA in the Hardware Vault and lock it for 7+ days to unlock PvP battles.</div></div>
            <Link href="/wallet" className="px-4 py-2 rounded-xl bg-gradient-to-r from-curse-500 to-curse-700 text-white font-bold text-sm shrink-0">Go to Vault</Link>
          </section>
        )}
        <section className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <div className="glass rounded-2xl p-4 text-center border border-jade-500/30">
            <div className="text-[10px] text-jade-400 uppercase tracking-wider mb-2">Your Fighter</div>
            {selected ? (<><img src={selected.image} alt={selected.name} className="w-24 h-24 rounded-xl object-cover mx-auto border border-jade-500/40" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} /><div className="font-display font-bold text-white mt-2">{selected.name}</div><div className="text-xs text-zinc-500">{selected.title}</div><div className="flex justify-center gap-3 mt-2 text-xs font-mono"><span className="text-blood-400">ATK {selected.atk}</span><span className="text-jade-400">DEF {selected.def}</span><span className="text-energy-400">SPD {selected.speed}</span></div></>) : <div className="text-zinc-600 text-sm">Select a fighter</div>}
          </div>
          <div className="text-center"><div className="font-display font-black text-3xl text-blood-400 text-glow animate-pulse-glow">VS</div>{selected && <div className="mt-2 text-xs text-zinc-500">Win Chance<br /><span className="font-mono font-bold text-white text-lg">{winChance}%</span></div>}</div>
          <div className="glass rounded-2xl p-4 text-center border border-blood-500/30">
            <div className="text-[10px] text-blood-400 uppercase tracking-wider mb-2">Opponent</div>
            <img src={enemy.image} alt={enemy.name} className="w-24 h-24 rounded-xl object-cover mx-auto border border-blood-500/40" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
            <div className="font-display font-bold text-white mt-2">{enemy.name}</div><div className="text-xs text-zinc-500">{enemy.title}</div><div className="flex justify-center gap-3 mt-2 text-xs font-mono"><span className="text-blood-400">ATK {enemy.atk}</span><span className="text-jade-400">DEF {enemy.def}</span><span className="text-energy-400">SPD {enemy.speed}</span></div>
          </div>
        </section>
        <section>
          <h3 className="font-display font-bold text-white mb-3">Select Your Fighter</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {owned.length === 0 && <div className="col-span-full text-zinc-500 text-sm">No characters. Summon some first!</div>}
            {owned.map((c) => { const meta = RARITY_META[c.rarity]; const active = selected?.id === c.id; return (<button key={c.id} onClick={() => setSelected(c)} className={`relative rounded-xl overflow-hidden border transition-all ${active ? 'border-jade-500/60 shadow-[0_0_16px_rgba(74,222,128,0.4)]' : 'border-ink-700'}`}><img src={c.image} alt={c.name} className="w-full aspect-square object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} /><div className="p-1.5"><div className="text-[11px] font-semibold text-white truncate">{c.name}</div><div className={`text-[9px] font-mono font-bold ${meta.color}`}>{meta.label}</div></div></button>); })}
          </div>
        </section>
        <section>
          <h3 className="font-display font-bold text-white mb-3">Choose Opponent</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {CHARACTERS.filter((c) => c.id !== selected?.id).map((c) => { const meta = RARITY_META[c.rarity]; const active = enemy.id === c.id; return (<button key={c.id} onClick={() => setEnemy(c)} className={`relative rounded-xl overflow-hidden border transition-all ${active ? 'border-blood-500/60 shadow-[0_0_16px_rgba(239,68,68,0.4)]' : 'border-ink-700'}`}><img src={c.image} alt={c.name} className="w-full aspect-square object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} /><div className="p-1.5"><div className="text-[11px] font-semibold text-white truncate">{c.name}</div><div className={`text-[9px] font-mono font-bold ${meta.color}`}>{meta.label}</div></div></button>); })}
          </div>
        </section>
        <section className="sticky bottom-4">
          {pvpUnlocked ? (
            <Link href={`/battle/arena?you=${selected?.id || ''}&enemy=${enemy.id}`} onClick={(e) => { if (!selected) { e.preventDefault(); pushToast('Select your fighter!', 'error'); } }} className="block w-full max-w-xs mx-auto py-3.5 rounded-2xl bg-gradient-to-r from-blood-500 to-blood-600 text-white font-bold text-center shadow-[0_0_24px_rgba(239,68,68,0.45)] hover:shadow-[0_0_36px_rgba(239,68,68,0.6)] transition-shadow"><Swords className="w-5 h-5 inline mr-2" /> Enter Arena</Link>
          ) : (
            <div className="block w-full max-w-xs mx-auto py-3.5 rounded-2xl bg-ink-800 text-zinc-600 font-bold text-center border border-ink-700"><Lock className="w-5 h-5 inline mr-2" /> Unlock PvP in Vault</div>
          )}
        </section>
      </div>
    </div>
  );
}
