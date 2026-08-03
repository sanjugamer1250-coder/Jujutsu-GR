import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { HelpCircle, ChevronLeft, Lock, TrendingUp, Pickaxe, Coins, Shield, Zap, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FAQItem { q: string; a: string; icon: typeof HelpCircle; }

const FAQS: FAQItem[] = [
  { q: 'What is Jujutsu Clash Arena?', a: 'Jujutsu Clash Arena is an anime-themed Web3 hero collector and trading game. Players summon sorcerers, battle through PvE story chapters, earn passive rewards via Hardware Vault staking, and trade crypto assets on the built-in Infinity Exchange.', icon: Zap },
  { q: 'Why can\'t I withdraw 🧬 DNA to my external crypto wallet?', a: '🧬 DNA is currently in its Pre-DEX IDO stage. To protect the token\'s economic stability and prevent early dumping, external withdrawals for 🧬 DNA are locked. You can freely use 🧬 DNA inside the app for Gacha Summons, Vault Mining, or trade it internally against USDT on the Infinity Exchange.', icon: Lock },
  { q: 'When will 🧬 DNA be listed on public exchanges?', a: '🧬 DNA will officially migrate on-chain to public decentralized exchanges (DEXs like STON.fi) following the completion of the Public IDO Presale. Once listed, internal 🧬 DNA balances will become claimable to external TON Web3 wallets.', icon: TrendingUp },
  { q: 'How do I deposit and withdraw real cryptocurrency?', a: 'Navigate to the Hardware Vault, select Deposit, and choose your currency (USDT, BNB, ETH, TON, or Fiat Card). To withdraw external crypto, ensure your account is upgraded to Tier 2 KYC, enter your destination wallet address, and authorize the transfer with your Vault Passkey.', icon: Coins },
  { q: 'Why is there a tax deduction on my Infinity Exchange trades?', a: 'Tax deductions are automatically calculated based on the Country of Residence selected during registration. These fees cover local regulatory compliance, network maintenance, and platform treasury backing.', icon: Shield },
  { q: 'How does Hardware Vault Staking work?', a: 'Staking DNA into the Vault increases your mining rate (e.g., 0.5 DNA / min). Selecting longer lock-up periods (7, 14, or 30 days) yields higher APY multipliers and unlocks access to competitive PvP arenas.', icon: Pickaxe },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-domain">
      <div className="sticky top-0 z-40 glass-strong border-b border-curse-500/20">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></Link>
          <HelpCircle className="w-5 h-5 text-curse-300" />
          <div className="font-display font-bold text-white">Help Center & FAQ</div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <section className="relative overflow-hidden rounded-3xl border-gradient p-6">
          <div className="absolute -top-16 -right-8 w-48 h-48 rounded-full bg-curse-500/20 blur-3xl animate-pulse-glow" />
          <div className="relative">
            <div className="flex items-center gap-2 text-curse-300/80 text-xs tracking-[0.3em] uppercase mb-2"><HelpCircle className="w-3.5 h-3.5" /> Comprehensive Guide</div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white text-glow">Frequently Asked Questions</h1>
            <p className="text-zinc-400 text-sm mt-2 max-w-lg">Everything you need to know about Jujutsu Clash Arena — from gacha mechanics to crypto withdrawals and staking.</p>
          </div>
        </section>

        <section className="space-y-2">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            const Icon = item.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`glass rounded-2xl border overflow-hidden ${isOpen ? 'border-curse-500/30' : 'border-ink-700'}`}>
                <button onClick={() => setOpen(isOpen ? null : i)} className="w-full flex items-center gap-3 p-4 text-left">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isOpen ? 'bg-curse-500/15' : 'bg-ink-800'}`}><Icon className={`w-4 h-4 ${isOpen ? 'text-curse-300' : 'text-zinc-500'}`} /></div>
                  <span className="flex-1 text-sm font-semibold text-white">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <motion.div initial={false} animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }} className="overflow-hidden">
                  <div className="px-4 pb-4 pl-16 text-sm text-zinc-400 leading-relaxed">{item.a}</div>
                </motion.div>
              </motion.div>
            );
          })}
        </section>

        <section className="glass rounded-2xl p-4 border border-jade-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-jade-500/15 flex items-center justify-center"><HelpCircle className="w-5 h-5 text-jade-400" /></div>
            <div className="flex-1"><div className="font-display font-bold text-white text-sm">Still have questions?</div><div className="text-xs text-zinc-500">Chat with Master Tengen AI or submit a support ticket.</div></div>
            <div className="flex gap-2">
              <Link href="/tengen-ai" className="px-3 py-2 rounded-lg bg-curse-500/15 text-curse-300 text-xs font-semibold border border-curse-500/30">Ask AI</Link>
              <Link href="/support" className="px-3 py-2 rounded-lg bg-jade-500/15 text-jade-400 text-xs font-semibold border border-jade-500/30">Ticket</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
