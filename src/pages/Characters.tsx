import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Coins, Sparkles, X, Star, Lock, Share2 } from 'lucide-react';
import { useDnaBalance, useRoster } from '@/lib/hooks';
import { CHARACTERS, RARITY_META, GACHA_COST, rollGachaWithPity, Character } from '@/lib/characters';
import { spendDna, unlockChar, getReferralCode } from '@/lib/economy';
import { fmt, pushToast } from '@/lib/ui';

export default function Characters() {
  const dna = useDnaBalance();
  const roster = useRoster();
  const [pulling, setPulling] = useState(false);
  const [result, setResult] = useState<Character | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [pity, setPity] = useState(0);
  const [multi, setMulti] = useState<1 | 10>(1);
  const [showAll, setShowAll] = useState(false);
  const canPull = dna >= GACHA_COST * multi;

  const doPull = () => {
    const cost = GACHA_COST * multi;
    if (!spendDna(cost)) { pushToast('Not enough 🧬 DNA.', 'error'); return; }
    setPulling(true); setResult(null);
    let newPity = pity; let pulled: Character; let wasNew = false;
    if (multi === 10) {
      let best: Character | null = null;
      for (let i = 0; i < 10; i++) {
        const { char, newPity: np } = rollGachaWithPity(newPity);
        newPity = np;
        const fresh = !roster.includes(char.id);
        unlockChar(char.id);
        if (!best || RARITY_META[char.rarity].mult > RARITY_META[best.rarity].mult) { best = char; wasNew = fresh; }
      }
      setPity(newPity); pulled = best!; setIsNew(wasNew);
    } else {
      const { char, newPity: np } = rollGachaWithPity(newPity);
      newPity = np; pulled = char;
      const fresh = !roster.includes(char.id);
      unlockChar(char.id); setPity(newPity); setIsNew(fresh);
    }
    setTimeout(() => { setResult(pulled); setPulling(false); pushToast(`${pulled.name} summoned!`, 'success'); }, 1600);
  };

  const shareToTelegram = (char: Character) => {
    const code = getReferralCode();
    const link = `${window.location.origin}/referrals?ref=${code}`;
    const rarityLabel = RARITY_META[char.rarity].label;
    const text = `I just pulled [${rarityLabel}] ${char.name} in Jujutsu Clash Arena! Think you can beat me? Enter the Domain \u21A1\uFE0F ${link}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`, '_blank');
    pushToast('Shared to Telegram!', 'success');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <section className="relative overflow-hidden rounded-3xl border-gradient p-6">
        <div className="absolute -top-16 right-0 w-48 h-48 rounded-full bg-curse-500/25 blur-3xl animate-pulse-glow" />
        <div className="relative">
          <div className="flex items-center gap-2 text-curse-300/80 text-xs tracking-[0.3em] uppercase mb-2"><Sparkles className="w-3.5 h-3.5" /> Domain Expansion Summon</div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white text-glow">Summon Sorcerers</h1>
          <p className="text-zinc-400 text-sm mt-2">Spend 🧬 DNA to pull JJK characters. Pity guarantees A-rank+ at 10 pulls.</p>
        </div>
      </section>

      <section className="glass rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-curse-500 to-curse-700 flex items-center justify-center shadow-curse-glow animate-float"><Zap className="w-7 h-7 text-white" /></div>
            <div><div className="font-display font-bold text-lg text-white">Cursed Summon</div><div className="text-xs text-zinc-500 flex items-center gap-1"><Coins className="w-3 h-3 text-gold-400" /> {GACHA_COST} 🧬 DNA per pull</div></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 p-1 rounded-xl bg-ink-800">
              <button onClick={() => setMulti(1)} className={`px-3 py-1.5 rounded-lg text-sm font-bold ${multi === 1 ? 'bg-curse-500/20 text-curse-300' : 'text-zinc-500'}`}>x1</button>
              <button onClick={() => setMulti(10)} className={`px-3 py-1.5 rounded-lg text-sm font-bold ${multi === 10 ? 'bg-curse-500/20 text-curse-300' : 'text-zinc-500'}`}>x10</button>
            </div>
            <button onClick={doPull} disabled={!canPull || pulling} className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${canPull && !pulling ? 'bg-gradient-to-r from-curse-500 to-curse-700 text-white shadow-curse-glow hover:shadow-curse-glow-lg' : 'bg-ink-700 text-zinc-600'}`}>{pulling ? 'Expanding Domain...' : `Summon ${multi === 10 ? 'x10' : ''} (${fmt(GACHA_COST * multi)} 🧬 DNA)`}</button>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-[11px] text-zinc-500 mb-1"><span>Pity (A-rank+ guaranteed at 10)</span><span className="font-mono">{pity}/10</span></div>
          <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-curse-500 to-energy-500 transition-all" style={{ width: `${(pity / 10) * 100}%` }} /></div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lg text-white">Sorcerer Collection</h2>
          <button onClick={() => setShowAll(!showAll)} className="text-xs text-curse-300 hover:text-curse-200">{showAll ? 'Show owned' : 'Show all'}</button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {(showAll ? CHARACTERS : CHARACTERS.filter((c) => roster.includes(c.id))).map((c) => {
            const has = roster.includes(c.id);
            const meta = RARITY_META[c.rarity];
            return (
              <div key={c.id} className={`relative rounded-xl overflow-hidden border ${has ? 'border-curse-500/30' : 'border-ink-700'} ${meta.glow}`}>
                <div className="aspect-square bg-ink-800 relative">
                  <img src={c.image} alt={c.name} className={`w-full h-full object-cover ${has ? '' : 'grayscale opacity-25'}`} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                  {!has && <div className="absolute inset-0 flex items-center justify-center"><Lock className="w-5 h-5 text-zinc-600" /></div>}
                  <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold font-mono ${meta.color}`}>{meta.label}</div>
                </div>
                <div className="p-1.5"><div className={`text-[11px] font-semibold truncate ${has ? 'text-white' : 'text-zinc-600'}`}>{c.name}</div></div>
              </div>
            );
          })}
        </div>
      </section>

      <AnimatePresence>
        {pulling && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="relative">
              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} className="w-72 h-72 rounded-full border-4 border-curse-400/60 shadow-[0_0_80px_rgba(124,65,255,0.6)]" />
              <motion.div initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }} className="absolute inset-0 flex items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-56 h-56 rounded-full border-2 border-dashed border-energy-400/40" /></motion.div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="font-display font-black text-2xl text-curse-200 text-glow tracking-widest">DOMAIN EXPANSION</motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-xs text-energy-300/80 mt-2 tracking-[0.3em] uppercase">Summoning...</motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && !pulling && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setResult(null)} className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.7, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.7, opacity: 0 }} transition={{ type: 'spring', damping: 18 }} onClick={(e) => e.stopPropagation()} className={`relative max-w-xs w-full glass-strong rounded-3xl overflow-hidden border-2 border-curse-500/40 ${RARITY_META[result.rarity].glow}`}>
              <button onClick={() => setResult(null)} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
              <div className="aspect-[3/4] bg-ink-800 relative">
                <img src={result.image} alt={result.name} className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                {isNew && <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-gold-500 text-black text-[10px] font-bold flex items-center gap-1 animate-pulse-glow"><Star className="w-3 h-3" /> NEW</div>}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1"><span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${RARITY_META[result.rarity].color} bg-black/40`}>{RARITY_META[result.rarity].label}</span><span className="text-[10px] text-zinc-500 uppercase tracking-wider">{result.element}</span></div>
                <h3 className="font-display font-bold text-xl text-white">{result.name}</h3>
                <p className="text-xs text-zinc-400">{result.title}</p>
                <div className="mt-3 p-2.5 rounded-xl bg-ink-800 border border-curse-500/20"><div className="text-[10px] text-curse-300 uppercase tracking-wider">{result.domain}</div><div className="text-sm text-white font-semibold mt-0.5">{result.skill.name}</div><div className="text-[11px] text-zinc-500 mt-0.5">{result.skill.desc}</div></div>
                <div className="grid grid-cols-4 gap-2 mt-3 text-center"><Stat label="HP" value={result.hp} /><Stat label="ATK" value={result.atk} /><Stat label="DEF" value={result.def} /><Stat label="SPD" value={result.speed} /></div>
                {(result.rarity === 'Special' || result.rarity === 'Grade1') && (
                  <button onClick={() => shareToTelegram(result)} className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-curse-500 to-energy-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-curse-glow hover:shadow-curse-glow-lg transition-shadow animate-pulse-glow"><Share2 className="w-4 h-4" /> Share to Telegram</button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-ink-800 py-1.5"><div className="text-[9px] text-zinc-600 uppercase">{label}</div><div className="font-mono text-sm text-white">{value}</div></div>;
}
