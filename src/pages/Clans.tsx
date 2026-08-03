import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Coins, ChevronLeft, Swords, Crown, Shield, Flag, X, Plus, MapPin } from 'lucide-react';
import { supabase, getPlayerId, getPlayerName } from '@/lib/supabase';
import { useDnaBalance, useStorageSync } from '@/lib/hooks';
import { spendDna, addDna, logTx } from '@/lib/economy';
import { fmt, pushToast } from '@/lib/ui';

interface Clan {
  id: string; name: string; leader_id: string; treasury: number; territory: string | null; created_at: string;
}
interface ClanMember {
  id: string; clan_id: string; player_id: string; joined_at: string;
}

const CLAN_COST = 10000;
const TERRITORIES = ['Shibuya', 'Kyoto'];

export default function Clans() {
  const playerId = getPlayerId();
  const dna = useDnaBalance();
  const [clans, setClans] = useState<Clan[]>([]);
  const [myClan, setMyClan] = useState<Clan | null>(null);
  const [myMembership, setMyMembership] = useState<ClanMember | null>(null);
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [clanName, setClanName] = useState('');
  const [wagerAmount, setWagerAmount] = useState('');
  const [attacking, setAttacking] = useState<string | null>(null);
  useStorageSync();

  useEffect(() => { loadClans(); }, []);

  const loadClans = async () => {
    const { data: clanData } = await supabase.from('clans').select('*').order('treasury', { ascending: false });
    if (clanData) setClans(clanData as Clan[]);
    const { data: myMem } = await supabase.from('clan_members').select('*').eq('player_id', playerId).maybeSingle();
    if (myMem) {
      setMyMembership(myMem as ClanMember);
      const { data: mc } = await supabase.from('clans').select('*').eq('id', (myMem as ClanMember).clan_id).maybeSingle();
      if (mc) setMyClan(mc as Clan);
      const { data: membs } = await supabase.from('clan_members').select('*').eq('clan_id', (myMem as ClanMember).clan_id);
      if (membs) setMembers(membs as ClanMember[]);
    }
  };

  const createClan = async () => {
    if (!clanName.trim()) { pushToast('Enter a clan name.', 'error'); return; }
    if (dna < CLAN_COST) { pushToast(`Need ${fmt(CLAN_COST)} 🧬 DNA to create a clan.`, 'error'); return; }
    if (!spendDna(CLAN_COST)) { pushToast('Not enough 🧬 DNA.', 'error'); return; }
    logTx('clan', CLAN_COST, 'out', `Created clan: ${clanName}`);
    const { data, error } = await supabase.from('clans').insert({ name: clanName, leader_id: playerId }).select().maybeSingle();
    if (error) { pushToast('Clan name taken or error.', 'error'); addDna(CLAN_COST); return; }
    if (data) {
      await supabase.from('clan_members').insert({ clan_id: (data as Clan).id, player_id: playerId });
      pushToast(`Clan "${clanName}" created!`, 'success');
      setClanName(''); setShowCreate(false);
      loadClans();
    }
  };

  const joinClan = async (clanId: string) => {
    if (myMembership) { pushToast('You are already in a clan.', 'error'); return; }
    await supabase.from('clan_members').insert({ clan_id: clanId, player_id: playerId });
    pushToast('Joined clan!', 'success');
    loadClans();
  };

  const leaveClan = async () => {
    if (!myMembership) return;
    await supabase.from('clan_members').delete().eq('clan_id', myMembership.clan_id).eq('player_id', playerId);
    pushToast('Left clan.', 'info');
    setMyClan(null); setMyMembership(null); setMembers([]);
    loadClans();
  };

  const contributeTreasury = async () => {
    if (!myClan) return;
    const amt = parseFloat(wagerAmount);
    if (!amt || amt <= 0) { pushToast('Enter a valid amount.', 'error'); return; }
    if (!spendDna(amt)) { pushToast('Not enough 🧬 DNA.', 'error'); return; }
    logTx('clan', amt, 'out', `Treasury contribution to ${myClan.name}`);
    await supabase.from('clans').update({ treasury: myClan.treasury + amt }).eq('id', myClan.id);
    setWagerAmount('');
    pushToast(`Contributed ${fmt(amt)} 🧬 DNA to treasury.`, 'success');
    loadClans();
  };

  const attackTerritory = async (territory: string, defenderClan: Clan) => {
    if (!myClan) { pushToast('Join a clan first.', 'error'); return; }
    if (myClan.id === defenderClan.id) { pushToast('Cannot attack your own clan.', 'error'); return; }
    if (myClan.treasury < 5000) { pushToast('Your clan treasury needs at least 5,000 🧬 DNA to attack.', 'error'); return; }
    setAttacking(territory);
    // Simulate GvG battle — 50/50 chance modified by treasury
    const myPower = myClan.treasury + Math.random() * 10000;
    const theirPower = defenderClan.treasury + Math.random() * 10000;
    const won = myPower > theirPower;
    setTimeout(async () => {
      if (won) {
        const spoils = Math.min(defenderClan.treasury, myClan.treasury);
        await supabase.from('clans').update({ territory, treasury: myClan.treasury + spoils }).eq('id', myClan.id);
        await supabase.from('clans').update({ territory: null, treasury: Math.max(0, defenderClan.treasury - spoils) }).eq('id', defenderClan.id);
        pushToast(`Victory! Your clan seized ${territory} and captured ${fmt(spoils)} 🧬 DNA from the enemy treasury!`, 'success');
      } else {
        const loss = Math.min(myClan.treasury * 0.2, 5000);
        await supabase.from('clans').update({ treasury: myClan.treasury - loss }).eq('id', myClan.id);
        pushToast(`Defeat! Your clan lost ${fmt(loss)} 🧬 DNA from the treasury.`, 'error');
      }
      setAttacking(null);
      loadClans();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-domain">
      <div className="sticky top-0 z-40 glass-strong border-b border-curse-500/20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></Link>
          <Users className="w-5 h-5 text-curse-300" />
          <div className="font-display font-bold text-white">Cursed Clans</div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <section className="relative overflow-hidden rounded-3xl border-gradient p-6">
          <div className="absolute -top-16 -right-8 w-48 h-48 rounded-full bg-blood-500/20 blur-3xl animate-pulse-glow" />
          <div className="relative">
            <div className="flex items-center gap-2 text-curse-300/80 text-xs tracking-[0.3em] uppercase mb-2"><Shield className="w-3.5 h-3.5" /> Guild System & Turf Wars</div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white text-glow">Sorcerer Families</h1>
            <p className="text-zinc-400 text-sm mt-2 max-w-lg">Create or join a Clan for {fmt(CLAN_COST)} 🧬 DNA. Build a treasury, recruit members, and wage GvG Turf Wars every weekend for control of Shibuya and Kyoto.</p>
          </div>
        </section>

        {myClan ? (
          <section className="glass rounded-2xl p-5 border border-curse-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-curse-500 to-curse-700 flex items-center justify-center shadow-curse-glow"><Crown className="w-6 h-6 text-white" /></div>
                <div><div className="font-display font-bold text-lg text-white">{myClan.name}</div><div className="text-xs text-zinc-500">{myClan.leader_id === playerId ? 'You are the Leader' : `Led by ${myClan.leader_id}`} · {members.length} members</div></div>
              </div>
              {myClan.territory && <div className="px-3 py-1.5 rounded-lg bg-gold-500/15 text-gold-400 text-xs font-bold flex items-center gap-1"><MapPin className="w-3 h-3" /> {myClan.territory}</div>}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-ink-800 p-3"><div className="text-[10px] text-zinc-500 uppercase">Treasury</div><div className="font-mono font-bold text-gold-400 text-lg">{fmt(myClan.treasury)}</div></div>
              <div className="rounded-xl bg-ink-800 p-3"><div className="text-[10px] text-zinc-500 uppercase">Members</div><div className="font-mono font-bold text-white text-lg">{members.length}</div></div>
            </div>
            <div className="flex gap-2 mb-4">
              <input type="number" value={wagerAmount} onChange={(e) => setWagerAmount(e.target.value)} placeholder="Contribute to treasury" className="flex-1 px-3 py-2 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm font-mono focus:border-gold-500/50 outline-none" />
              <button onClick={contributeTreasury} className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-black font-bold text-sm">Deposit</button>
            </div>
            {myClan.leader_id === playerId && (
              <button onClick={leaveClan} className="text-xs text-blood-400 hover:text-blood-500">Disband / Leave Clan</button>
            )}
          </section>
        ) : (
          <section className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div><div className="font-display font-bold text-white">Create Your Clan</div><div className="text-xs text-zinc-500">Cost: {fmt(CLAN_COST)} 🧬 DNA</div></div>
              <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-curse-500 to-curse-700 text-white font-bold text-sm flex items-center gap-2 shadow-curse-glow"><Plus className="w-4 h-4" /> Create</button>
            </div>
          </section>
        )}

        {/* Turf Wars */}
        <section className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3"><Flag className="w-4 h-4 text-blood-400" /><h2 className="font-display font-bold text-white text-sm">GvG Turf Wars</h2></div>
          <div className="grid grid-cols-2 gap-3">
            {TERRITORIES.map((terr) => {
              const holder = clans.find((c) => c.territory === terr);
              return (
                <div key={terr} className="rounded-xl bg-ink-800 p-4 border border-blood-500/20">
                  <div className="flex items-center gap-2 mb-2"><MapPin className="w-4 h-4 text-blood-400" /><span className="font-display font-bold text-white">{terr}</span></div>
                  {holder ? (
                    <div>
                      <div className="text-xs text-zinc-500">Held by</div>
                      <div className="text-sm text-curse-300 font-semibold">{holder.name}</div>
                      <div className="text-[10px] text-zinc-600">Treasury: {fmt(holder.treasury)}</div>
                      {myClan && myClan.id !== holder.id && (
                        <button onClick={() => attackTerritory(terr, holder)} disabled={attacking === terr} className="w-full mt-2 py-2 rounded-lg bg-gradient-to-r from-blood-500 to-blood-600 text-white font-bold text-xs">
                          {attacking === terr ? 'Battling...' : 'Attack!'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs text-zinc-500">Unclaimed</div>
                      {myClan && <button onClick={() => attackTerritory(terr, { id: '', name: 'Unclaimed', leader_id: '', treasury: 0, territory: null, created_at: '' })} disabled={attacking === terr} className="w-full mt-2 py-2 rounded-lg bg-gradient-to-r from-jade-500 to-jade-600 text-white font-bold text-xs">{attacking === terr ? 'Claiming...' : 'Claim Territory'}</button>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Clan Leaderboard */}
        <section className="glass rounded-2xl p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">All Clans</div>
          <div className="space-y-2">
            {clans.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-ink-800 p-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-zinc-500 text-sm w-6">#{i + 1}</span>
                  <div><div className="text-sm text-white font-semibold">{c.name}</div><div className="text-[10px] text-zinc-500">{c.territory ? `Controls ${c.territory}` : 'No territory'}</div></div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-gold-400 text-sm">{fmt(c.treasury)}</span>
                  {!myMembership && <button onClick={() => joinClan(c.id)} className="px-3 py-1.5 rounded-lg bg-curse-500/15 text-curse-300 text-xs font-bold border border-curse-500/30">Join</button>}
                </div>
              </div>
            ))}
          </div>
        </section>

        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="max-w-sm w-full glass-strong rounded-3xl border border-curse-500/40 p-5">
                <div className="flex items-center justify-between mb-4"><h3 className="font-display font-bold text-white">Create Clan</h3><button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button></div>
                <input type="text" value={clanName} onChange={(e) => setClanName(e.target.value)} placeholder="Clan name (e.g. Zenin Family)" className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm focus:border-curse-500/50 outline-none" />
                <div className="text-xs text-zinc-500 mt-2">Cost: {fmt(CLAN_COST)} 🧬 DNA. You will become the clan leader.</div>
                <button onClick={createClan} className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-curse-500 to-curse-700 text-white font-bold text-sm shadow-curse-glow">Create for {fmt(CLAN_COST)} 🧬 DNA</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
