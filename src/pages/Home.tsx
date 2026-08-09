import React from 'react';
import { Link } from 'wouter';
import { Zap } from 'lucide-react';
import { useRoster } from '@/lib/hooks';
import Character from '@/components/Character';
import { RARITY_META, getCharacter, Character as CharType } from '@/lib/characters';

function auraFor(c: CharType) {
  if (c.upcoming) return 'none';
  switch (c.element) {
    case 'Limitless': return 'cyan';
    case 'Shadows': return 'purple';
    case 'Cursed': return 'red';
    case 'Fire': return 'red';
    case 'Reverse': return 'gold';
    case 'Taijutsu': return 'blue';
    default: return 'purple';
  }
}

export default function Home() {
  const roster = useRoster();
  const owned = roster || [];
  const top = owned.slice(0, 3).map((id) => getCharacter(id)).filter(Boolean) as CharType[];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <section className="relative overflow-hidden rounded-3xl border-gradient p-6">
        <div className="absolute -top-16 right-0 w-48 h-48 rounded-full bg-curse-500/25 blur-3xl animate-pulse-glow" />
        <div className="relative">
          <div className="flex items-center gap-2 text-curse-300/80 text-xs tracking-[0.3em] uppercase mb-2"><Zap className="w-3.5 h-3.5" /> Domain Expansion</div>
          <h1 className="font-display font-black text-3xl sm:text-5xl leading-tight">
            <span className="shimmer-text">Jujutsu Clash</span><br />
            <span className="text-white text-glow">Arena</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-2">Fight, summon, and collect sorcerers across domains.</p>

          <div className="flex flex-wrap gap-3 mt-5">
            <Link href="/characters" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-curse-500 to-curse-700 text-white font-semibold text-sm shadow-curse-glow hover:shadow-curse-glow-lg transition-all flex items-center gap-2">
              <Zap className="w-4 h-4" /> Start Summoning
            </Link>
          </div>
        </div>
      </section>

      {top.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-lg text-white mb-3">Top Owned</h2>
          <div className="grid grid-cols-3 gap-3">
            {top.map((c) => {
              const meta = RARITY_META[c.rarity];
              return (
                <div key={c.id} className={`rounded-2xl overflow-hidden glass border border-curse-500/20 ${meta.glow}`}>
                  <div className="aspect-square bg-ink-800 relative flex items-center justify-center">
                    <Character
                      name={c.name}
                      src={c.image ?? '/assets/characters/upcoming.avif'}
                      size={220}
                      aura={auraFor(c) as any}
                      upcoming={!!c.upcoming || !c.image}
                      className="pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-brush-pattern opacity-30 pointer-events-none" />
                    <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] font-bold font-mono ${meta.color}`}>{meta.label}</div>
                  </div>
                  <div className="p-2">
                    <div className="text-xs font-semibold text-white truncate">{c.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{c.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
