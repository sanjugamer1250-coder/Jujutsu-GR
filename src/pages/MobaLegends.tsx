import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, ChevronLeft, Zap, Trophy, Crown, Skull, Eye, Shield, Users, Play, X, Star,
  TrendingUp, Lock, AlertCircle, CheckCircle2, Clock, Flame, Target, Crosshair, Sparkles,
  ChevronRight, Award, Ban, Wifi, Gamepad2, MapPin, Swords as SwordsIcon, Heart, Activity, Coins,
} from 'lucide-react';
import { supabase, getPlayerId } from '@/lib/supabase';
import { addDna, logTx, getDna } from '@/lib/economy';
import { pushToast, fmt } from '@/lib/ui';
import {
  MOBA_CHARACTERS, MobaCharacter, simulateMatch, getMobaElo, setMobaElo, getMobaStats,
  updateMobaStats, getDailyMobaEarnings, addDailyMobaEarnings, DAILY_EARNINGS_CAP,
  getRankTier, RANK_TIERS, MatchResult,
} from '@/lib/moba';

type Tab = 'overview' | 'roster' | 'play' | 'ranked' | 'tournament' | 'policy';

export default function MobaLegends() {
  const [tab, setTab] = useState<Tab>('overview');
  const playerId = getPlayerId();
  const elo = getMobaElo();
  const stats = getMobaStats();
  const rankTier = getRankTier(elo);
  const dailyEarned = getDailyMobaEarnings();

  return (
    <div className="min-h-screen bg-domain">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-strong border-b border-rose-500/20">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></Link>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/30"><Swords className="w-4 h-4 text-white" /></div>
          <div className="flex-1"><div className="font-display font-bold text-white text-sm">Jujutsu Legends: 5v5</div><div className="text-[10px] text-zinc-500">Competitive MOBA · eSports</div></div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-ink-800 border border-ink-700"><Trophy className={`w-3.5 h-3.5 ${rankTier.color}`} /><span className={`text-xs font-bold ${rankTier.color}`}>{rankTier.name}</span><span className="text-xs text-zinc-500 font-mono">{elo}</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-14 z-30 glass border-b border-ink-700">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto no-scrollbar">
          {([
            { id: 'overview', label: 'Overview', icon: Gamepad2 },
            { id: 'roster', label: 'Roster', icon: Users },
            { id: 'play', label: 'Quick Match', icon: Play },
            { id: 'ranked', label: 'Ranked', icon: Trophy },
            { id: 'tournament', label: 'Tournaments', icon: Crown },
            { id: 'policy', label: 'eSports Policy', icon: Shield },
          ] as { id: Tab; label: string; icon: typeof Gamepad2 }[]).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${tab === t.id ? 'border-rose-500 text-rose-300' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {tab === 'overview' && <OverviewTab key="overview" elo={elo} stats={stats} rankTier={rankTier} dailyEarned={dailyEarned} />}
          {tab === 'roster' && <RosterTab key="roster" />}
          {tab === 'play' && <PlayTab key="play" playerId={playerId} isRanked={false} />}
          {tab === 'ranked' && <PlayTab key="ranked" playerId={playerId} isRanked={true} />}
          {tab === 'tournament' && <TournamentTab key="tournament" playerId={playerId} />}
          {tab === 'policy' && <PolicyTab key="policy" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ===================== OVERVIEW ===================== */
function OverviewTab({ elo, stats, rankTier, dailyEarned }: { elo: number; stats: { wins: number; losses: number }; rankTier: typeof RANK_TIERS[0]; dailyEarned: number }) {
  const totalGames = stats.wins + stats.losses;
  const winRate = totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      {/* Hero banner */}
      <section className="relative overflow-hidden rounded-3xl border border-rose-500/30 p-6 sm:p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-900/40 via-ink-900 to-ink-900" />
        <div className="absolute -top-20 -right-10 w-64 h-64 rounded-full bg-rose-600/20 blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full bg-curse-500/15 blur-3xl animate-pulse-glow" />
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="relative">
          <div className="flex items-center gap-2 text-rose-300/80 text-xs tracking-[0.3em] uppercase mb-3"><Swords className="w-4 h-4" /> Major Game Update · Season 1</div>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white text-glow mb-2">Jujutsu Legends</h1>
          <div className="flex items-center gap-2 mb-4"><span className="font-display font-black text-xl sm:text-2xl text-rose-400">5v5</span><span className="text-zinc-500 text-sm">Competitive MOBA</span></div>
          <p className="text-zinc-400 text-sm max-w-lg mb-5">A classic 3-lane MOBA with Cursed Jungle, Veil Turrets, and Domain Expansions. 10-second queues, 10-15 minute hyper-aggressive teamfights. Earn 🧬 DNA for every victory.</p>
          <a href="/moba/battle" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-500/30 clip-angled slash-hover-effect">
            <Zap className="w-4 h-4" /> Enter Wager Battlefield
          </a>
          <div className="flex flex-wrap gap-2">
            {['3-Lane Map', 'Fog of War', 'Jungle Bosses', 'Domain Expansions', 'Ranked Elo', 'eSports Tournaments'].map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300/80 text-[10px] font-semibold">{tag}</span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Stats grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Trophy} label="Rank" value={rankTier.name} color={rankTier.color} />
        <StatCard icon={Activity} label="Elo" value={String(elo)} color="text-rose-300" />
        <StatCard icon={CheckCircle2} label="Win Rate" value={`${winRate}%`} color="text-jade-400" />
        <StatCard icon={Coins} label="Daily 🧬 DNA" value={`${fmt(dailyEarned)}/${fmt(DAILY_EARNINGS_CAP)}`} color="text-gold-400" />
      </section>

      {/* Rank progression */}
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4"><Trophy className="w-4 h-4 text-rose-300" /><h3 className="font-display font-bold text-white text-sm">Rank Progression</h3></div>
        <div className="space-y-2">
          {RANK_TIERS.map((tier) => {
            const isCurrent = tier.name === rankTier.name;
            const isPast = elo >= tier.min;
            return (
              <div key={tier.name} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${isCurrent ? `bg-gradient-to-r ${tier.bg} ${tier.border}` : isPast ? 'bg-ink-800/50 border-ink-700' : 'bg-ink-900/50 border-ink-800 opacity-50'}`}>
                <span className={`text-xs font-bold w-20 ${tier.color}`}>{tier.name}</span>
                <div className="flex-1 h-1.5 rounded-full bg-ink-700 overflow-hidden"><div className={`h-full rounded-full ${isPast ? 'bg-rose-500' : 'bg-ink-700'}`} style={{ width: isPast ? '100%' : `${Math.min(100, (elo / tier.min) * 100)}%` }} /></div>
                <span className="text-[10px] text-zinc-600 font-mono w-12 text-right">{tier.min}+</span>
                {isCurrent && <span className="text-[9px] text-rose-300 font-bold">YOU</span>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Map preview */}
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4"><MapPin className="w-4 h-4 text-rose-300" /><h3 className="font-display font-bold text-white text-sm">The Battleground</h3></div>
        <MobaMap />
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <MapFeature icon={SwordsIcon} title="3-Lane Map" desc="Top, Mid, Bottom lanes separated by Cursed Jungle with fog of war." />
          <MapFeature icon={Shield} title="Veil Turrets" desc="Destroy defensive Veils to push through and shatter the enemy Core." />
          <MapFeature icon={Skull} title="Boss Curse" desc="Defeat the Special Grade Finger Bearer in the river for team-wide buffs." />
        </div>
      </section>

      {/* How to earn */}
      <section className="glass rounded-2xl p-5 border border-gold-500/20">
        <div className="flex items-center gap-2 mb-3"><Coins className="w-4 h-4 text-gold-400" /><h3 className="font-display font-bold text-white text-sm">🧬 DNA Economy Integration</h3></div>
        <div className="space-y-2 text-xs text-zinc-400">
          <div className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-jade-400 mt-0.5 shrink-0" /><span><strong className="text-white">Victory Yields:</strong> Earn 🧬 DNA for winning matches, with bonus multipliers for MVP, Most Assists, or First Blood.</span></div>
          <div className="flex items-start gap-2"><Crown className="w-3.5 h-3.5 text-gold-400 mt-0.5 shrink-0" /><span><strong className="text-white">eSports Tournaments:</strong> Teams of 5 enter weekend brackets with 🧬 DNA entry fees. Winners take the prize pool.</span></div>
          <div className="flex items-start gap-2"><Sparkles className="w-3.5 h-3.5 text-curse-300 mt-0.5 shrink-0" /><span><strong className="text-white">Cosmetic Sinks:</strong> Burn 🧬 DNA in the Cursed Store for MOBA-exclusive skins, recall animations, and announcer voice lines.</span></div>
          <div className="flex items-start gap-2"><Lock className="w-3.5 h-3.5 text-blood-400 mt-0.5 shrink-0" /><span><strong className="text-white">Daily Cap:</strong> Casual match earnings are soft-capped daily to prevent inflation. Ranked Elo continues after cap.</span></div>
        </div>
      </section>
    </motion.div>
  );
}

/* ===================== ROSTER ===================== */
function RosterTab() {
  const [selected, setSelected] = useState<MobaCharacter | null>(null);

  const roleColors: Record<string, string> = {
    'Brawler': 'text-rose-300 bg-rose-500/10 border-rose-500/30',
    'Fighter': 'text-rose-300 bg-rose-500/10 border-rose-500/30',
    'Tank': 'text-amber-300 bg-amber-500/10 border-amber-500/30',
    'Cursed Caster': 'text-sky-300 bg-sky-500/10 border-sky-500/30',
    'Shadow Assassin': 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    'Hyper-Carry Assassin': 'text-red-300 bg-red-500/10 border-red-500/30',
    'Domain Support': 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30',
    'Marksman': 'text-orange-300 bg-orange-500/10 border-orange-500/30',
    'Summoner': 'text-slate-300 bg-slate-500/10 border-slate-500/30',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-rose-300" /><h2 className="font-display font-bold text-white text-sm">Launching Roster — 10 Heroes</h2></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {MOBA_CHARACTERS.map((char, i) => (
          <motion.button key={char.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} onClick={() => setSelected(char)} className="group relative overflow-hidden rounded-2xl border border-ink-700 hover:border-rose-500/40 transition-all text-left">
            <div className={`h-24 bg-gradient-to-br ${char.color} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-ink-900/40" />
              <div className="absolute inset-0 flex items-center justify-center"><span className="font-display font-black text-3xl text-white/20">{char.name.charAt(0)}</span></div>
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-ink-900/80 text-[8px] font-bold text-zinc-400">{char.difficulty}</div>
            </div>
            <div className="p-3">
              <div className="text-xs font-bold text-white truncate">{char.name}</div>
              <div className="text-[10px] text-zinc-500 truncate">{char.title}</div>
              <div className={`mt-1.5 inline-block px-2 py-0.5 rounded-md border text-[9px] font-semibold ${roleColors[char.role] || 'text-zinc-400 bg-ink-800 border-ink-700'}`}>{char.role}</div>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected && <CharacterModal char={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

function CharacterModal({ char, onClose }: { char: MobaCharacter; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="max-w-lg w-full glass-strong rounded-3xl border border-rose-500/40 overflow-hidden max-h-[85vh] overflow-y-auto">
        <div className={`h-28 bg-gradient-to-br ${char.color} relative`}>
          <div className="absolute inset-0 bg-ink-900/30" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-ink-900/80 flex items-center justify-center text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
          <div className="absolute bottom-3 left-4"><div className="font-display font-black text-xl text-white">{char.name}</div><div className="text-xs text-white/70">{char.title}</div></div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-bold">{char.role}</span>
            <span className="px-2.5 py-1 rounded-lg bg-ink-800 border border-ink-700 text-zinc-400 text-[10px] font-bold">{char.lane} Lane</span>
            <span className="px-2.5 py-1 rounded-lg bg-ink-800 border border-ink-700 text-zinc-400 text-[10px] font-bold">{char.difficulty}</span>
          </div>
          <p className="text-xs text-zinc-400">{char.specialty}</p>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            <StatBar label="HP" value={char.stats.hp} max={4000} color="bg-rose-500" />
            <StatBar label="ATK" value={char.stats.atk} max={250} color="bg-orange-500" />
            <StatBar label="DEF" value={char.stats.def} max={130} color="bg-amber-500" />
            <StatBar label="SPD" value={char.stats.spd} max={100} color="bg-cyan-500" />
          </div>

          {/* Abilities */}
          <div className="space-y-2">
            {char.abilities.map((ab, i) => (
              <div key={i} className="rounded-xl bg-ink-800 p-3 border border-ink-700">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${ab.type === 'Ultimate' ? 'bg-rose-500/20 text-rose-300' : ab.type === 'Passive' ? 'bg-curse-500/20 text-curse-300' : 'bg-ink-700 text-zinc-400'}`}>{ab.type}</span>
                  <span className="text-xs font-bold text-white">{ab.name}</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">{ab.description}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ===================== PLAY / RANKED ===================== */
function PlayTab({ playerId, isRanked }: { playerId: string; isRanked: boolean }) {
  const [selectedChar, setSelectedChar] = useState<string>('yuji');
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [matchPhase, setMatchPhase] = useState<'idle' | 'matching' | 'in-game' | 'result'>('idle');
  const [matchTimer, setMatchTimer] = useState(0);
  const elo = getMobaElo();

  useEffect(() => {
    if (matchPhase === 'matching') {
      setMatchTimer(0);
      const interval = setInterval(() => {
        setMatchTimer((t) => {
          if (t >= 10) { clearInterval(interval); setMatchPhase('in-game'); return 10; }
          return t + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
    if (matchPhase === 'in-game') {
      const timeout = setTimeout(() => {
        const result = simulateMatch(selectedChar, isRanked);
        setMatchResult(result);
        setMatchPhase('result');
        // Apply results
        updateMobaStats(result.win);
        const newElo = result.win ? elo + (isRanked ? 25 : 0) : elo - (isRanked ? 20 : 0);
        setMobaElo(Math.max(0, newElo));
        const dailyEarned = getDailyMobaEarnings();
        const remainingCap = DAILY_EARNINGS_CAP - dailyEarned;
        if (remainingCap > 0) {
          const actualReward = Math.min(result.dnaReward, remainingCap);
          if (actualReward > 0) { addDna(actualReward); addDailyMobaEarnings(actualReward); logTx('bet', actualReward, 'in', `MOBA ${isRanked ? 'Ranked' : 'Quick'} ${result.win ? 'Win' : 'Loss'}${result.mvp ? ' (MVP)' : ''}`); }
        }
        // Save to Supabase
        supabase.from('moba_matches').insert({ player_id: playerId, result: result.win ? 'win' : 'loss', team: result.allyTeam, mvp: result.mvp, kills: result.kills, deaths: result.deaths, assists: result.assists, character_id: selectedChar, duration_sec: result.durationSec, dna_reward: Math.min(result.dnaReward, DAILY_EARNINGS_CAP - dailyEarned), first_blood: result.firstBlood }).then(() => {});
        supabase.from('moba_ranked').upsert({ player_id: playerId, elo: Math.max(0, newElo), wins: getMobaStats().wins, losses: getMobaStats().losses, rank_tier: getRankTier(Math.max(0, newElo)).name, daily_earned: getDailyMobaEarnings(), daily_cap: DAILY_EARNINGS_CAP, daily_reset: new Date().toISOString().split('T')[0] }).then(() => {});
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [matchPhase]);

  const startMatch = () => {
    setMatchPhase('matching');
    setMatchResult(null);
  };

  const reset = () => { setMatchPhase('idle'); setMatchResult(null); };

  const selectedCharacter = MOBA_CHARACTERS.find((c) => c.id === selectedChar) || MOBA_CHARACTERS[0];
  const dailyEarned = getDailyMobaEarnings();
  const capReached = dailyEarned >= DAILY_EARNINGS_CAP;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        {isRanked ? <Trophy className="w-4 h-4 text-rose-300" /> : <Play className="w-4 h-4 text-rose-300" />}
        <h2 className="font-display font-bold text-white text-sm">{isRanked ? 'Ranked Match' : 'Quick Match'}</h2>
        {isRanked && <span className="text-[10px] text-zinc-500">±25 Elo per match</span>}
      </div>

      {matchPhase === 'idle' && (
        <>
          {/* Character select */}
          <section className="glass rounded-2xl p-4">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Select Your Hero</div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {MOBA_CHARACTERS.map((char) => (
                <button key={char.id} onClick={() => setSelectedChar(char.id)} className={`aspect-square rounded-xl border-2 transition-all flex items-center justify-center ${selectedChar === char.id ? `border-rose-500 bg-gradient-to-br ${char.color}` : 'border-ink-700 bg-ink-800 hover:border-ink-600'}`}>
                  <span className={`font-display font-black text-lg ${selectedChar === char.id ? 'text-white' : 'text-zinc-600'}`}>{char.name.charAt(0)}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 p-3 rounded-xl bg-ink-800 border border-ink-700">
              <div className="flex items-center gap-2 mb-1"><span className="font-bold text-white text-sm">{selectedCharacter.name}</span><span className="text-[10px] text-zinc-500">{selectedCharacter.role} · {selectedCharacter.lane}</span></div>
              <p className="text-[11px] text-zinc-500">{selectedCharacter.specialty}</p>
            </div>
          </section>

          {capReached && !isRanked && (
            <div className="glass rounded-xl p-3 border border-gold-500/30 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gold-400 shrink-0" />
              <span className="text-xs text-zinc-400">Daily 🧬 DNA cap reached ({fmt(dailyEarned)}/{fmt(DAILY_EARNINGS_CAP)}). You can still play for Elo and leaderboard, but token rewards pause until daily reset.</span>
            </div>
          )}

          <button onClick={startMatch} className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-700 text-white font-display font-bold text-lg shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 hover:shadow-rose-500/50 transition-all">
            <Zap className="w-5 h-5" /> Find Match · 10s Queue
          </button>
        </>
      )}

      {matchPhase === 'matching' && (
        <div className="flex flex-col items-center justify-center py-16">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center mb-4 shadow-rose-glow-lg"><Swords className="w-8 h-8 text-white" /></motion.div>
          <div className="font-display font-bold text-white text-lg">Finding Match...</div>
          <div className="text-3xl font-mono font-bold text-rose-300 mt-2">{matchTimer}s</div>
          <div className="text-xs text-zinc-500 mt-1">Estimated queue: 10 seconds</div>
        </div>
      )}

      {matchPhase === 'in-game' && (
        <div className="flex flex-col items-center justify-center py-16">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="mb-4">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${selectedCharacter.color} flex items-center justify-center shadow-rose-glow-lg`}><span className="font-display font-black text-4xl text-white/30">{selectedCharacter.name.charAt(0)}</span></div>
          </motion.div>
          <div className="font-display font-bold text-white text-lg">Match In Progress</div>
          <div className="text-sm text-zinc-500 mt-1">Battling as {selectedCharacter.name}</div>
          <div className="flex items-center gap-2 mt-4 text-xs text-zinc-600"><Clock className="w-3.5 h-3.5" /> Est. 10-15 min · Simulating...</div>
          <MobaMap mini />
        </div>
      )}

      {matchPhase === 'result' && matchResult && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
          {/* Result banner */}
          <div className={`relative overflow-hidden rounded-3xl p-6 text-center border-2 ${matchResult.win ? 'border-jade-500/50 bg-jade-500/10' : 'border-blood-500/50 bg-blood-500/10'}`}>
            <div className="font-display font-black text-3xl sm:text-4xl text-white mb-1">{matchResult.win ? 'VICTORY' : 'DEFEAT'}</div>
            {matchResult.mvp && <div className="flex items-center justify-center gap-1.5 text-gold-400 font-bold text-sm"><Crown className="w-4 h-4" /> MVP</div>}
            <div className="text-xs text-zinc-500 mt-2">{matchResult.allyTeam} vs {matchResult.enemyTeam}</div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <ResultStat label="Kills" value={matchResult.kills} icon={Crosshair} color="text-jade-400" />
            <ResultStat label="Deaths" value={matchResult.deaths} icon={Skull} color="text-blood-400" />
            <ResultStat label="Assists" value={matchResult.assists} icon={Users} color="text-cyan-400" />
            <ResultStat label="Duration" value={`${Math.floor(matchResult.durationSec / 60)}m`} icon={Clock} color="text-zinc-400" />
          </div>

          {/* Rewards */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Coins className="w-4 h-4 text-gold-400" /><span className="text-sm text-white font-semibold">Rewards</span></div>
              <div className="text-right">
                <div className="font-mono font-bold text-gold-400">+{fmt(matchResult.dnaReward)} 🧬 DNA</div>
                {isRanked && <div className="text-xs text-zinc-500">{matchResult.win ? '+25' : '-20'} Elo</div>}
              </div>
            </div>
            {matchResult.firstBlood && <div className="flex items-center gap-1.5 mt-2 text-xs text-blood-400"><Flame className="w-3.5 h-3.5" /> First Blood bonus!</div>}
            {capReached && <div className="flex items-center gap-1.5 mt-2 text-xs text-gold-400"><Lock className="w-3.5 h-3.5" /> Daily cap reached — no 🧬 DNA earned this match</div>}
          </div>

          <button onClick={reset} className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-700 text-white font-bold text-sm shadow-rose-glow">Play Again</button>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ===================== TOURNAMENT ===================== */
function TournamentTab({ playerId }: { playerId: string }) {
  const [tournaments, setTournaments] = useState<Array<{ id: string; name: string; entry_fee: number; prize_pool: number; max_teams: number; registered_teams: number; status: string; starts_at: string }>>([]);
  const [showRegister, setShowRegister] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const dnaBalance = getDna();

  useEffect(() => { loadTournaments(); }, []);

  const loadTournaments = async () => {
    const { data } = await supabase.from('moba_tournaments').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) setTournaments(data as typeof tournaments);
    else {
      // Seed default tournaments
      const defaults = [
        { name: 'Weekend Warrior Cup', entry_fee: 500, prize_pool: 5000, max_teams: 16, registered_teams: 7, status: 'open', starts_at: new Date(Date.now() + 86400000).toISOString() },
        { name: 'Special Grade Championship', entry_fee: 2000, prize_pool: 25000, max_teams: 8, registered_teams: 3, status: 'open', starts_at: new Date(Date.now() + 172800000).toISOString() },
        { name: 'Cursed Energy Masters', entry_fee: 1000, prize_pool: 12000, max_teams: 16, registered_teams: 12, status: 'open', starts_at: new Date(Date.now() + 259200000).toISOString() },
      ];
      for (const t of defaults) await supabase.from('moba_tournaments').insert(t);
      const { data: seeded } = await supabase.from('moba_tournaments').select('*').order('created_at', { ascending: false });
      if (seeded) setTournaments(seeded as typeof tournaments);
    }
  };

  const register = async () => {
    if (!selectedTournament) return;
    const tournament = tournaments.find((t) => t.id === selectedTournament);
    if (!tournament) return;
    if (dnaBalance < tournament.entry_fee) { pushToast('Insufficient 🧬 DNA for entry fee.', 'error'); return; }
    addDna(-tournament.entry_fee);
    logTx('bet', tournament.entry_fee, 'out', `Tournament entry: ${tournament.name}`);
    await supabase.from('moba_tournaments').update({ registered_teams: tournament.registered_teams + 1, prize_pool: tournament.prize_pool + tournament.entry_fee }).eq('id', selectedTournament);
    pushToast(`Registered for ${tournament.name}!`, 'success');
    setShowRegister(false);
    setSelectedTournament(null);
    loadTournaments();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-2"><Crown className="w-4 h-4 text-gold-400" /><h2 className="font-display font-bold text-white text-sm">eSports Tournaments</h2></div>

      <div className="glass rounded-2xl p-4 border border-gold-500/20">
        <div className="flex items-center gap-2 mb-2"><Trophy className="w-4 h-4 text-gold-400" /><span className="text-sm font-bold text-white">High Stakes Weekend Brackets</span></div>
        <p className="text-xs text-zinc-500">Teams of 5 enter by paying 🧬 DNA entry fees. The winning team takes the total prize pool, minus a 10% platform treasury cut. All rewards distributed to Omni-Wallets immediately.</p>
      </div>

      <div className="space-y-3">
        {tournaments.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass rounded-2xl p-4 border border-ink-700">
            <div className="flex items-start justify-between mb-3">
              <div><div className="font-display font-bold text-white text-sm">{t.name}</div><div className="text-[10px] text-zinc-500 mt-0.5">Starts: {new Date(t.starts_at).toLocaleDateString()} · {t.max_teams} teams max</div></div>
              <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${t.status === 'open' ? 'bg-jade-500/15 text-jade-400' : 'bg-ink-800 text-zinc-500'}`}>{t.status.toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center p-2 rounded-lg bg-ink-800"><div className="text-[9px] text-zinc-500 uppercase">Entry Fee</div><div className="font-mono font-bold text-blood-400 text-sm">{fmt(t.entry_fee)}</div></div>
              <div className="text-center p-2 rounded-lg bg-ink-800"><div className="text-[9px] text-zinc-500 uppercase">Prize Pool</div><div className="font-mono font-bold text-gold-400 text-sm">{fmt(t.prize_pool)}</div></div>
              <div className="text-center p-2 rounded-lg bg-ink-800"><div className="text-[9px] text-zinc-500 uppercase">Teams</div><div className="font-mono font-bold text-white text-sm">{t.registered_teams}/{t.max_teams}</div></div>
            </div>
            <div className="h-1.5 rounded-full bg-ink-800 overflow-hidden mb-3"><div className="h-full bg-gradient-to-r from-gold-500 to-rose-500" style={{ width: `${(t.registered_teams / t.max_teams) * 100}%` }} /></div>
            {t.status === 'open' && t.registered_teams < t.max_teams ? (
              <button onClick={() => { setSelectedTournament(t.id); setShowRegister(true); }} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-rose-500 text-white font-bold text-xs">Register Team — {fmt(t.entry_fee)} 🧬 DNA Entry</button>
            ) : <div className="text-center text-xs text-zinc-600 py-2">{t.registered_teams >= t.max_teams ? 'Tournament Full' : 'Registration Closed'}</div>}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showRegister && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRegister(false)} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="max-w-sm w-full glass-strong rounded-3xl border border-gold-500/40 p-5">
              <div className="flex items-center justify-between mb-4"><h3 className="font-display font-bold text-white">Register Team</h3><button onClick={() => setShowRegister(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button></div>
              <p className="text-xs text-zinc-500 mb-4">Confirm your team's entry. The entry fee is deducted from your Omni-Wallet and added to the prize pool.</p>
              <div className="rounded-xl bg-ink-800 p-3 border border-ink-700 mb-4 text-xs space-y-1.5">
                <div className="flex justify-between"><span className="text-zinc-500">Your Balance</span><span className="font-mono text-white">{fmt(dnaBalance)} 🧬 DNA</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Entry Fee</span><span className="font-mono text-blood-400">-{fmt(tournaments.find((t) => t.id === selectedTournament)?.entry_fee || 0)}</span></div>
                <div className="border-t border-ink-700 pt-1.5 flex justify-between font-bold"><span className="text-white">After Entry</span><span className="font-mono text-jade-400">{fmt(dnaBalance - (tournaments.find((t) => t.id === selectedTournament)?.entry_fee || 0))}</span></div>
              </div>
              <button onClick={register} className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500 to-rose-500 text-white font-bold text-sm">Confirm Registration</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ===================== POLICY ===================== */
function PolicyTab() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
      <div className="flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-rose-300" /><h2 className="font-display font-bold text-white text-sm">Official eSports & Matchmaking Policy</h2></div>
      <p className="text-[10px] text-zinc-600">Effective for all Jujutsu Legends: 5v5! Matches</p>

      <PolicySection icon={Activity} title="Article I: Match Integrity & AFK Penalties" color="border-rose-500/30">
        <PolicyItem icon={Clock} title="Active Participation Requirement" desc="Players must remain engaged for the full 10-15 minute match. Going AFK for 60+ seconds triggers AI takeover to protect the team." />
        <PolicyItem icon={Ban} title="Desertion Penalties" desc="Abandoning before the core is destroyed results in immediate Ranked Point (Elo) deduction, 30-minute matchmaking ban, and zero 🧬 DNA distribution." />
        <PolicyItem icon={AlertCircle} title="Anti-Griefing & Toxicity" desc="Intentional feeding or refusing to participate in teamfights triggers automatic account review and temporary Ranked suspension." />
      </PolicySection>

      <PolicySection icon={Users} title="Article II: Fair Play & Matchmaking" color="border-cyan-500/30">
        <PolicyItem icon={TrendingUp} title="Skill-Based Matchmaking (SBMM)" desc="Players matched strictly by Ranked Elo. Pre-made 5-player squads exclusively face other pre-made squads." />
        <PolicyItem icon={Wifi} title="Network Stability" desc="Ranked queues require stable ping. Severe latency fluctuations may result in queue restriction to protect all 10 players." />
        <PolicyItem icon={Lock} title="Zero Tolerance on Exploits" desc="Map-hacks, auto-aim scripts, or lag switching carry immediate permanent ban and total forfeiture of Omni-Wallet 🧬 DNA balance." />
      </PolicySection>

      <PolicySection icon={Coins} title="Article III: 🧬 DNA Earnings & Payouts" color="border-gold-500/30">
        <PolicyItem icon={CheckCircle2} title="Reward Distribution" desc="Token rewards are distributed to the player's internal Omni-Wallet immediately upon match conclusion and MVP screen." />
        <PolicyItem icon={Lock} title="Daily Capped Limits" desc="Casual match 🧬 DNA earnings are subject to a daily soft cap. After cap, players continue for Ranked Elo and leaderboard placement only. Emissions resume at daily reset." />
      </PolicySection>
    </motion.div>
  );
}

/* ===================== SHARED COMPONENTS ===================== */
function MobaMap({ mini }: { mini?: boolean }) {
  if (mini) {
    return (
      <div className="mt-6 mx-auto w-48 h-48 rounded-2xl bg-ink-900 border border-ink-700 relative overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px bg-ink-700">
          {Array.from({ length: 9 }).map((_, i) => <div key={i} className="bg-ink-800/50" />)}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-rose-500/30 border border-rose-500/50 animate-pulse" />
        <div className="absolute top-2 left-2 w-3 h-3 rounded bg-jade-500/40" />
        <div className="absolute bottom-2 right-2 w-3 h-3 rounded bg-blood-500/40" />
      </div>
    );
  }
  return (
    <div className="relative aspect-[16/9] rounded-2xl bg-ink-900 border border-ink-700 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900" />
      {/* Lanes */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 225" preserveAspectRatio="none">
        {/* Top lane */}
        <path d="M 50 200 L 50 50 L 200 50" stroke="rgba(244,63,94,0.3)" strokeWidth="6" fill="none" strokeDasharray="4 4" />
        {/* Mid lane */}
        <path d="M 50 200 L 350 50" stroke="rgba(244,63,94,0.3)" strokeWidth="6" fill="none" strokeDasharray="4 4" />
        {/* Bot lane */}
        <path d="M 350 50 L 350 200 L 200 200" stroke="rgba(244,63,94,0.3)" strokeWidth="6" fill="none" strokeDasharray="4 4" />
        {/* River */}
        <path d="M 20 220 L 380 30" stroke="rgba(56,189,248,0.15)" strokeWidth="12" fill="none" />
      </svg>
      {/* Bases */}
      <div className="absolute bottom-3 left-3 w-8 h-8 rounded-lg bg-jade-500/30 border border-jade-500/50 flex items-center justify-center"><Shield className="w-4 h-4 text-jade-400" /></div>
      <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-blood-500/30 border border-blood-500/50 flex items-center justify-center"><Skull className="w-4 h-4 text-blood-400" /></div>
      {/* Boss */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-rose-500/20 border-2 border-rose-500/40 flex items-center justify-center animate-pulse-glow"><Skull className="w-5 h-5 text-rose-400" /></div>
      {/* Labels */}
      <span className="absolute top-2 left-16 text-[9px] text-zinc-600 font-semibold">TOP</span>
      <span className="absolute top-1/2 left-1/2 -translate-y-8 text-[9px] text-zinc-600 font-semibold">MID</span>
      <span className="absolute bottom-2 right-16 text-[9px] text-zinc-600 font-semibold">BOT</span>
      <span className="absolute top-1/2 right-1/2 translate-x-8 text-[9px] text-rose-400/50 font-semibold">RIVER</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Trophy; label: string; value: string; color: string }) {
  return (
    <div className="glass rounded-2xl p-3 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
      <div className={`font-mono font-bold text-sm ${color}`}>{value}</div>
      <div className="text-[9px] text-zinc-500 uppercase">{label}</div>
    </div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[9px] text-zinc-500 mb-0.5"><span>{label}</span><span className="font-mono">{value}</span></div>
      <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} /></div>
    </div>
  );
}

function ResultStat({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: typeof Trophy; color: string }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
      <div className={`font-mono font-bold text-lg ${color}`}>{value}</div>
      <div className="text-[9px] text-zinc-500 uppercase">{label}</div>
    </div>
  );
}

function MapFeature({ icon: Icon, title, desc }: { icon: typeof Shield; title: string; desc: string }) {
  return (
    <div className="p-3 rounded-xl bg-ink-800/50 border border-ink-700">
      <Icon className="w-4 h-4 text-rose-300 mb-1.5" />
      <div className="text-xs font-bold text-white mb-0.5">{title}</div>
      <div className="text-[10px] text-zinc-500">{desc}</div>
    </div>
  );
}

function PolicySection({ icon: Icon, title, color, children }: { icon: typeof Shield; title: string; color: string; children: React.ReactNode }) {
  return (
    <section className={`glass rounded-2xl p-4 border ${color}`}>
      <div className="flex items-center gap-2 mb-3"><Icon className="w-4 h-4 text-rose-300" /><h3 className="font-display font-bold text-white text-sm">{title}</h3></div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function PolicyItem({ icon: Icon, title, desc }: { icon: typeof Shield; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-ink-800 flex items-center justify-center shrink-0"><Icon className="w-3.5 h-3.5 text-zinc-400" /></div>
      <div><div className="text-xs font-bold text-white">{title}</div><div className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">{desc}</div></div>
    </div>
  );
}
