import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swords, Zap, Trophy, Star, TrendingUp, RotateCcw, Shield, Hash, Lock, CheckCircle2, UserPlus, Camera } from 'lucide-react';
import { useDnaBalance, useCursedEnergy, useRoster, useTxLog, useStorageSync } from '@/lib/hooks';
import { CHARACTERS } from '@/lib/characters';
import { fmt, pushToast } from '@/lib/ui';
import { readJSON, STORAGE_KEYS } from '@/lib/economy';
import { supabase } from '@/lib/supabase';
import { useAccount } from 'wagmi';

export default function Profile() {
  const dna = useDnaBalance();
  const energy = useCursedEnergy();
  const roster = useRoster();
  const txLog = useTxLog();
  useStorageSync();
  const owned = CHARACTERS.filter((c) => roster.includes(c.id));
  const [tab, setTab] = useState<'roster' | 'stats' | 'history'>('roster');

  // Database Profile State
  const { address, isConnected } = useAccount();
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [newUsername, setNewUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const battles = readJSON<{ result: 'win' | 'loss' }[]>(STORAGE_KEYS.battleHistory, []);
  const wins = battles.filter((b) => b.result === 'win').length;
  const winRate = battles.length ? Math.round((wins / battles.length) * 100) : 0;
  const collectionRate = Math.round((owned.length / CHARACTERS.length) * 100);
  const power = owned.reduce((s, c) => s + c.atk + c.def + c.hp / 10 + c.speed, 0);

  // Fetch profile from Supabase on load
  useEffect(() => {
    async function fetchProfile() {
      if (!address) {
        setLoadingProfile(false);
        setProfile(null);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', address)
        .single();
        
      if (data) setProfile(data);
      setLoadingProfile(false);
    }
    fetchProfile();
  }, [address]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !newUsername.trim()) return;
    setIsRegistering(true);

    try {
      const { error } = await supabase.from('profiles').insert([
        {
          username: newUsername.trim(),
          wallet_address: address,
          kyc_status: 'unverified'
        }
      ]);

      if (error) throw error;
      
      pushToast('Profile created successfully!', 'success');
      // Instantly update the UI with the exact name
      setProfile({ username: newUsername.trim(), wallet_address: address, kyc_status: 'unverified', avatar_url: null });
    } catch (err: any) {
      pushToast(err.message || 'Failed to create profile. Username might be taken.', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      if (!event.target.files || event.target.files.length === 0 || !address) return;
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${address}_${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      // Get the public URL for the image
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Save URL to the profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('wallet_address', address);
      if (updateError) throw updateError;

      // Update UI immediately
      setProfile({ ...profile, avatar_url: publicUrl });
      pushToast('Profile photo updated!', 'success');
    } catch (error: any) {
      pushToast(error.message || 'Error uploading photo', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl glass-strong border border-curse-500/30 p-6">
        <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-curse-500/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          
          {/* Profile Photo Area */}
          <div className="relative w-20 h-20 rounded-2xl bg-ink-800 flex items-center justify-center border border-curse-500/50 overflow-hidden group shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : profile?.username ? (
              // Auto-generates a unique avatar based on their exact username if no photo is uploaded
              <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${profile.username}`} alt="Avatar" className="w-full h-full object-cover bg-curse-900" />
            ) : (
              <Shield className="w-9 h-9 text-zinc-600" />
            )}

            {/* Upload Overlay (Only shows if they have a profile created) */}
            {profile && (
              <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {uploadingAvatar ? (
                  <RotateCcw className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploadingAvatar} />
              </label>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xs text-curse-300/70 tracking-[0.2em] uppercase">Sorcerer Profile</div>
            <h1 className="font-display font-black text-2xl text-white text-glow truncate">
              {profile ? profile.username : 'Guest Commander'}
            </h1>
            
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded bg-black/40 text-zinc-400 border border-white/5">
                <Hash className="w-3 h-3" /> 
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Wallet Not Connected'}
              </span>
              
              {profile && (
                <span className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded border ${
                  profile.kyc_status === 'approved' ? 'bg-jade-500/20 text-jade-400 border-jade-500/30' :
                  profile.kyc_status === 'pending' ? 'bg-gold-500/20 text-gold-400 border-gold-500/30' :
                  'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                }`}>
                  {profile.kyc_status === 'approved' ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  KYC: {profile.kyc_status}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Registration Flow */}
      {isConnected && !profile && !loadingProfile && (
        <motion.section initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong border border-yellow-500/30 rounded-2xl p-6 bg-yellow-500/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <UserPlus className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Your Account</h2>
              <p className="text-xs text-zinc-400">Register a username to join the leaderboards and unlock the game.</p>
            </div>
          </div>
          
          <form onSubmit={handleRegister} className="flex gap-3">
            <input
              type="text"
              required
              maxLength={16}
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter Username (e.g. SukunaVessel)"
              className="flex-1 bg-ink-900 border border-ink-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-yellow-400"
            />
            <button
              type="submit"
              disabled={isRegistering || !newUsername.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 text-slate-900 font-bold text-sm disabled:opacity-50"
            >
              {isRegistering ? 'Saving...' : 'Register'}
            </button>
          </form>
        </motion.section>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['roster', 'stats', 'history'].map((t) => (
          <button 
            key={t} 
            onClick={() => setTab(t as any)} 
            className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
              tab === t ? 'bg-gradient-to-r from-curse-500 to-curse-700 text-white shadow-curse-glow' : 'glass text-zinc-400 hover:text-white border border-transparent hover:border-zinc-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {tab === 'roster' && (
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
             {owned.length > 0 ? (
               owned.map(c => (
                  <div key={c.id} className="glass rounded-2xl p-4 flex flex-col items-center border border-ink-700">
                     <div className="w-16 h-16 rounded-full bg-ink-800 mb-3 border-2 border-curse-500/50 flex items-center justify-center">
                        <Swords className="w-6 h-6 text-curse-400" />
                     </div>
                     <div className="text-sm font-bold text-white truncate w-full text-center">{c.name}</div>
                     <div className="text-[10px] text-zinc-500 uppercase mt-1">Power: {c.atk + c.def}</div>
                  </div>
               ))
             ) : (
               <div className="col-span-full glass p-8 rounded-2xl text-center border border-dashed border-ink-700">
                 <Shield className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                 <p className="text-sm font-bold text-zinc-400">Your roster is empty.</p>
                 <p className="text-xs text-zinc-500 mt-1">Summon characters to build your team.</p>
               </div>
             )}
           </div>
        )}

        {tab === 'stats' && (
           <div className="grid grid-cols-2 gap-3">
             <div className="glass p-5 rounded-2xl flex flex-col items-center justify-center text-center border border-ink-700">
               <Trophy className="w-6 h-6 text-gold-400 mb-2" />
               <div className="text-3xl font-black text-white">{winRate}%</div>
               <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Win Rate</div>
             </div>
             <div className="glass p-5 rounded-2xl flex flex-col items-center justify-center text-center border border-ink-700">
               <Star className="w-6 h-6 text-curse-400 mb-2" />
               <div className="text-3xl font-black text-white">{collectionRate}%</div>
               <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Collection</div>
             </div>
             <div className="glass p-5 rounded-2xl flex flex-col items-center justify-center text-center col-span-2 border border-ink-700 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-energy-500/10 blur-2xl rounded-full" />
               <Zap className="w-6 h-6 text-energy-400 mb-2 relative z-10" />
               <div className="text-4xl font-black text-white text-glow relative z-10">{fmt(power)}</div>
               <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1 relative z-10">Total Combat Power</div>
             </div>
           </div>
        )}

        {tab === 'history' && (
           <div className="glass rounded-2xl p-4 border border-ink-700 space-y-2">
             {txLog.length === 0 ? (
               <div className="text-center text-zinc-500 py-8 text-sm flex flex-col items-center">
                 <RotateCcw className="w-8 h-8 mb-3 opacity-20" />
                 No recent economy activity.
               </div>
             ) : (
               txLog.slice(0, 10).map((tx, i) => (
                 <div key={i} className="bg-ink-900/50 p-3 rounded-xl flex items-center justify-between border border-ink-800">
                   <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-lg ${tx.amount > 0 ? 'bg-jade-500/10' : 'bg-blood-500/10'}`}>
                       {tx.amount > 0 ? <TrendingUp className="w-4 h-4 text-jade-400" /> : <TrendingUp className="w-4 h-4 text-blood-400 rotate-180" />}
                     </div>
                     <div className="text-sm font-semibold text-zinc-300 capitalize">{tx.type.replace('_', ' ')}</div>
                   </div>
                   <div className={`text-sm font-bold ${tx.amount > 0 ? 'text-jade-400' : 'text-blood-400'}`}>
                     {tx.amount > 0 ? '+' : ''}{tx.amount}
                   </div>
                 </div>
               ))
             )}
           </div>
        )}
      </div>
    </div>
  );
}
