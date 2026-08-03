import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, ChevronLeft, Swords, Clock, Users, Coins, TrendingUp, Zap, X, Crown } from 'lucide-react';
import { supabase, getPlayerId } from '@/lib/supabase';
import { useDnaBalance, useRoster, useStorageSync } from '@/lib/hooks';
import { CHARACTERS, RARITY_META, Character } from '@/lib/characters';
import { addDna, logTx } from '@/lib/economy';
import { fmt, fmtUsd, pushToast } from '@/lib/ui';

interface RaidBoss {
  id: string; name: string; hp: number; max_hp: number;
  reward_pool_dna: number; reward_pool_usdt: number;
  starts_at: string; ends_at: string; defeated: boolean;
}
interface RaidAttack {
  id: string; player_id: string; damage: number; created_at: string;
}

export default function RaidBoss() {
  const playerId = getPlayerId();
  const dna = useDnaBalance();
  const roster = useRoster();
  const [boss, setBoss] = useState<RaidBoss | null>(null);
  const [attacks, setAttacks] = useState<RaidAttack[]>([]);
  const [myDamage, setMyDamage] = useState(0);
  const [attacking, setAttacking] = useState(false);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  useStorageSync();

  useEffect(() => { loadRaid(); }, []);

  const loadRaid = async () => {
    const { data } = await supabase.from('raid_bosses').select('*').eq('defeated', false).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (data) {
      setBoss(data as RaidBoss);
      const { data: atks } = await supabase.from('raid_attacks').select('*').eq('raid_id', (data as RaidBoss).id).order('damage', { ascending: false });
      if (atks) setAttacks(atks as RaidAttack[]);
      const { data: myAtks } = await supabase.from('raid_attacks').select('*').eq('raid_id', (data as RaidBoss).id).eq('player_id', playerId);
      if (myAtks) setMyDamage((myAtks as RaidAttack[]).reduce((s, a) => s + a.damage, 0));
    }
  };

  const owned = CHARACTERS.filter((c) => roster.includes(c.id));
  const hpPercent = boss ? Math.max(0, (boss.hp / boss.max_hp) * 100) : 0;
  const timeLeft = boss ? Math.max(0, new Date(boss.ends_at).getTime() - Date.now()) : 0;
  const hoursLeft = Math.floor(timeLeft / 3600000);
  const minutesLeft = Math.floor((timeLeft % 3600000) / 60000);

  const attack = async () => {
    if (!boss || !selectedChar) { pushToast('Select a character!', 'error'); return; }
    if (boss.defeated) { pushToast('Boss already defeated!', 'error'); return; }
    setAttacking(true);
    // Damage based on character stats + randomness
    const baseDmg = (selectedChar.atk * 1000 + selectedChar.hp * 10) * (0.8 + Math.random() * 0.4);
    const damage = Math.round(baseDmg);
    await supabase.from('raid_attacks').insert({ raid_id: boss.id, player_id: playerId, damage });
    const newHp = Math.max(0, boss.hp - damage);
    await supabase.from('raid_bosses').update({ hp: newHp, defeated: newHp === 0 }).eq('id', boss.id);
    setMyDamage((prev) => prev + damage);
    setAttacking(false);
    if (newHp === 0) {
      pushToast(`Server defeated ${boss.name}! Rewards distributed based on damage dealt.`, 'success');
      // Simulate reward distribution
      const myShare = myDamage / boss.max_hp;
      const rewardDna = Math.round(boss.reward_pool_dna * myShare);
      if (rewardDna > 0) { addDna(rewardDna); logTx('raid', rewardDna, 'in', `Raid boss reward: ${boss.name}`); }
    } else {
      pushToast(`Dealt ${fmt(damage)} damage!`, 'success');
    }
    loadRaid();
  };

  const topAttackers = attacks.slice(0, 10);
  const myRank = attacks.findIndex((a) => a.player_id === playerId) + 1;

  return (
    <div className="min-h-screen bg-domain">
      <div className="sticky top-0 z-40 glass-strong border-b border-blood-500/20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></Link>
          <Skull className="w-5 h-5 text-blood-400" />
          <div className="font-display font-bold text-white">Server Raid Boss</div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {boss ? (
          <>
            <section className="relative overflow-hidden rounded-3xl border-gradient p-6">
              <div className="absolute -top-20 -right-10 w-56 h-56 rounded-full bg-blood-500/25 blur-3xl animate-pulse-glow" />
              <div className="relative text-center">
                <div className="flex items-center justify-center gap-2 text-blood-400/80 text-xs tracking-[0.3em] uppercase mb-2"><Skull className="w-3.5 h-3.5" /> Special Grade Disaster Curse</div>
                <h1 className="font-display font-black text-2xl sm:text-3xl text-white text-glow">{boss.name}</h1>
                <div className="mt-4 max-w-md mx-auto">
                  <div className="flex justify-between text-xs text-zinc-400 mb-1"><span>HP</span><span className="font-mono">{fmt(boss.hp)} / {fmt(boss.max_hp)}</span></div>
                  <div className="h-4 rounded-full bg-ink-700 overflow-hidden border border-blood-500/30">
                    <motion.div initial={{ width: '100%' }} animate={{ width: `${hpPercent}%` }} transition={{ duration: 0.5 }} className="h-full rounded-full bg-gradient-to-r from-blood-500 to-blood-600 shadow-blood-glow" />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                  <span className="flex items-center gap-1 text-zinc-400"><Clock className="w-3.5 h-3.5" /> {hoursLeft}h {minutesLeft}m left</span>
                  <span className="flex items-center gap-1 text-gold-400"><Coins className="w-3.5 h-3.5" /> {fmt(boss.reward_pool_dna)} 🧬 DNA</span>
                  <span className="flex items-center gap-1 text-jade-400"><TrendingUp className="w-3.5 h-3.5" /> {fmtUsd(Number(boss.reward_pool_usdt))} USDT</span>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-3 gap-3">
              <div className="glass rounded-2xl p-3 text-center"><Swords className="w-5 h-5 mx-auto mb-1 text-blood-400" /><div className="font-mono font-bold text-lg text-blood-400">{fmt(myDamage)}</div><div className="text-[10px] text-zinc-500 uppercase">Your Damage</div></div>
              <div className="glass rounded-2xl p-3 text-center"><Crown className="w-5 h-5 mx-auto mb-1 text-gold-400" /><div className="font-mono font-bold text-lg text-gold-400">#{myRank || '-'}</div><div className="text-[10px] text-zinc-500 uppercase">Your Rank</div></div>
              <div className="glass rounded-2xl p-3 text-center"><Users className="w-5 h-5 mx-auto mb-1 text-curse-300" /><div className="font-mono font-bold text-lg text-curse-300">{attacks.length}</div><div className="text-[10px] text-zinc-500 uppercase">Attackers</div></div>
            </section>

            {/* Character Selection */}
            <section className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3"><Zap className="w-4 h-4 text-energy-400" /><h2 className="font-display font-bold text-white text-sm">Select Your Attacker</h2></div>
              {owned.length === 0 ? <div className="text-sm text-zinc-500 text-center py-4">Summon characters first to attack the boss!</div> : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {owned.map((c) => {
                    const active = selectedChar?.id === c.id;
                    const meta = RARITY_META[c.rarity];
                    return (
                      <button key={c.id} onClick={() => setSelectedChar(c)} className={`relative rounded-xl overflow-hidden border transition-all ${active ? 'border-blood-500/60 shadow-blood-glow' : 'border-ink-700'}`}>
                        <img src={c.image} alt={c.name} className="w-full aspect-square object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                        <div className="p-1"><div className="text-[10px] text-white truncate">{c.name}</div><div className={`text-[8px] font-mono ${meta.color}`}>{meta.label}</div></div>
                      </button>
                    );
                  })}
                </div>
              )}
              <button onClick={attack} disabled={!selectedChar || attacking || boss.defeated} className={`w-full mt-4 py-3.5 rounded-xl font-bold text-sm ${selectedChar && !attacking && !boss.defeated ? 'bg-gradient-to-r from-blood-500 to-blood-600 text-white shadow-blood-glow hover:shadow-[0_0_36px_rgba(239,68,68,0.6)]' : 'bg-ink-800 text-zinc-600'}`}>
                {attacking ? 'Attacking...' : boss.defeated ? 'Boss Defeated' : 'Attack Boss!'}
              </button>
            </section>

            {/* Leaderboard */}
            <section className="glass rounded-2xl p-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Top Attackers — Damage Leaderboard</div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {topAttackers.length === 0 ? <div className="text-sm text-zinc-600 text-center py-4">No attacks yet. Be the first!</div> :
                  topAttackers.map((a, i) => (
                    <div key={a.id} className={`flex items-center justify-between rounded-lg p-2.5 text-xs ${a.player_id === playerId ? 'bg-curse-500/10 border border-curse-500/20' : 'bg-ink-800'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-bold w-6 ${i === 0 ? 'text-gold-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-orange-400' : 'text-zinc-500'}`}>#{i + 1}</span>
                        <span className="text-white font-mono">{a.player_id === playerId ? 'You' : a.player_id}</span>
                      </div>
                      <span className="font-mono font-bold text-blood-400">{fmt(a.damage)}</span>
                    </div>
                  ))}
              </div>
            </section>
          </>
        ) : (
          <div className="text-center py-20">
            <Skull className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl text-white">No Active Raid</h2>
            <p className="text-sm text-zinc-500 mt-2">The next Special Grade Disaster Curse will spawn soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
