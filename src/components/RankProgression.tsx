import { motion } from 'framer-motion';
import { Crown, Trophy, ChevronRight } from 'lucide-react';
import { RANK_TIERS, getMobaElo } from '@/lib/moba';
import { useApp } from '@/lib/store';
import { fmt } from '@/lib/ui';

export function RankProgression() {
  const elo = getMobaElo();
  const { balance } = useApp();
  const currentTier = RANK_TIERS.find((t) => elo >= t.min) || RANK_TIERS[0];
  const nextTier = RANK_TIERS[RANK_TIERS.indexOf(currentTier) + 1];
  const progressToNext = nextTier ? Math.min(100, ((elo - currentTier.min) / (nextTier.min - currentTier.min)) * 100) : 100;
  const isSpecialGrade = currentTier.name === 'Special Grade';

  return (
    <div className="space-y-5">
      {/* Current rank display */}
      <section className={`relative overflow-hidden rounded-3xl border-2 p-6 ${isSpecialGrade ? 'border-gold-500/50 bg-gradient-to-br from-gold-900/30 via-ink-900 to-ink-900' : `border-rose-500/30 bg-gradient-to-br ${currentTier.bg}`}`}>
        {isSpecialGrade && (
          <div className="absolute -top-12 -right-8 w-40 h-40 rounded-full bg-gold-500/20 blur-3xl animate-pulse-glow" />
        )}
        <div className="relative flex items-center gap-4">
          {/* Rank emblem */}
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${isSpecialGrade ? 'bg-gradient-to-br from-gold-500/30 to-gold-700/10 border-2 border-gold-500/50 shadow-gold-glow-lg' : 'bg-ink-800 border border-ink-700'}`}>
            {isSpecialGrade ? (
              <Crown className="w-10 h-10 text-gold-400" />
            ) : (
              <Trophy className={`w-10 h-10 ${currentTier.color}`} />
            )}
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Current Rank</div>
            <div className={`font-display font-black text-2xl ${currentTier.color} ${isSpecialGrade ? 'text-glow-gold' : 'text-glow'}`}>
              {currentTier.name}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">
              {elo} Rank Points {nextTier && <span className="text-zinc-600">· {nextTier.min - elo} to {nextTier.name}</span>}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {nextTier ? (
          <div className="relative mt-4">
            <div className="h-2.5 rounded-full bg-ink-700 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-gold-500"
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-zinc-500">
              <span>{currentTier.name} · {currentTier.min}</span>
              <span>{nextTier.name} · {nextTier.min}</span>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-center text-xs text-gold-400 font-bold">MAX RANK ACHIEVED</div>
        )}
      </section>

      {/* Full tier ladder */}
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-rose-300" />
          <h3 className="font-display font-bold text-white text-sm">Rank Tier Ladder</h3>
        </div>
        <div className="space-y-2">
          {RANK_TIERS.map((tier, i) => {
            const isCurrent = tier.name === currentTier.name;
            const isPast = elo >= tier.min;
            const isSpecial = tier.name === 'Special Grade';
            return (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? `bg-gradient-to-r ${tier.bg} ${tier.border} shadow-lg`
                    : isPast
                    ? 'bg-ink-800/50 border-ink-700'
                    : 'bg-ink-900/50 border-ink-800 opacity-50'
                }`}
              >
                {/* Emblem */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isSpecial && isPast ? 'bg-gradient-to-br from-gold-500/30 to-gold-700/10 border border-gold-500/40 shadow-gold-glow' : 'bg-ink-700'
                }`}>
                  {isSpecial ? <Crown className={`w-5 h-5 ${isPast ? 'text-gold-400' : 'text-zinc-600'}`} /> : <Trophy className={`w-5 h-5 ${tier.color}`} />}
                </div>

                {/* Tier name */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold ${tier.color}`}>{tier.name}</div>
                  <div className="text-[10px] text-zinc-600">{tier.min}+ Rank Points</div>
                </div>

                {/* Progress bar */}
                <div className="hidden sm:block w-24 h-1.5 rounded-full bg-ink-700 overflow-hidden">
                  <div className={`h-full rounded-full ${isPast ? 'bg-rose-500' : 'bg-ink-700'}`} style={{ width: isPast ? '100%' : `${Math.min(100, (elo / tier.min) * 100)}%` }} />
                </div>

                {/* Status */}
                {isCurrent && <span className="text-[9px] text-rose-300 font-bold px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30">YOU</span>}
                {isPast && !isCurrent && <ChevronRight className="w-4 h-4 text-zinc-600" />}
                {isSpecial && isPast && <span className="text-[8px] text-gold-400 font-bold px-2 py-0.5 rounded-md bg-gold-500/15 border border-gold-500/30">DRAGON</span>}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Rewards info */}
      <section className="glass rounded-2xl p-5 border border-gold-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-gold-400" />
          <h3 className="font-display font-bold text-white text-sm">Rank Rewards</h3>
        </div>
        <div className="space-y-2 text-xs text-zinc-400">
          <div className="flex items-start gap-2">
            <ChevronRight className="w-3.5 h-3.5 text-jade-400 mt-0.5 shrink-0" />
            <span><strong className="text-white">Victory Yields:</strong> Earn 🧬 DNA for every ranked win. MVP, First Blood, and 10-kill bonuses stack.</span>
          </div>
          <div className="flex items-start gap-2">
            <ChevronRight className="w-3.5 h-3.5 text-gold-400 mt-0.5 shrink-0" />
            <span><strong className="text-white">Special Grade Dragon Emblem:</strong> Players who reach Special Grade receive the gold-embossed dragon badge and exclusive tournament seeding.</span>
          </div>
          <div className="flex items-start gap-2">
            <ChevronRight className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
            <span><strong className="text-white">Elo Changes:</strong> +25 per win, -20 per loss. Daily 🧬 DNA cap: {fmt(5000)} tokens.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
