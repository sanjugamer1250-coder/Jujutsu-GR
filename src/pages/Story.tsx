import { useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronLeft, Lock, Check, Coins, Star, Play, X } from 'lucide-react';
import { useRoster, useStorageSync } from '@/lib/hooks';
import { addDna, readJSON, writeJSON, STORAGE_KEYS } from '@/lib/economy';
import { getCharacter, RARITY_META, Rarity } from '@/lib/characters';
import { pushToast } from '@/lib/ui';

interface Chapter { id: string; title: string; arc: string; desc: string; reward: number; energyCost: number; reqRoster: string[]; difficulty: Rarity; }

const CHAPTERS: Chapter[] = [
  { id: 'ch1', title: 'Sugisawa Third High', arc: 'Awakening', desc: 'Investigate the cursed object at Sugisawa Third High. Your first exorcism.', reward: 150, energyCost: 10, reqRoster: ['yuji'], difficulty: 'Grade4' },
  { id: 'ch2', title: 'Detention Center', arc: 'Cursed Womb', desc: 'Exorcise the womb curse at the abandoned detention center.', reward: 300, energyCost: 15, reqRoster: ['yuji'], difficulty: 'Grade4' },
  { id: 'ch3', title: 'Vs. Curse User Mahito', arc: 'First Encounter', desc: 'Face the curse that reshapes souls. Yuji stands alone.', reward: 600, energyCost: 18, reqRoster: ['yuji', 'nobara'], difficulty: 'Grade3' },
  { id: 'ch4', title: 'Goodwill Event Clash', arc: 'Kyoto Goodwill', desc: 'Sorcerers from Kyoto and Tokyo clash in a friendly brawl turned deadly.', reward: 1000, energyCost: 22, reqRoster: ['megumi', 'nobara', 'todo', 'maki'], difficulty: 'Grade3' },
  { id: 'ch5', title: 'Origin of Obedience', arc: 'Death Painting', desc: 'Uncover the cursed wombs lineage and the death paintings.', reward: 1500, energyCost: 25, reqRoster: ['yuji', 'nobara', 'megumi'], difficulty: 'Grade2' },
  { id: 'ch6', title: 'Shibuya Incident', arc: 'Shibuya', desc: 'October 31. The seals break. Gojo is sealed. Chaos erupts in Shibuya.', reward: 2500, energyCost: 30, reqRoster: ['megumi', 'nanami', 'todo', 'maki'], difficulty: 'Grade1' },
  { id: 'ch7', title: 'Fluctuations & Right and Wrong', arc: 'Shibuya', desc: 'Toji returns. Sukuna runs free. Yuji vs Mahito — the line between human and curse blurs.', reward: 3500, energyCost: 35, reqRoster: ['toji', 'sukuna', 'yuji', 'nanami'], difficulty: 'Grade1' },
  { id: 'ch8', title: 'Metamorphosis', arc: 'Culling Game Prelude', desc: 'The aftermath. New powers awaken. The Culling Game approaches. Maximum reward.', reward: 5000, energyCost: 40, reqRoster: ['gojo', 'sukuna', 'megumi', 'yuji'], difficulty: 'Special' },
];

export default function Story() {
  const roster = useRoster();
  const [active, setActive] = useState<Chapter | null>(null);
  useStorageSync();
  const cleared = readJSON<string[]>(STORAGE_KEYS.storyProgress, []);
  const canPlay = (ch: Chapter) => roster.some((id) => ch.reqRoster.includes(id));
  const isCleared = (id: string) => cleared.includes(id);

  return (
    <div className="min-h-screen bg-domain">
      <div className="sticky top-0 z-40 glass-strong border-b border-curse-500/20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></Link>
          <BookOpen className="w-5 h-5 text-curse-300" />
          <div className="font-display font-bold text-white">Story Domains</div>
          <div className="ml-auto text-xs text-zinc-500">{cleared.length}/{CHAPTERS.length} cleared</div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-5 space-y-3">
        {CHAPTERS.map((ch, i) => {
          const playable = canPlay(ch);
          const done = isCleared(ch.id);
          const prevCleared = i === 0 || isCleared(CHAPTERS[i - 1].id);
          const locked = !playable || (!prevCleared && !done);
          return (
            <motion.div key={ch.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} onClick={() => !locked && setActive(ch)} className={`relative rounded-2xl p-4 border transition-all ${locked ? 'border-ink-700 bg-ink-850/50 cursor-not-allowed' : 'border-curse-500/30 glass cursor-pointer hover:border-curse-400/50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-black text-lg shrink-0 ${done ? 'bg-jade-500/20 text-jade-400' : locked ? 'bg-ink-700 text-zinc-600' : 'bg-curse-500/20 text-curse-300'}`}>{done ? <Check className="w-6 h-6" /> : locked ? <Lock className="w-5 h-5" /> : i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${RARITY_META[ch.difficulty].color} bg-black/40`}>{ch.difficulty}</span><span className="text-[10px] text-zinc-500 uppercase tracking-wider">{ch.arc}</span></div>
                  <h3 className={`font-display font-bold text-sm sm:text-base ${locked ? 'text-zinc-600' : 'text-white'}`}>{ch.title}</h3>
                  <p className="text-[11px] text-zinc-500 truncate">{ch.desc}</p>
                </div>
                <div className="text-right shrink-0"><div className="flex items-center gap-1 text-gold-400 text-xs font-mono"><Coins className="w-3 h-3" />{ch.reward}</div><div className="text-[10px] text-zinc-600 mt-0.5">{ch.energyCost} CE</div></div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <AnimatePresence>{active && <ChapterBattle chapter={active} onClose={() => setActive(null)} />}</AnimatePresence>
    </div>
  );
}

function ChapterBattle({ chapter, onClose }: { chapter: Chapter; onClose: () => void }) {
  const [phase, setPhase] = useState<'intro' | 'fight' | 'reward'>('intro');
  const [hp, setHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [log, setLog] = useState<string[]>([]);
  const roster = useRoster();
  const leader = chapter.reqRoster.find((id) => roster.includes(id))!;
  const char = getCharacter(leader)!;

  const start = () => {
    setPhase('fight');
    setLog([`Domain: ${chapter.title} — ${char.name} engages the curse.`]);
    let h = 100, e = 100;
    const interval = setInterval(() => {
      const dmgToEnemy = Math.round(Math.random() * 18 + char.atk / 8);
      const dmgToYou = Math.round(Math.random() * 14 + 8);
      e -= dmgToEnemy; h -= dmgToYou;
      setEnemyHp(Math.max(0, e)); setHp(Math.max(0, h));
      setLog((l) => [`${char.name} hits for ${dmgToEnemy} | Curse hits for ${dmgToYou}`, ...l].slice(0, 5));
      if (e <= 0 || h <= 0) {
        clearInterval(interval);
        const win = e <= 0 && h > 0;
        if (win) {
          addDna(chapter.reward);
          const cleared = readJSON<string[]>(STORAGE_KEYS.storyProgress, []);
          if (!cleared.includes(chapter.id)) writeJSON(STORAGE_KEYS.storyProgress, [...cleared, chapter.id]);
          pushToast(`Cleared! +${chapter.reward} 🧬 DNA`, 'success');
        } else { pushToast('Defeated. Try again.', 'error'); }
        setTimeout(() => setPhase('reward'), 600);
      }
    }, 700);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="max-w-md w-full glass-strong rounded-3xl border border-curse-500/40 p-5">
        <div className="flex items-center justify-between mb-4">
          <div><div className="text-[10px] text-curse-300/70 uppercase tracking-wider">{chapter.arc}</div><h2 className="font-display font-bold text-lg text-white">{chapter.title}</h2></div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        {phase === 'intro' && (
          <>
            <div className="flex items-center gap-3 mb-4"><img src={char.image} alt={char.name} className="w-16 h-16 rounded-xl object-cover border border-curse-500/30" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} /><div><div className="text-sm text-white font-semibold">{char.name}</div><div className="text-xs text-zinc-500">{char.domain}</div><div className="text-xs text-curse-300 mt-1">Skill: {char.skill.name}</div></div></div>
            <p className="text-sm text-zinc-400">{chapter.desc}</p>
            <div className="flex items-center justify-between mt-4 text-sm"><span className="text-zinc-500">Reward: <span className="text-gold-400 font-mono">{chapter.reward} 🧬 DNA</span></span><span className="text-zinc-500">Cost: <span className="text-energy-400 font-mono">{chapter.energyCost} CE</span></span></div>
            <button onClick={start} className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-curse-500 to-curse-700 text-white font-bold text-sm shadow-curse-glow flex items-center justify-center gap-2"><Play className="w-4 h-4" /> Begin Domain</button>
          </>
        )}
        {phase === 'fight' && (
          <div className="space-y-3">
            <div><div className="flex justify-between text-xs mb-1"><span className="text-jade-400">{char.name}</span><span className="font-mono">{hp}%</span></div><div className="h-2 rounded-full bg-ink-700 overflow-hidden"><motion.div className="h-full bg-jade-500" animate={{ width: `${hp}%` }} /></div></div>
            <div><div className="flex justify-between text-xs mb-1"><span className="text-blood-400">Curse</span><span className="font-mono">{enemyHp}%</span></div><div className="h-2 rounded-full bg-ink-700 overflow-hidden"><motion.div className="h-full bg-blood-500" animate={{ width: `${enemyHp}%` }} /></div></div>
            <div className="rounded-xl bg-ink-800 p-3 space-y-1 min-h-[80px]">{log.map((l, i) => <div key={i} className="text-xs text-zinc-400">{l}</div>)}</div>
          </div>
        )}
        {phase === 'reward' && (
          <div className="text-center py-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-16 h-16 rounded-full bg-gold-500/20 flex items-center justify-center mx-auto mb-3"><Star className="w-8 h-8 text-gold-400" /></motion.div>
            <div className="font-display font-bold text-white">Chapter Cleared!</div>
            <div className="text-gold-400 font-mono mt-1">+{chapter.reward} 🧬 DNA</div>
            <button onClick={onClose} className="w-full mt-5 py-3 rounded-xl glass border border-curse-500/30 text-white font-semibold text-sm">Continue</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
