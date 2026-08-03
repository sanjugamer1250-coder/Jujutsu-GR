import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ChevronLeft, Coins, Users, TrendingUp, X, Zap, Crown, Swords, Radio } from 'lucide-react';
import { supabase, getPlayerId } from '@/lib/supabase';
import { useDnaBalance, useStorageSync } from '@/lib/hooks';
import { CHARACTERS, RARITY_META } from '@/lib/characters';
import { spendDna, addDna, logTx } from '@/lib/economy';
import { fmt, pushToast } from '@/lib/ui';

interface PvPMatch {
  id: string; player1_id: string; player2_id: string; player1_char: string; player2_char: string;
  winner_id: string | null; status: string; scheduled_at: string;
}
interface Bet {
  id: string; match_id: string; bettor_id: string; bet_on: string; amount: number; resolved: boolean; payout: number;
}

export default function UndergroundArena() {
  const playerId = getPlayerId();
  const dna = useDnaBalance();
  const [matches, setMatches] = useState<PvPMatch[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<PvPMatch | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [betSide, setBetSide] = useState<string>('');
  useStorageSync();

  useEffect(() => { loadMatches(); loadBets(); }, []);

  const loadMatches = async () => {
    const { data } = await supabase.from('pvp_matches').select('*').in('status', ['scheduled', 'live']).order('scheduled_at', { ascending: true });
    if (data) setMatches(data as PvPMatch[]);
  };

  const loadBets = async () => {
    const { data } = await supabase.from('bets').select('*').eq('bettor_id', playerId).order('created_at', { ascending: false });
    if (data) setBets(data as Bet[]);
  };

  const placeBet = async () => {
    if (!selectedMatch || !betSide) { pushToast('Select a fighter to bet on.', 'error'); return; }
    const amt = parseFloat(betAmount);
    if (!amt || amt <= 0) { pushToast('Enter a valid amount.', 'error'); return; }
    if (dna < amt) { pushToast('Not enough 🧬 DNA.', 'error'); return; }
    if (!spendDna(amt)) { pushToast('Not enough 🧬 DNA.', 'error'); return; }
    logTx('bet', amt, 'out', `Bet on ${betSide === selectedMatch.player1_id ? 'Player 1' : 'Player 2'}`);
    await supabase.from('bets').insert({ match_id: selectedMatch.id, bettor_id: playerId, bet_on: betSide, amount: amt });
    pushToast(`Bet placed: ${fmt(amt)} 🧬 DNA on ${betSide === selectedMatch.player1_id ? selectedMatch.player1_id : selectedMatch.player2_id}!`, 'success');
    setBetAmount(''); setBetSide(''); setSelectedMatch(null);
    loadBets();
  };

  const getChar = (id: string) => CHARACTERS.find((c) => c.id === id);
  const liveMatches = matches.filter((m) => m.status === 'live');
  const scheduledMatches = matches.filter((m) => m.status === 'scheduled');

  const MatchCard = ({ match }: { match: PvPMatch }) => {
    const c1 = getChar(match.player1_char);
    const c2 = getChar(match.player2_char);
    const totalBets = bets.filter((b) => b.match_id === match.id).reduce((s, b) => s + b.amount, 0);
    const isLive = match.status === 'live';
    return (
      <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl p-4 border ${isLive ? 'border-blood-500/40 shadow-blood-glow' : 'border-ink-700'} glass`}>
        <div className="flex items-center justify-between mb-3">
          {isLive ? <span className="flex items-center gap-1 text-[10px] font-bold text-blood-400 uppercase"><Radio className="w-3 h-3 animate-pulse" /> Live Now</span> : <span className="text-[10px] text-zinc-500 uppercase">Scheduled</span>}
          <span className="text-[10px] text-zinc-600">{new Date(match.scheduled_at).toLocaleString()}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <div className="text-center">
            {c1 && <img src={c1.image} alt={c1.name} className="w-16 h-16 rounded-xl object-cover mx-auto border border-curse-500/30" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />}
            <div className="text-xs font-semibold text-white mt-1.5 truncate">{match.player1_id}</div>
            <div className="text-[10px] text-zinc-500 truncate">{c1?.name}</div>
          </div>
          <div className="text-center"><span className="font-display font-black text-xl text-blood-400">VS</span></div>
          <div className="text-center">
            {c2 && <img src={c2.image} alt={c2.name} className="w-16 h-16 rounded-xl object-cover mx-auto border border-curse-500/30" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />}
            <div className="text-xs font-semibold text-white mt-1.5 truncate">{match.player2_id}</div>
            <div className="text-[10px] text-zinc-500 truncate">{c2?.name}</div>
          </div>
        </div>
        <button onClick={() => { setSelectedMatch(match); setBetSide(''); }} className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-gold-500/20 to-gold-600/20 border border-gold-500/30 text-gold-400 font-bold text-sm hover:bg-gold-500/30 transition-colors flex items-center justify-center gap-2"><Coins className="w-4 h-4" /> Place Bet</button>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-domain">
      <div className="sticky top-0 z-40 glass-strong border-b border-gold-500/20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></Link>
          <Eye className="w-5 h-5 text-gold-400" />
          <div className="font-display font-bold text-white">Underground Arena</div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <section className="relative overflow-hidden rounded-3xl border-gradient p-6">
          <div className="absolute -top-16 -right-8 w-48 h-48 rounded-full bg-gold-500/20 blur-3xl animate-pulse-glow" />
          <div className="relative">
            <div className="flex items-center gap-2 text-gold-400/80 text-xs tracking-[0.3em] uppercase mb-2"><Eye className="w-3.5 h-3.5" /> Spectator Betting</div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white text-glow-gold">Underground Arena</h1>
            <p className="text-zinc-400 text-sm mt-2 max-w-lg">Watch the top 10 ranked PvP sorcerers battle live. Wager your 🧬 DNA on who will win. Winners split the pot — losers walk away empty.</p>
          </div>
        </section>

        {liveMatches.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3"><Radio className="w-4 h-4 text-blood-400 animate-pulse" /><h2 className="font-display font-bold text-lg text-white">Live Matches</h2></div>
            <div className="grid sm:grid-cols-2 gap-3">{liveMatches.map((m) => <MatchCard key={m.id} match={m} />)}</div>
          </section>
        )}

        <section>
          <div className="flex items-center gap-2 mb-3"><Swords className="w-4 h-4 text-gold-400" /><h2 className="font-display font-bold text-lg text-white">Upcoming Matches</h2></div>
          {scheduledMatches.length === 0 ? <div className="glass rounded-2xl p-6 text-center text-sm text-zinc-500">No upcoming matches scheduled.</div> :
            <div className="grid sm:grid-cols-2 gap-3">{scheduledMatches.map((m) => <MatchCard key={m.id} match={m} />)}</div>}
        </section>

        {/* My Bets */}
        <section className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3"><Coins className="w-4 h-4 text-gold-400" /><h2 className="font-display font-bold text-white text-sm">Your Bets</h2></div>
          {bets.length === 0 ? <div className="text-sm text-zinc-600 text-center py-4">No bets placed yet.</div> :
            <div className="space-y-2">{bets.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg bg-ink-800 p-3 text-xs">
                <div className="flex items-center gap-2"><span className={`w-1.5 h-1.5 rounded-full ${b.resolved ? (b.payout > 0 ? 'bg-jade-400' : 'bg-blood-400') : 'bg-gold-400 animate-pulse'}`} /><span className="text-white font-mono">{fmt(b.amount)} 🧬 DNA</span><span className="text-zinc-500">on {b.bet_on}</span></div>
                <span className={`font-mono font-bold ${b.resolved ? (b.payout > 0 ? 'text-jade-400' : 'text-blood-400') : 'text-gold-400'}`}>{b.resolved ? (b.payout > 0 ? `+${fmt(b.payout)}` : 'Lost') : 'Pending'}</span>
              </div>
            ))}</div>}
        </section>

        {/* Top Players Leaderboard */}
        <section className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3"><Crown className="w-4 h-4 text-gold-400" /><h2 className="font-display font-bold text-white text-sm">Top 10 Ranked Sorcerers</h2></div>
          <div className="space-y-1.5">
            {['P-CHAMP01','P-CHAMP02','P-CHAMP03','P-CHAMP04','P-CHAMP05','P-CHAMP06','P-CHAMP07','P-CHAMP08','P-CHAMP09','P-CHAMP10'].map((pid, i) => {
              const names: Record<string, string> = { 'P-CHAMP01':'GojoSatoru_X','P-CHAMP02':'SukunaMain','P-CHAMP03':'TojiSlayer','P-CHAMP04':'MegumiPro','P-CHAMP05':'NobaraNail','P-CHAMP06':'YujiVessel','P-CHAMP07':'NanamiRatio','P-CHAMP08':'MakiPhysical','P-CHAMP09':'TodoBrain','P-CHAMP10':'InumakiWord' };
              return (
                <div key={pid} className="flex items-center justify-between rounded-lg bg-ink-800 p-2.5 text-xs">
                  <div className="flex items-center gap-3">
                    <span className={`font-mono font-bold w-6 ${i === 0 ? 'text-gold-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-orange-400' : 'text-zinc-500'}`}>#{i + 1}</span>
                    <span className="text-white font-semibold">{names[pid]}</span>
                  </div>
                  <span className="text-zinc-500 font-mono">{pid}</span>
                </div>
              );
            })}
          </div>
        </section>

        <AnimatePresence>
          {selectedMatch && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMatch(null)} className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="max-w-sm w-full glass-strong rounded-3xl border border-gold-500/40 p-5">
                <div className="flex items-center justify-between mb-4"><h3 className="font-display font-bold text-white">Place Your Bet</h3><button onClick={() => setSelectedMatch(null)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button></div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[selectedMatch.player1_id, selectedMatch.player2_id].map((pid) => {
                    const char = getChar(pid === selectedMatch.player1_id ? selectedMatch.player1_char : selectedMatch.player2_char);
                    return (
                      <button key={pid} onClick={() => setBetSide(pid)} className={`rounded-xl p-3 border transition-all ${betSide === pid ? 'border-gold-500/50 bg-gold-500/10 shadow-gold-glow' : 'border-ink-700 bg-ink-800'}`}>
                        {char && <img src={char.image} alt={char.name} className="w-14 h-14 rounded-lg object-cover mx-auto" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />}
                        <div className="text-xs text-white font-semibold mt-1.5 truncate">{pid}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{char?.name}</div>
                      </button>
                    );
                  })}
                </div>
                <input type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} placeholder="Bet amount (🧬 DNA)" className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm font-mono focus:border-gold-500/50 outline-none" />
                <div className="text-[11px] text-zinc-500 mt-2">Available: {fmt(dna)} 🧬 DNA. Winners receive proportional payouts from the total pool.</div>
                <button onClick={placeBet} className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-black font-bold text-sm shadow-gold-glow">Confirm Bet</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
