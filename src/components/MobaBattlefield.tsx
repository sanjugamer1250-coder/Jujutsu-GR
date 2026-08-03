import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Shield, Skull, Zap, Crosshair, Heart, Clock, Coins, Trophy,
  Home, RotateCcw, Target, Flame, Eye, X, ChevronLeft, Crown, Lock,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { supabase, getPlayerId } from '@/lib/supabase';
import { pushToast, fmt } from '@/lib/ui';
import { MOBA_CHARACTERS, simulateMatch, getMobaElo, setMobaElo, getMobaStats, updateMobaStats, getDailyMobaEarnings, addDailyMobaEarnings, DAILY_EARNINGS_CAP, getRankTier, RANK_TIERS, MatchResult } from '@/lib/moba';

type Phase = 'lobby' | 'queue' | 'draft' | 'battle' | 'result';
type WagerTier = 'grade2' | 'grade1' | 'special';

const WAGER_TIERS: { id: WagerTier; label: string; dna: number; usdt: number; desc: string }[] = [
  { id: 'grade2', label: 'Grade 2 Arena', dna: 1000, usdt: 10, desc: 'Entry-level wager. Casual stakes.' },
  { id: 'grade1', label: 'Grade 1 High Stakes', dna: 10000, usdt: 100, desc: 'Serious competitors only.' },
  { id: 'special', label: 'Special Grade Championship', dna: 100000, usdt: 1000, desc: 'Elite wager. Winner takes all.' },
];

interface SkillShot {
  id: number; x: number; y: number; vx: number; vy: number; color: string; type: string; life: number;
}

export function MobaBattlefield() {
  const { balance, incrementDna, recordTransaction, updateRank } = useApp();
  const [phase, setPhase] = useState<Phase>('lobby');
  const [wagerTier, setWagerTier] = useState<WagerTier>('grade2');
  const [wagerCurrency, setWagerCurrency] = useState<'DNA' | 'USDT'>('DNA');
  const [selectedChar, setSelectedChar] = useState('yuji');
  const [queueTimer, setQueueTimer] = useState(0);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [battleTimer, setBattleTimer] = useState(0);
  const [kda, setKda] = useState({ kills: 0, deaths: 0, assists: 0 });
  const [hp, setHp] = useState(100);
  const [skillShots, setSkillShots] = useState<SkillShot[]>([]);
  const [cooldowns, setCooldowns] = useState({ skill1: 0, skill2: 0, ult: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const skillIdRef = useRef(0);
  const playerId = getPlayerId();
  const elo = getMobaElo();
  const rankTier = getRankTier(elo);

  const tier = WAGER_TIERS.find((t) => t.id === wagerTier)!;
  const stakeAmount = wagerCurrency === 'DNA' ? tier.dna : tier.usdt;

  // Queue timer
  useEffect(() => {
    if (phase !== 'queue') return;
    setQueueTimer(0);
    const interval = setInterval(() => {
      setQueueTimer((t) => {
        if (t >= 10) { clearInterval(interval); setPhase('draft'); return 10; }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Battle simulation
  useEffect(() => {
    if (phase !== 'battle') return;
    setBattleTimer(0);
    setKda({ kills: 0, deaths: 0, assists: 0 });
    setHp(100);
    setCooldowns({ skill1: 0, skill2: 0, ult: 0 });
    setSkillShots([]);

    const tick = () => {
      setBattleTimer((t) => t + 0.1);
      setKda((prev) => ({
        kills: prev.kills + (Math.random() < 0.08 ? 1 : 0),
        deaths: prev.deaths + (Math.random() < 0.04 ? 1 : 0),
        assists: prev.assists + (Math.random() < 0.06 ? 1 : 0),
      }));
      setHp((h) => Math.max(0, Math.min(100, h + (Math.random() < 0.3 ? -5 : 3))));
      setCooldowns((cd) => ({
        skill1: Math.max(0, cd.skill1 - 0.1),
        skill2: Math.max(0, cd.skill2 - 0.1),
        ult: Math.max(0, cd.ult - 0.1),
      }));
      // Auto-generate enemy skillshots
      if (Math.random() < 0.15) {
        const id = skillIdRef.current++;
        setSkillShots((shots) => [...shots, {
          id, x: Math.random() * 400, y: Math.random() * 250,
          vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
          color: ['#ef4444', '#f59e0b', '#7c41ff'][Math.floor(Math.random() * 3)],
          type: ['slash', 'beam', 'blast'][Math.floor(Math.random() * 3)],
          life: 1.0,
        }]);
      }
      // Decay skillshots
      setSkillShots((shots) => shots.map((s) => ({ ...s, x: s.x + s.vx, y: s.y + s.vy, life: s.life - 0.03 })).filter((s) => s.life > 0));
    };

    const interval = setInterval(tick, 100);

    // End battle after ~12s
    const timeout = setTimeout(() => {
      clearInterval(interval);
      finishMatch();
    }, 12000);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [phase]);

  // Canvas rendering
  useEffect(() => {
    if (phase !== 'battle' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Background
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Lanes (diagonal lines)
      ctx.strokeStyle = 'rgba(124,65,255,0.15)';
      ctx.lineWidth = 8;
      ctx.setLineDash([6, 6]);
      // Top lane
      ctx.beginPath(); ctx.moveTo(40, 280); ctx.lineTo(40, 40); ctx.lineTo(240, 40); ctx.stroke();
      // Mid lane
      ctx.beginPath(); ctx.moveTo(40, 280); ctx.lineTo(440, 40); ctx.stroke();
      // Bot lane
      ctx.beginPath(); ctx.moveTo(440, 40); ctx.lineTo(440, 280); ctx.lineTo(240, 280); ctx.stroke();
      ctx.setLineDash([]);

      // River
      ctx.strokeStyle = 'rgba(34,211,238,0.1)';
      ctx.lineWidth = 14;
      ctx.beginPath(); ctx.moveTo(10, 300); ctx.lineTo(470, 20); ctx.stroke();

      // Bases
      ctx.fillStyle = 'rgba(34,197,94,0.3)';
      ctx.fillRect(15, 255, 30, 30);
      ctx.fillStyle = 'rgba(239,68,68,0.3)';
      ctx.fillRect(435, 35, 30, 30);

      // Boss in river
      ctx.beginPath();
      ctx.arc(240, 160, 12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(244,63,94,0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(244,63,94,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Skill shots
      skillShots.forEach((s) => {
        ctx.globalAlpha = s.life;
        ctx.fillStyle = s.color;
        if (s.type === 'beam') {
          ctx.fillRect(s.x - 15, s.y - 2, 30, 4);
        } else if (s.type === 'slash') {
          ctx.beginPath();
          ctx.arc(s.x, s.y, 8 * s.life, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(s.x, s.y, 10 * s.life, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      });

      animRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, skillShots]);

  const fireSkill = useCallback((skill: 'skill1' | 'skill2' | 'ult') => {
    if (cooldowns[skill] > 0) return;
    const colors = { skill1: '#22d3ee', skill2: '#7c41ff', ult: '#ef4444' };
    const types = { skill1: 'beam', skill2: 'slash', ult: 'blast' };
    const id = skillIdRef.current++;
    setSkillShots((shots) => [...shots, {
      id, x: 200 + Math.random() * 100, y: 150 + Math.random() * 50,
      vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
      color: colors[skill], type: types[skill], life: 1.0,
    }]);
    setCooldowns((cd) => ({ ...cd, [skill]: skill === 'ult' ? 8 : skill === 'skill2' ? 5 : 3 }));
    setKda((prev) => ({ ...prev, kills: prev.kills + (skill === 'ult' ? 2 : 1) }));
    pushToast(`${skill === 'ult' ? 'ULTIMATE' : 'Skill'} cast!`, 'success');
  }, [cooldowns]);

  const startQueue = async () => {
    if (wagerCurrency === 'DNA' && balance.dna < stakeAmount) {
      pushToast(`Insufficient 🧬 DNA. Need ${fmt(stakeAmount)}.`, 'error');
      return;
    }
    if (wagerCurrency === 'USDT' && balance.usdt < stakeAmount) {
      pushToast(`Insufficient USDT. Need ${fmt(stakeAmount)}.`, 'error');
      return;
    }
    // Escrow funds
    if (wagerCurrency === 'DNA') {
      await incrementDna(-stakeAmount);
    } else {
      await supabase.from('user_balances').update({ usdt: balance.usdt - stakeAmount, updated_at: new Date().toISOString() }).eq('user_id', playerId);
    }
    await recordTransaction('wager_escrow', stakeAmount, wagerCurrency, 'out', `MOBA wager: ${tier.label}`);
    // Create match record
    await supabase.from('moba_matches').insert({
      match_type: 'wager_arena', stake_amount: stakeAmount, stake_currency: wagerCurrency, player_id: playerId,
    });
    setPhase('queue');
  };

  const finishMatch = async () => {
    const result = simulateMatch(selectedChar, true);
    setMatchResult(result);
    setPhase('result');

    // Apply results
    updateMobaStats(result.win);
    const newElo = result.win ? elo + 25 : Math.max(0, elo - 20);
    setMobaElo(newElo);
    const newRank = getRankTier(newElo);
    await updateRank(newRank.name, newElo);

    if (result.win) {
      // Payout via RPC
      const payout = stakeAmount * 2; // Double your stake on win
      if (wagerCurrency === 'DNA') {
        await incrementDna(payout);
        await recordTransaction('wager_payout', payout, 'DNA', 'in', `MOBA victory: ${tier.label}`);
      } else {
        await supabase.from('user_balances').update({ usdt: balance.usdt + payout, updated_at: new Date().toISOString() }).eq('user_id', playerId);
        await recordTransaction('wager_payout', payout, 'USDT', 'in', `MOBA victory: ${tier.label}`);
      }
      // Rank points + DNA yield
      const dailyEarned = getDailyMobaEarnings();
      const remainingCap = DAILY_EARNINGS_CAP - dailyEarned;
      if (remainingCap > 0) {
        const yieldReward = Math.min(result.dnaReward, remainingCap);
        if (yieldReward > 0) {
          await incrementDna(yieldReward);
          addDailyMobaEarnings(yieldReward);
        }
      }
    }
  };

  const reset = () => { setPhase('lobby'); setMatchResult(null); };
  const selectedCharacter = MOBA_CHARACTERS.find((c) => c.id === selectedChar) || MOBA_CHARACTERS[0];

  return (
    <div className="min-h-screen bg-domain">
      <div className="sticky top-0 z-40 glass-strong border-b border-rose-500/20">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          {phase !== 'lobby' && phase !== 'result' && (
            <button onClick={reset} className="text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
          )}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/30"><Swords className="w-4 h-4 text-white" /></div>
          <div className="flex-1"><div className="font-display font-bold text-white text-sm">5v5 Battlefield</div><div className="text-[10px] text-zinc-500">Wager Arena · 3-Lane MOBA</div></div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-ink-800 border border-ink-700"><Trophy className={`w-3.5 h-3.5 ${rankTier.color}`} /><span className={`text-xs font-bold ${rankTier.color}`}>{rankTier.name}</span><span className="text-xs text-zinc-500 font-mono">{elo}</span></div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* ===== LOBBY ===== */}
          {phase === 'lobby' && (
            <motion.div key="lobby" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <section className="relative overflow-hidden rounded-3xl border border-rose-500/30 p-6">
                <div className="absolute inset-0 bg-gradient-to-br from-blood-900/30 via-ink-900 to-ink-900" />
                <div className="absolute -top-16 -right-8 w-48 h-48 rounded-full bg-rose-600/20 blur-3xl animate-pulse-glow" />
                <div className="relative">
                  <div className="flex items-center gap-2 text-rose-300/80 text-xs tracking-[0.3em] uppercase mb-2"><Swords className="w-3.5 h-3.5" /> Wager Arena</div>
                  <h1 className="font-display font-black text-2xl sm:text-3xl text-white text-glow">5v5 Classic 3-Lane MOBA</h1>
                  <p className="text-zinc-400 text-sm mt-2 max-w-lg">Choose your wager tier and currency. Escrow funds, enter the queue, and battle across Top, Mid, and Bottom lanes separated by the Cursed Jungle. Winner takes the pot.</p>
                </div>
              </section>

              {/* Wager tier selection */}
              <section className="space-y-3">
                <div className="text-xs text-zinc-500 uppercase tracking-wider">Select Wager Tier</div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {WAGER_TIERS.map((t, i) => (
                    <motion.button
                      key={t.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => setWagerTier(t.id)}
                      className={`relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                        wagerTier === t.id
                          ? 'border-rose-500/50 bg-gradient-to-br from-rose-500/15 to-ink-900 shadow-blood-glow'
                          : 'border-ink-700 bg-ink-800/50 hover:border-rose-500/30'
                      }`}
                    >
                      {t.id === 'special' && <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 text-[8px] font-bold border border-rose-500/40">ELITE</div>}
                      <div className="font-display font-bold text-white text-sm">{t.label}</div>
                      <p className="text-[10px] text-zinc-500 mt-1">{t.desc}</p>
                      <div className="mt-3 flex items-center gap-3 text-xs">
                        <span className="font-mono font-bold text-gold-400">{fmt(t.dna)} <span className="text-[9px]">DNA</span></span>
                        <span className="text-zinc-600">or</span>
                        <span className="font-mono font-bold text-jade-400">${fmt(t.usdt)} <span className="text-[9px]">USDT</span></span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </section>

              {/* Currency toggle */}
              <section className="glass rounded-2xl p-4">
                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Wager Currency</div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setWagerCurrency('DNA')} className={`py-3 rounded-xl text-sm font-bold transition-all ${wagerCurrency === 'DNA' ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40' : 'bg-ink-800 text-zinc-500 border border-ink-700'}`}>
                    {fmt(tier.dna)} 🧬 DNA
                  </button>
                  <button onClick={() => setWagerCurrency('USDT')} className={`py-3 rounded-xl text-sm font-bold transition-all ${wagerCurrency === 'USDT' ? 'bg-jade-500/20 text-jade-400 border border-jade-500/40' : 'bg-ink-800 text-zinc-500 border border-ink-700'}`}>
                    ${fmt(tier.usdt)} USDT
                  </button>
                </div>
                <div className="mt-3 flex justify-between text-xs">
                  <span className="text-zinc-500">Your Balance</span>
                  <span className="font-mono text-white">{wagerCurrency === 'DNA' ? `${fmt(balance.dna)} DNA` : `$${fmt(balance.usdt)} USDT`}</span>
                </div>
              </section>

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

              <button onClick={startQueue} className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-700 text-white font-display font-bold text-lg shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 slash-hover-effect clip-angled">
                <Zap className="w-5 h-5" /> Enter Queue · {fmt(stakeAmount)} {wagerCurrency} Wager
              </button>
            </motion.div>
          )}

          {/* ===== QUEUE ===== */}
          {phase === 'queue' && (
            <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center mb-4 shadow-blood-glow-lg"><Swords className="w-8 h-8 text-white" /></motion.div>
              <div className="font-display font-bold text-white text-lg">Finding Match...</div>
              <div className="text-4xl font-mono font-bold text-rose-300 mt-2">{queueTimer}s</div>
              <div className="text-xs text-zinc-500 mt-2">Wager: {fmt(stakeAmount)} {wagerCurrency} · {tier.label}</div>
              <div className="mt-4 flex items-center gap-1 text-xs text-zinc-600"><Clock className="w-3.5 h-3.5" /> Estimated queue: 10 seconds</div>
            </motion.div>
          )}

          {/* ===== DRAFT ===== */}
          {phase === 'draft' && (
            <motion.div key="draft" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16">
              <div className="font-display font-bold text-white text-lg mb-4">Match Found!</div>
              <div className="flex items-center gap-6 mb-6">
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedCharacter.color} flex items-center justify-center mb-2`}><span className="font-display font-black text-2xl text-white/30">{selectedCharacter.name.charAt(0)}</span></div>
                  <div className="text-xs font-bold text-white">{selectedCharacter.name}</div>
                  <div className="text-[9px] text-zinc-500">YOU · {selectedCharacter.role}</div>
                </div>
                <Swords className="w-6 h-6 text-rose-400" />
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-ink-800 border border-ink-700 flex items-center justify-center mb-2"><Skull className="w-7 h-7 text-zinc-600" /></div>
                  <div className="text-xs font-bold text-zinc-400">Enemy Team</div>
                  <div className="text-[9px] text-zinc-600">5 Opponents</div>
                </div>
              </div>
              <motion.button
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                onClick={() => setPhase('battle')}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-700 text-white font-bold text-sm shadow-blood-glow clip-angled"
              >
                ENTER BATTLEFIELD
              </motion.button>
            </motion.div>
          )}

          {/* ===== BATTLE ===== */}
          {phase === 'battle' && (
            <motion.div key="battle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {/* Battlefield canvas */}
              <div className="relative rounded-2xl overflow-hidden border border-rose-500/30">
                <canvas ref={canvasRef} width={480} height={320} className="w-full h-auto" />
                {/* Lane labels */}
                <span className="absolute top-2 left-12 text-[9px] text-zinc-600 font-semibold">TOP</span>
                <span className="absolute top-1/2 left-1/2 -translate-y-8 text-[9px] text-zinc-600 font-semibold">MID</span>
                <span className="absolute bottom-2 right-12 text-[9px] text-zinc-600 font-semibold">BOT</span>
                {/* Timer */}
                <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-ink-950/80 backdrop-blur-sm text-xs font-mono font-bold text-rose-300">
                  {Math.floor(battleTimer / 60)}:{String(Math.floor(battleTimer % 60)).padStart(2, '0')}
                </div>
                {/* KDA overlay */}
                <div className="absolute bottom-2 left-2 flex gap-2 px-2 py-1 rounded-lg bg-ink-950/80 backdrop-blur-sm">
                  <span className="text-[10px] font-mono"><span className="text-jade-400 font-bold">{kda.kills}</span>/<span className="text-blood-400 font-bold">{kda.deaths}</span>/<span className="text-cyan-400 font-bold">{kda.assists}</span></span>
                </div>
              </div>

              {/* HUD controls */}
              <div className="grid grid-cols-4 gap-2">
                <HudButton icon={Zap} label="Skill 1" cd={cooldowns.skill1} maxCd={3} color="text-cyan-400" onClick={() => fireSkill('skill1')} />
                <HudButton icon={Crosshair} label="Skill 2" cd={cooldowns.skill2} maxCd={5} color="text-curse-300" onClick={() => fireSkill('skill2')} />
                <HudButton icon={Flame} label="Ultimate" cd={cooldowns.ult} maxCd={8} color="text-rose-400" onClick={() => fireSkill('ult')} />
                <HudButton icon={Home} label="Recall" cd={0} maxCd={0} color="text-zinc-400" onClick={() => { setHp(100); pushToast('Recalled to base!', 'success'); }} />
              </div>

              {/* HP bar */}
              <div className="glass rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-rose-400" /><span className="text-xs text-white font-bold">{selectedCharacter.name}</span></div>
                  <span className="text-xs font-mono text-zinc-400">{Math.round(hp)}% HP</span>
                </div>
                <div className="h-3 rounded-full bg-ink-700 overflow-hidden">
                  <motion.div animate={{ width: `${hp}%` }} transition={{ duration: 0.1 }} className={`h-full rounded-full ${hp > 50 ? 'bg-gradient-to-r from-jade-500 to-jade-600' : hp > 25 ? 'bg-gradient-to-r from-gold-500 to-orange-600' : 'bg-gradient-to-r from-blood-500 to-blood-700'}`} />
                </div>
              </div>

              {/* Minimap */}
              <div className="glass rounded-xl p-3">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Minimap</div>
                <div className="relative aspect-[16/10] rounded-lg bg-ink-900 border border-ink-700 overflow-hidden">
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px bg-ink-700">
                    {Array.from({ length: 9 }).map((_, i) => <div key={i} className="bg-ink-800/50" />)}
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-rose-500/30 border border-rose-500/50 animate-pulse" />
                  <div className="absolute top-1 left-1 w-2.5 h-2.5 rounded bg-jade-500/40" />
                  <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded bg-blood-500/40" />
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== RESULT ===== */}
          {phase === 'result' && matchResult && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className={`relative overflow-hidden rounded-3xl p-6 text-center border-2 ${matchResult.win ? 'border-jade-500/50 bg-jade-500/10' : 'border-blood-500/50 bg-blood-500/10'}`}>
                <div className="font-display font-black text-3xl sm:text-4xl text-white mb-1">{matchResult.win ? 'VICTORY' : 'DEFEAT'}</div>
                {matchResult.mvp && <div className="flex items-center justify-center gap-1.5 text-gold-400 font-bold text-sm"><Crown className="w-4 h-4" /> MVP</div>}
                <div className="text-xs text-zinc-500 mt-2">{matchResult.allyTeam} vs {matchResult.enemyTeam}</div>
                {matchResult.win && <div className="mt-3 text-sm font-bold text-jade-400">+{fmt(stakeAmount * 2)} {wagerCurrency} Payout</div>}
                {!matchResult.win && <div className="mt-3 text-sm font-bold text-blood-400">-{fmt(stakeAmount)} {wagerCurrency} Wager Lost</div>}
              </div>

              <div className="grid grid-cols-4 gap-3">
                <ResultStat label="Kills" value={kda.kills || matchResult.kills} icon={Crosshair} color="text-jade-400" />
                <ResultStat label="Deaths" value={kda.deaths || matchResult.deaths} icon={Skull} color="text-blood-400" />
                <ResultStat label="Assists" value={kda.assists || matchResult.assists} icon={Eye} color="text-cyan-400" />
                <ResultStat label="Duration" value={`${Math.floor(matchResult.durationSec / 60)}m`} icon={Clock} color="text-zinc-400" />
              </div>

              {matchResult.win && (
                <div className="glass rounded-2xl p-4 border border-gold-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Coins className="w-4 h-4 text-gold-400" /><span className="text-sm text-white font-semibold">Rewards</span></div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-gold-400">+{fmt(stakeAmount * 2)} {wagerCurrency}</div>
                      <div className="text-xs text-zinc-500">{matchResult.win ? '+25' : '-20'} Elo · {getRankTier(getMobaElo()).name}</div>
                    </div>
                  </div>
                  {matchResult.firstBlood && <div className="flex items-center gap-1.5 mt-2 text-xs text-blood-400"><Flame className="w-3.5 h-3.5" /> First Blood bonus!</div>}
                </div>
              )}

              <button onClick={reset} className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-700 text-white font-bold text-sm shadow-blood-glow clip-angled">Play Again</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function HudButton({ icon: Icon, label, cd, maxCd, color, onClick }: { icon: typeof Zap; label: string; cd: number; maxCd: number; color: string; onClick: () => void }) {
  const onCooldown = cd > 0;
  return (
    <button
      onClick={onClick}
      disabled={onCooldown}
      className={`relative rounded-xl border p-3 flex flex-col items-center gap-1 transition-all ${
        onCooldown ? 'bg-ink-800 border-ink-700 opacity-50' : 'bg-ink-800 border-ink-600 hover:border-rose-500/40 active:scale-95'
      }`}
    >
      <Icon className={`w-5 h-5 ${color}`} />
      <span className="text-[9px] text-zinc-400 font-semibold">{label}</span>
      {onCooldown && (
        <div className="absolute inset-0 rounded-xl bg-ink-950/60 flex items-center justify-center">
          <span className="text-xs font-mono font-bold text-zinc-300">{cd.toFixed(1)}s</span>
        </div>
      )}
    </button>
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
