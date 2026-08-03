import { useEffect, useRef, useState } from 'react';
import { Link, useSearch } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, ChevronLeft, Zap, Trophy, Skull, RotateCcw } from 'lucide-react';
import { getCharacter, Character } from '@/lib/characters';
import { addDna, readJSON, writeJSON, STORAGE_KEYS } from '@/lib/economy';
import { pushToast } from '@/lib/ui';

interface LogEntry { text: string; side: 'you' | 'enemy' | 'sys' }

export default function BattleArena() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const youId = params.get('you') || 'yuji';
  const enemyId = params.get('enemy') || 'sukuna';
  const you = getCharacter(youId);
  const enemy = getCharacter(enemyId);

  const [youHp, setYouHp] = useState(you?.hp ?? 100);
  const [enemyHp, setEnemyHp] = useState(enemy?.hp ?? 100);
  const [turn, setTurn] = useState<'you' | 'enemy'>('you');
  const [phase, setPhase] = useState<'fight' | 'win' | 'loss'>('fight');
  const [log, setLog] = useState<LogEntry[]>([{ text: `${you?.name} vs ${enemy?.name} — FIGHT!`, side: 'sys' }]);
  const [domain, setDomain] = useState(false);
  const [hitFx, setHitFx] = useState<'you' | 'enemy' | null>(null);
  const loggedRef = useRef(false);

  useEffect(() => {
    if (phase !== 'fight' || loggedRef.current) return;
    if (youHp <= 0 || enemyHp <= 0) {
      loggedRef.current = true;
      const won = enemyHp <= 0 && youHp > 0;
      setPhase(won ? 'win' : 'loss');
      if (won) {
        const reward = Math.round((enemy?.hp ?? 100) / 4 + 50);
        addDna(reward);
        const history = readJSON<{ result: 'win' | 'loss' }[]>(STORAGE_KEYS.battleHistory, []);
        writeJSON(STORAGE_KEYS.battleHistory, [...history, { result: 'win' }]);
        pushToast(`Victory! +${reward} 🧬 DNA`, 'success');
      } else {
        const history = readJSON<{ result: 'win' | 'loss' }[]>(STORAGE_KEYS.battleHistory, []);
        writeJSON(STORAGE_KEYS.battleHistory, [...history, { result: 'loss' }]);
        pushToast('Defeated...', 'error');
      }
    }
  }, [youHp, enemyHp, phase]);

  const attack = (skill: boolean) => {
    if (phase !== 'fight' || turn !== 'you') return;
    const baseDmg = skill ? (you?.skill.power ?? 50) : (you?.atk ?? 30);
    const dmg = Math.max(5, baseDmg - Math.round((enemy?.def ?? 20) * 0.4) + Math.round(Math.random() * 20));
    setHitFx('enemy'); setTimeout(() => setHitFx(null), 300);
    setEnemyHp((h) => Math.max(0, h - dmg));
    setLog((l) => [{ text: `${you?.name} ${skill ? 'uses ' + you?.skill.name : 'strikes'} — ${dmg} dmg`, side: 'you' as const }, ...l].slice(0, 6));
    setTurn('enemy');
  };

  useEffect(() => {
    if (turn !== 'enemy' || phase !== 'fight') return;
    const t = setTimeout(() => {
      const dmg = Math.max(3, (enemy?.atk ?? 30) - Math.round((you?.def ?? 20) * 0.4) + Math.round(Math.random() * 18));
      setHitFx('you'); setTimeout(() => setHitFx(null), 300);
      setYouHp((h) => Math.max(0, h - dmg));
      setLog((l) => [{ text: `${enemy?.name} strikes — ${dmg} dmg`, side: 'enemy' as const }, ...l].slice(0, 6));
      setTurn('you');
    }, 900);
    return () => clearTimeout(t);
  }, [turn, phase]);

  if (!you || !enemy) return <div className="p-6 text-center text-zinc-500">Invalid battle.</div>;

  return (
    <div className="min-h-screen bg-domain relative overflow-hidden">
      {domain && (<motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-0 pointer-events-none"><div className="absolute inset-0 bg-gradient-radial from-curse-500/30 via-transparent to-transparent" /><motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 m-auto w-96 h-96 rounded-full border-2 border-dashed border-curse-400/30" /></motion.div>)}
      <div className="sticky top-0 z-30 glass-strong border-b border-blood-500/20"><div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3"><Link href="/battle" className="text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></Link><Swords className="w-5 h-5 text-blood-400" /><div className="font-display font-bold text-white">Arena</div></div></div>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5 relative z-10">
        <div className="grid grid-cols-2 gap-4"><FighterCard c={you} hp={youHp} maxHp={you.hp} side="you" hit={hitFx === 'you'} /><FighterCard c={enemy} hp={enemyHp} maxHp={enemy.hp} side="enemy" hit={hitFx === 'enemy'} /></div>
        <div className="space-y-2"><HpBar label={you.name} hp={youHp} max={you.hp} color="bg-jade-500" /><HpBar label={enemy.name} hp={enemyHp} max={enemy.hp} color="bg-blood-500" /></div>
        <div className="glass rounded-2xl p-3 min-h-[100px]"><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Battle Log</div><div className="space-y-1"><AnimatePresence>{log.map((l, i) => (<motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={`text-xs ${l.side === 'you' ? 'text-jade-400' : l.side === 'enemy' ? 'text-blood-400' : 'text-zinc-400'}`}>{l.text}</motion.div>))}</AnimatePresence></div></div>
        {phase === 'fight' && (<div className="grid grid-cols-3 gap-3"><button onClick={() => attack(false)} disabled={turn !== 'you'} className={`py-3 rounded-xl font-bold text-sm ${turn === 'you' ? 'bg-gradient-to-r from-blood-500 to-blood-600 text-white shadow-[0_0_16px_rgba(239,68,68,0.3)]' : 'bg-ink-800 text-zinc-600'}`}><Swords className="w-4 h-4 inline mr-1" /> Attack</button><button onClick={() => { setDomain(true); setTimeout(() => setDomain(false), 2000); attack(true); }} disabled={turn !== 'you'} className={`py-3 rounded-xl font-bold text-sm ${turn === 'you' ? 'bg-gradient-to-r from-curse-500 to-curse-700 text-white shadow-curse-glow' : 'bg-ink-800 text-zinc-600'}`}><Zap className="w-4 h-4 inline mr-1" /> Domain</button><Link href="/battle" className="py-3 rounded-xl font-bold text-sm glass border border-ink-700 text-zinc-400 text-center flex items-center justify-center gap-1"><RotateCcw className="w-4 h-4" /> Flee</Link></div>)}
        <AnimatePresence>
          {phase === 'win' && (<motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"><div className="text-center"><motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-20 h-20 rounded-full bg-gold-500/20 flex items-center justify-center mx-auto mb-4 shadow-gold-glow"><Trophy className="w-10 h-10 text-gold-400" /></motion.div><h2 className="font-display font-black text-3xl text-gold-400 text-glow-gold">VICTORY</h2><p className="text-zinc-400 mt-2">You earned 🧬 DNA for your triumph.</p><Link href="/battle" className="inline-block mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-black font-bold text-sm">Fight Again</Link></div></motion.div>)}
          {phase === 'loss' && (<motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"><div className="text-center"><motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-20 h-20 rounded-full bg-blood-500/20 flex items-center justify-center mx-auto mb-4"><Skull className="w-10 h-10 text-blood-400" /></motion.div><h2 className="font-display font-black text-3xl text-blood-400">DEFEATED</h2><p className="text-zinc-400 mt-2">Train harder, sorcerer.</p><Link href="/battle" className="inline-block mt-6 px-6 py-3 rounded-xl glass border border-blood-500/30 text-white font-bold text-sm">Try Again</Link></div></motion.div>)}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FighterCard({ c, hp, maxHp, side, hit }: { c: Character; hp: number; maxHp: number; side: 'you' | 'enemy'; hit: boolean }) {
  return (<motion.div animate={hit ? { x: side === 'you' ? [-8, 8, -4, 0] : [8, -8, 4, 0] } : { x: 0 }} transition={{ duration: 0.3 }} className={`relative rounded-2xl overflow-hidden border ${side === 'you' ? 'border-jade-500/40' : 'border-blood-500/40'} ${hit ? 'shadow-[0_0_24px_rgba(239,68,68,0.5)]' : ''}`}><img src={c.image} alt={c.name} className={`w-full aspect-[4/5] object-cover ${hit ? 'brightness-150 contrast-150' : ''} transition-all`} onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} /><div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" /><div className="absolute bottom-2 left-2 right-2"><div className="font-display font-bold text-white text-sm">{c.name}</div><div className="text-[10px] text-zinc-400">{c.domain}</div></div>{hit && <div className="absolute inset-0 bg-blood-500/30 animate-pulse" />}</motion.div>);
}
function HpBar({ label, hp, max, color }: { label: string; hp: number; max: number; color: string }) {
  const pct = (hp / max) * 100;
  return (<div><div className="flex justify-between text-xs mb-1"><span className="text-zinc-400">{label}</span><span className="font-mono text-white">{Math.round(hp)}/{max}</span></div><div className="h-2.5 rounded-full bg-ink-700 overflow-hidden"><motion.div className={`h-full rounded-full ${color}`} animate={{ width: `${pct}%` }} transition={{ duration: 0.3 }} /></div></div>);
}
