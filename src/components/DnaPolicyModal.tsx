import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Shield, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function DnaPolicyModal({ isOpen, onClose }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="max-w-sm w-full glass-strong rounded-3xl border border-gold-500/50 p-6 text-center shadow-gold-glow">
            <div className="w-12 h-12 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-gold-500/40"><Lock className="w-6 h-6 text-gold-400" /></div>
            <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider mb-3">🧬 DNA Withdrawal Notice</h3>
            <div className="rounded-xl bg-ink-800 p-3 border border-ink-700 text-left text-xs text-zinc-300 space-y-2.5 mb-5">
              <div className="flex gap-2"><AlertCircle className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" /><p><strong>Pre-DEX Asset:</strong> 🧬 DNA is currently operating as an internal ecosystem token in its IDO phase.</p></div>
              <div className="flex gap-2"><Shield className="w-4 h-4 text-curse-400 shrink-0 mt-0.5" /><p>External blockchain withdrawals remain <strong>LOCKED</strong> until the official public DEX listing on BNB Smart Chain (BSC) via PancakeSwap.</p></div>
              <div className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-jade-400 shrink-0 mt-0.5" /><p>You can freely use internal 🧬 DNA for Gacha Summons, Vault Mining, or internal Infinity Exchange trading.</p></div>
            </div>
            <div className="rounded-xl bg-ink-800 p-3 border border-ink-700 text-left mb-5">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">On-Chain Listing Roadmap</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-jade-400" /><span className="text-zinc-400"><strong className="text-jade-400">Phase 1 (Current):</strong> Internal match engine, zero gas, instant execution.</span></div>
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gold-400" /><span className="text-zinc-400"><strong className="text-gold-400">Phase 2 (IDO):</strong> Public presale, USDT liquidity on PancakeSwap V2 (BNB Chain).</span></div>
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-curse-400" /><span className="text-zinc-400"><strong className="text-curse-300">Phase 3:</strong> Full on-chain DEX. Balances claimable to BNB (BSC) wallets via MetaMask.</span></div>
              </div>
            </div>
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-gradient-to-r from-curse-500 to-curse-700 text-white font-bold text-xs uppercase tracking-widest shadow-curse-glow">I Understand</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

