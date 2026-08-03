import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Coins, Zap, Swords, BookOpen, Store, Wallet, TrendingUp, ChevronRight, Sparkles, Users, Skull, Eye, Link2, Receipt, LifeBuoy, Shield, Crown, HelpCircle, Gamepad2, Building2, Users as UsersIcon, Trophy } from 'lucide-react';
import { useDnaBalance, useCursedEnergy, useRoster } from '@/lib/hooks';
import { fmt } from '@/lib/ui';
import { CHARACTERS, RARITY_META } from '@/lib/characters';

const TILES = [
  { to: '/characters', label: 'Summon Gacha', desc: 'Pull JJK sorcerers', icon: Zap, color: 'from-curse-500/30 to-curse-700/10', border: 'border-curse-500/40' },
  { to: '/story', label: 'Story Domains', desc: 'Clear PvE chapters', icon: BookOpen, color: 'from-energy-500/30 to-energy-700/10', border: 'border-energy-500/40' },
  { to: '/battle', label: 'Clash Arena', desc: 'Animated PvP combat', icon: Swords, color: 'from-blood-500/30 to-blood-700/10', border: 'border-blood-500/40' },
  { to: '/trade', label: 'Infinity Exchange', desc: 'Binance-style trading', icon: TrendingUp, color: 'from-gold-500/30 to-gold-700/10', border: 'border-gold-500/40' },
  { to: '/store', label: 'Cursed Store', desc: 'Buy CE packs', icon: Store, color: 'from-curse-500/30 to-curse-700/10', border: 'border-curse-500/40' },
  { to: '/wallet', label: 'Hardware Vault', desc: 'Mine & lock 🧬 DNA', icon: Wallet, color: 'from-energy-500/30 to-energy-700/10', border: 'border-energy-500/40' },
  { to: '/clans', label: 'Cursed Clans', desc: 'Guilds & turf wars', icon: Users, color: 'from-blood-500/30 to-blood-700/10', border: 'border-blood-500/40' },
  { to: '/raid', label: 'Raid Boss', desc: 'Server-wide boss', icon: Skull, color: 'from-blood-500/30 to-blood-700/10', border: 'border-blood-500/40' },
  { to: '/arena', label: 'Underground Arena', desc: 'Spectator betting', icon: Eye, color: 'from-gold-500/30 to-gold-700/10', border: 'border-gold-500/40' },
  { to: '/referrals', label: 'Binding Vows', desc: 'Multi-level referrals', icon: Link2, color: 'from-curse-500/30 to-curse-700/10', border: 'border-curse-500/40' },
  { to: '/ledger', label: 'Transaction Ledger', desc: 'Immutable receipts', icon: Receipt, color: 'from-curse-500/30 to-curse-700/10', border: 'border-curse-500/40' },
  { to: '/tengen-ai', label: 'Tengen AI', desc: 'Lore master & advisor', icon: Sparkles, color: 'from-curse-500/30 to-curse-700/10', border: 'border-curse-500/40' },
  { to: '/support', label: 'Support Center', desc: 'AI-powered help desk', icon: LifeBuoy, color: 'from-jade-500/30 to-jade-700/10', border: 'border-jade-500/40' },
  { to: '/kyc', label: 'KYC Verification', desc: 'Unlock withdrawals', icon: Shield, color: 'from-curse-500/30 to-curse-700/10', border: 'border-curse-500/40' },
  { to: '/faq', label: 'Help Center & FAQ', desc: 'All your questions answered', icon: HelpCircle, color: 'from-curse-500/30 to-curse-700/10', border: 'border-curse-500/40' },
  { to: '/moba', label: 'Jujutsu Legends 5v5', desc: 'Competitive MOBA · eSports', icon: Gamepad2, color: 'from-rose-500/30 to-rose-700/10', border: 'border-rose-500/40' },
  { to: '/roster', label: 'Roster Viewer', desc: 'Heroes, Villains & Shikigami', icon: UsersIcon, color: 'from-curse-500/30 to-curse-700/10', border: 'border-curse-500/40' },
  { to: '/ranks', label: 'Rank Progression', desc: 'Tier ladder & rewards', icon: Trophy, color: 'from-gold-500/30 to-gold-700/10', border: 'border-gold-500/40' },
  { to: '/admin', label: 'Domain Nodes', desc: 'Buy real yield franchise nodes', icon: Building2, color: 'from-rose-500/30 to-rose-700/10', border: 'border-rose-500/40' },
];

export default function Home() {
  const dna = useDnaBalance();
  const energy = useCursedEnergy();
  const roster = useRoster();
  const owned = CHARACTERS.filter((c) => roster.includes(c.id));
  const top = owned.slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl border-gradient p-6 sm:p-8">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-curse-500/20 blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-energy-500/15 blur-3xl animate-pulse-glow" />
        <div className="relative">
          <div className="flex items-center gap-2 text-curse-300/80 text-xs tracking-[0.3em] uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Web3 Jujutsu Arena
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl leading-tight">
            <span className="shimmer-text">Jujutsu Clash</span><br />
            <span className="text-white text-glow">Arena</span>
          </h1>
          <p className="text-zinc-400 mt-3 max-w-md text-sm sm:text-base">Summon sorcerers, clear cursed domains, and trade 🧬 DNA on the Infinity Exchange — a Web3 gaming economy built for the community.</p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link href="/characters" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-curse-500 to-curse-700 text-white font-semibold text-sm shadow-curse-glow hover:shadow-curse-glow-lg transition-shadow flex items-center gap-2">
              <Zap className="w-4 h-4" /> Start Summoning
            </Link>
            <Link href="/trade" className="px-5 py-2.5 rounded-xl glass border border-curse-500/30 text-curse-200 font-semibold text-sm hover:border-curse-400/50 transition-colors flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Open Exchange
            </Link>
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-3 gap-3">
        <StatCard icon={Coins} label="🧬 DNA" value={fmt(dna)} color="text-gold-400" border="border-gold-500/30" />
        <StatCard icon={Zap} label="Cursed Energy" value={fmt(energy)} color="text-energy-400" border="border-energy-500/30" />
        <StatCard icon={Swords} label="Roster" value={`${owned.length}/${CHARACTERS.length}`} color="text-curse-300" border="border-curse-500/30" />
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {TILES.map((t, i) => {
          const Icon = t.icon;
          return (
            <motion.div key={t.to} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
              <Link href={t.to} className={`block rounded-2xl p-4 bg-gradient-to-br ${t.color} border ${t.border} hover:scale-[1.02] transition-transform group`}>
                <div className="flex items-start justify-between">
                  <Icon className="w-6 h-6 text-white/90" />
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="mt-3 font-display font-bold text-white text-sm">{t.label}</div>
                <div className="text-[11px] text-white/60">{t.desc}</div>
              </Link>
            </motion.div>
          );
        })}
      </section>

      {top.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-white">Your Top Sorcerers</h2>
            <Link href="/profile" className="text-xs text-curse-300 hover:text-curse-200">View all →</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {top.map((c) => {
              const meta = RARITY_META[c.rarity];
              return (
                <div key={c.id} className={`rounded-2xl overflow-hidden glass border border-curse-500/20 ${meta.glow}`}>
                  <div className="aspect-square bg-ink-800 relative">
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
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

function StatCard({ icon: Icon, label, value, color, border }: { icon: typeof Coins; label: string; value: string; color: string; border: string }) {
  return (
    <div className={`glass rounded-2xl p-3 border ${border}`}>
      <Icon className={`w-4 h-4 ${color} mb-1.5`} />
      <div className={`font-mono font-bold text-lg ${color}`}>{value}</div>
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}
