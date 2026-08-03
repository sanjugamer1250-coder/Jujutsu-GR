import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Swords, Shield, Skull, Ghost, Sparkles } from 'lucide-react';
import { ROSTER, RosterCharacter, RosterCategory, CATEGORY_LABELS, RARITY_COLORS } from '@/data/characters';

type Tab = 'all' | RosterCategory;

const TABS: { id: Tab; label: string; icon: typeof Swords }[] = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'Sorcerer', label: 'Sorcerers', icon: Swords },
  { id: 'Curse', label: 'Curses', icon: Skull },
  { id: 'Curse User', label: 'Curse Users', icon: Ghost },
  { id: 'Shikigami', label: 'Shikigami', icon: Shield },
];

export function RosterViewer() {
  const [tab, setTab] = useState<Tab>('all');
  const [selected, setSelected] = useState<RosterCharacter | null>(null);

  const filtered = tab === 'all' ? ROSTER : ROSTER.filter((c) => c.category === tab);

  return (
    <div className="space-y-5">
      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                tab === t.id
                  ? 'bg-gradient-to-r from-curse-500/20 to-blood-500/20 text-curse-200 border border-curse-500/40 shadow-curse-glow'
                  : 'bg-ink-800 text-zinc-500 border border-ink-700 hover:text-zinc-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Character grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((char, i) => (
          <motion.button
            key={char.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelected(char)}
            className="group relative overflow-hidden rounded-2xl border border-ink-700 hover:border-curse-500/50 transition-all text-left slash-hover-effect"
          >
            {/* Character image */}
            <div className="aspect-[2/3] relative overflow-hidden bg-ink-900">
              <img
                src={char.image}
                alt={char.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-ink-800 to-ink-950"><span class="font-display font-black text-4xl text-white/15">${char.name.charAt(0)}</span></div>`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
              {/* Rarity badge */}
              <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-md bg-ink-950/80 backdrop-blur-sm text-[9px] font-bold ${RARITY_COLORS[char.rarity]}`}>
                {char.rarity === 'Special' ? 'SPECIAL' : char.rarity.replace('Grade', 'G')}
              </div>
              {/* Category badge */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-ink-950/80 backdrop-blur-sm text-[8px] font-bold text-zinc-400 uppercase tracking-wider">
                {char.category}
              </div>
            </div>
            {/* Info */}
            <div className="p-3 bg-ink-900/80">
              <div className="text-xs font-bold text-white truncate">{char.name}</div>
              <div className="text-[10px] text-zinc-500 truncate">{char.title}</div>
              {char.domain && (
                <div className="mt-1.5 flex items-center gap-1 text-[9px] text-curse-300">
                  <Sparkles className="w-2.5 h-2.5" /> {char.domain}
                </div>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Character inspector modal */}
      <AnimatePresence>
        {selected && <InspectorModal char={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

function InspectorModal({ char, onClose }: { char: RosterCharacter; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-2xl w-full glass-strong rounded-3xl border border-curse-500/40 overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header with image */}
        <div className="relative h-48 sm:h-64 overflow-hidden">
          <img
            src={char.image}
            alt={char.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-ink-800 to-ink-950"><span class="font-display font-black text-7xl text-white/10">${char.name.charAt(0)}</span></div>`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-ink-950/80 backdrop-blur-sm flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-4">
            <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${RARITY_COLORS[char.rarity]}`}>
              {char.rarity === 'Special' ? 'SPECIAL GRADE' : `GRADE ${char.rarity.replace('Grade', '')}`}
            </div>
            <h2 className="font-display font-black text-2xl text-white text-glow">{char.name}</h2>
            <p className="text-sm text-zinc-400">{char.title}</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-curse-500/10 border border-curse-500/30 text-curse-300 text-[10px] font-bold uppercase">
              {char.category}
            </span>
            {char.domain && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-bold">
                DOMAIN: {char.domain}
              </span>
            )}
            {char.skill && (
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                SKILL: {char.skill}
              </span>
            )}
          </div>

          {/* Stat bars */}
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Base Stats</div>
            <div className="grid grid-cols-2 gap-3">
              <StatBar label="HP" value={char.hp} max={1500} color="from-rose-500 to-rose-700" />
              <StatBar label="Attack" value={char.attack} max={135} color="from-orange-500 to-red-600" />
              <StatBar label="Cursed Energy" value={char.cursedEnergy} max={250} color="from-curse-500 to-curse-700" />
              <StatBar label="Speed" value={char.speed} max={99} color="from-cyan-500 to-blue-600" />
            </div>
          </div>

          {/* Sukuna's commentary */}
          <div className="relative rounded-2xl bg-gradient-to-br from-blood-900/40 to-ink-900 border border-blood-500/30 p-4">
            <div className="absolute -top-2 left-3 px-2 py-0.5 rounded-md bg-blood-700 text-[8px] font-bold text-blood-200 uppercase tracking-widest">
              Sukuna's Verdict
            </div>
            <div className="flex items-start gap-3 mt-1">
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-blood-500/50 shrink-0">
                <img src="https://images.alphacoders.com/131/1316277.png" alt="Sukuna" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed italic">"{char.sukunaCommentary}"</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
        <span>{label}</span>
        <span className="font-mono font-bold text-zinc-300">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-ink-700 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
    </div>
  );
}
