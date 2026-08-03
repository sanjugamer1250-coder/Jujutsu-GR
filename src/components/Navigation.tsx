import { Link, useLocation } from 'wouter';
import { Coins, Zap, ShieldHalf, Swords, BookOpen, Store, Wallet, Home, User, Users, Skull, Eye, Link2, Receipt, Sparkles, LifeBuoy, Shield, Crown, HelpCircle, Gamepad2, Users as UsersIcon, Trophy } from 'lucide-react';
import { useDnaBalance, useCursedEnergy } from '@/lib/hooks';
import { fmt } from '@/lib/ui';

export function Header() {
  const dna = useDnaBalance();
  const energy = useCursedEnergy();
  const [location] = useLocation();
  const hideBal = location === '/trade' || location === '/admin';

  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-curse-500/20">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-curse-500 to-energy-500 flex items-center justify-center shadow-curse-glow group-hover:shadow-curse-glow-lg transition-shadow">
            <span className="font-display font-black text-white text-sm">JC</span>
          </div>
          <div className="leading-none">
            <div className="font-display font-bold text-sm tracking-wider text-glow">JUJUTSU</div>
            <div className="text-[10px] text-curse-300/70 tracking-[0.2em] uppercase">Clash Arena</div>
          </div>
        </Link>
        {!hideBal && (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-800/80 border border-curse-500/25 shadow-curse-glow">
              <Coins className="w-4 h-4 text-gold-400" />
              <span className="font-mono font-semibold text-sm text-gold-400">{fmt(dna)}</span>
              <span className="text-[10px] text-gold-400/60 font-medium">🧬 DNA</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-800/80 border border-energy-500/25">
              <Zap className="w-4 h-4 text-energy-400" />
              <span className="font-mono font-semibold text-sm text-energy-400">{fmt(energy)}</span>
              <span className="text-[10px] text-energy-400/60 font-medium">CE</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

const NAV = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/characters', label: 'Summon', icon: Zap },
  { to: '/roster', label: 'Roster', icon: UsersIcon },
  { to: '/story', label: 'Story', icon: BookOpen },
  { to: '/battle', label: 'Battle', icon: Swords },
  { to: '/store', label: 'Store', icon: Store },
  { to: '/wallet', label: 'Vault', icon: Wallet },
  { to: '/clans', label: 'Clans', icon: Users },
  { to: '/raid', label: 'Raid', icon: Skull },
  { to: '/arena', label: 'Arena', icon: Eye },
  { to: '/referrals', label: 'Vows', icon: Link2 },
  { to: '/ledger', label: 'Ledger', icon: Receipt },
  { to: '/tengen-ai', label: 'Tengen', icon: Sparkles },
  { to: '/support', label: 'Support', icon: LifeBuoy },
  { to: '/kyc', label: 'KYC', icon: Shield },
  { to: '/faq', label: 'FAQ', icon: HelpCircle },
  { to: '/moba', label: 'Legends 5v5', icon: Gamepad2 },
  { to: '/ranks', label: 'Ranks', icon: Trophy },
  { to: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const [location] = useLocation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 sm:hidden">
      <div className="glass-strong border-t border-curse-500/25 px-1 py-1.5">
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar">
          {NAV.map((item) => {
            const active = location === item.to;
            const Icon = item.icon;
            return (
              <Link key={item.to} href={item.to} className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg transition-all min-w-[52px] ${active ? 'text-curse-300 text-glow' : 'text-zinc-500'}`}>
                <Icon className={`w-5 h-5 ${active ? 'drop-shadow-[0_0_6px_rgba(124,65,255,0.7)]' : ''}`} />
                <span className="text-[9px] font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function SideNav() {
  const [location] = useLocation();
  return (
    <aside className="hidden sm:flex fixed left-0 top-14 bottom-0 w-16 flex-col items-center py-4 gap-1 glass-strong border-r border-curse-500/20">
      {NAV.map((item) => {
        const active = location === item.to;
        const Icon = item.icon;
        return (
          <Link key={item.to} href={item.to} className={`relative flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl transition-all w-12 ${active ? 'bg-curse-500/15 text-curse-300 shadow-curse-glow' : 'text-zinc-500 hover:text-curse-300'}`}>
            <Icon className="w-5 h-5" />
            <span className="text-[8px] font-medium tracking-wide">{item.label}</span>
            {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-curse-400 shadow-curse-glow" />}
          </Link>
        );
      })}
    </aside>
  );
}
