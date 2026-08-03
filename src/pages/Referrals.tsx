import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Link2, Users, Coins, Copy, Check, ChevronLeft, TrendingUp, Gift, UserPlus, Infinity as InfinityIcon } from 'lucide-react';
import { supabase, getPlayerId, getPlayerName } from '@/lib/supabase';
import { getReferralCode, getReferredBy, setReferredBy, getReferralEarnings } from '@/lib/economy';
import { useReferralEarnings, useDnaBalance, useStorageSync } from '@/lib/hooks';
import { fmt, pushToast } from '@/lib/ui';

interface ReferralRow {
  disciple_id: string;
  level: number;
  total_earned: number;
  created_at: string;
}

export default function Referrals() {
  const playerId = getPlayerId();
  const playerName = getPlayerName();
  const code = getReferralCode();
  const earnings = useReferralEarnings();
  const dna = useDnaBalance();
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [urlParam, setUrlParam] = useState('');
  useStorageSync();

  useEffect(() => {
    // Check URL for referral code
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) { setReferredBy(ref); setUrlParam(ref); }
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    const { data } = await supabase.from('referrals').select('*').eq('referrer_id', playerId);
    if (data) setReferrals(data as ReferralRow[]);
    const { count } = await supabase.from('players').select('*', { count: 'exact', head: true });
    if (count) setPlayerCount(count);
  };

  const inviteLink = `https://t.me/JujutsuStrikeBot/arena?startapp=ref_${code}`;
  const copyLink = () => { navigator.clipboard?.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 1500); pushToast('Invite link copied!', 'success'); };

  const shareTelegram = () => {
    const text = `Join me in Jujutsu Clash Arena! Use my Binding Vow invite and get 500 🧬 DNA free: ${inviteLink}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const directCount = referrals.filter((r) => r.level === 1).length;
  const indirectCount = referrals.filter((r) => r.level === 2).length;

  return (
    <div className="min-h-screen bg-domain">
      <div className="sticky top-0 z-40 glass-strong border-b border-curse-500/20">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></Link>
          <Link2 className="w-5 h-5 text-curse-300" />
          <div className="font-display font-bold text-white">Binding Vow Referrals</div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <section className="relative overflow-hidden rounded-3xl border-gradient p-6">
          <div className="absolute -top-16 -right-8 w-48 h-48 rounded-full bg-curse-500/20 blur-3xl animate-pulse-glow" />
          <div className="relative">
            <div className="flex items-center gap-2 text-curse-300/80 text-xs tracking-[0.3em] uppercase mb-2"><Link2 className="w-3.5 h-3.5" /> Multi-Level Affiliate System</div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white text-glow">Binding Vow Engine</h1>
            <p className="text-zinc-400 text-sm mt-2 max-w-lg">Invite sorcerers with your unique Binding Vow link. Earn <span className="text-gold-400 font-semibold">5%</span> of your Disciples' AFK mining forever, and <span className="text-gold-400 font-semibold">2%</span> from their Disciples. Build a downline of passive 🧬 DNA income.</p>
          </div>
        </section>

        {urlParam && (
          <section className="glass rounded-2xl p-4 border border-jade-500/40 flex items-center gap-3">
            <Gift className="w-5 h-5 text-jade-400" />
            <div className="flex-1"><div className="text-sm font-semibold text-jade-400">You were referred by {urlParam}!</div><div className="text-xs text-zinc-500">You'll receive 500 🧬 DNA when you start playing.</div></div>
          </section>
        )}

        <section className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4"><UserPlus className="w-4 h-4 text-curse-300" /><h2 className="font-display font-bold text-white">Your Binding Vow Link</h2></div>
          <div className="flex items-center gap-2 rounded-xl bg-ink-800 p-3 border border-ink-700">
            <code className="flex-1 font-mono text-xs text-curse-300 truncate">{inviteLink}</code>
            <button onClick={copyLink} className="text-zinc-500 hover:text-white">{copied ? <Check className="w-4 h-4 text-jade-400" /> : <Copy className="w-4 h-4" />}</button>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={shareTelegram} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-curse-500 to-curse-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-curse-glow"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg> Share to Telegram</button>
            <button onClick={copyLink} className="px-4 py-2.5 rounded-xl glass border border-ink-700 text-zinc-300 font-semibold text-sm flex items-center gap-2"><Copy className="w-4 h-4" /> Copy</button>
          </div>
          <div className="mt-3 text-center text-xs text-zinc-500">Your referral code: <span className="font-mono font-bold text-curse-300">{code}</span></div>
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Coins} label="Total Earned" value={`${fmt(earnings)}`} color="text-gold-400" />
          <StatCard icon={Users} label="Disciples" value={String(directCount)} color="text-curse-300" />
          <StatCard icon={InfinityIcon} label="Indirect" value={String(indirectCount)} color="text-energy-400" />
          <StatCard icon={TrendingUp} label="Network" value={String(playerCount)} color="text-jade-400" />
        </section>

        <section className="glass rounded-2xl p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Your Downline</div>
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No disciples yet. Share your Binding Vow link to start earning passive 🧬 DNA!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {referrals.map((r) => (
                <div key={r.disciple_id} className="flex items-center justify-between rounded-xl bg-ink-800 p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.level === 1 ? 'bg-curse-500/15' : 'bg-energy-500/15'}`}>
                      <span className="text-xs font-bold text-white">L{r.level}</span>
                    </div>
                    <div>
                      <div className="text-sm text-white font-mono">{r.disciple_id}</div>
                      <div className="text-[10px] text-zinc-500">Joined {new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-gold-400 text-sm">{fmt(r.total_earned)}</div>
                    <div className="text-[10px] text-zinc-500">earned</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="glass rounded-2xl p-4 border border-curse-500/20">
          <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-gold-400" /><h3 className="font-display font-bold text-white text-sm">How Commissions Work</h3></div>
          <div className="space-y-3 text-xs text-zinc-400">
            <div className="flex gap-3"><div className="w-8 h-8 rounded-lg bg-curse-500/15 flex items-center justify-center shrink-0"><span className="font-bold text-curse-300">5%</span></div><div><div className="text-white font-semibold">Direct Disciple (Level 1)</div><div>When someone joins with your link, you earn 5% of their AFK mining output — forever.</div></div></div>
            <div className="flex gap-3"><div className="w-8 h-8 rounded-lg bg-energy-500/15 flex items-center justify-center shrink-0"><span className="font-bold text-energy-400">2%</span></div><div><div className="text-white font-semibold">Indirect Disciple (Level 2)</div><div>When your Disciple invites someone, you also earn 2% of that person's mining output.</div></div></div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Coins; label: string; value: string; color: string }) {
  return <div className="glass rounded-2xl p-3 text-center"><Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} /><div className={`font-mono font-bold text-lg ${color}`}>{value}</div><div className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</div></div>;
}
