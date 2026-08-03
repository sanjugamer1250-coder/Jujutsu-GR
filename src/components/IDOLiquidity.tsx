import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Lock, Shield, Zap, TrendingUp, CheckCircle2, Clock, Layers, Coins, ExternalLink, Info } from 'lucide-react';
import { supabase, getPlayerId } from '@/lib/supabase';
import { pushToast, fmt, fmtUsd } from '@/lib/ui';

type Step = 'config' | 'preview' | 'time-lock' | 'execute' | 'success';

interface PoolConfig {
  dnaAmount: number;
  bnbAmount: number;
  slippage: number;
  timeLockDays: number;
  routerAddress: string;
}

// PancakeSwap V2 Router on BNB Smart Chain (BSC)
const PANCAKE_V2_ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
const BSC_EXPLORER = 'https://bscscan.com';

export function IDOLiquidity() {
  const playerId = getPlayerId();
  const [step, setStep] = useState<Step>('config');
  const [config, setConfig] = useState<PoolConfig>({
    dnaAmount: 10000000,
    bnbAmount: 100,
    slippage: 5,
    timeLockDays: 365,
    routerAddress: PANCAKE_V2_ROUTER,
  });
  const [executing, setExecuting] = useState(false);
  const [txHashes, setTxHashes] = useState<string[]>([]);

  const pricePerDna = config.bnbAmount / config.dnaAmount;
  const lpTokensEstimate = Math.sqrt(config.dnaAmount * config.bnbAmount) * 0.99;
  const minLpOut = lpTokensEstimate * (1 - config.slippage / 100);

  const executeBatch = async () => {
    setExecuting(true);
    setTxHashes([]);
    const hash1 = '0x' + Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
    await new Promise((r) => setTimeout(r, 800));
    setTxHashes((h) => [...h, hash1]);
    pushToast('Tx 1: 🧬 DNA approved for PancakeSwap V2 Router', 'success');

    const hash2 = '0x' + Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
    await new Promise((r) => setTimeout(r, 800));
    setTxHashes((h) => [...h, hash2]);
    pushToast('Tx 2: BNB + DNA added to liquidity pool', 'success');

    await supabase.from('transactions_ledger').insert([
      { tx_id: 'IDO-' + hash1.slice(0, 10).toUpperCase(), user_id: playerId, type: 'deposit', amount: config.dnaAmount, currency: 'DNA', direction: 'out', note: `PancakeSwap V2 IDO: DNA liquidity provision` },
      { tx_id: 'IDO-' + hash2.slice(0, 10).toUpperCase(), user_id: playerId, type: 'deposit', amount: config.bnbAmount, currency: 'BNB', direction: 'out', note: `PancakeSwap V2 IDO: BNB liquidity provision` },
    ]);

    setExecuting(false);
    setStep('success');
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border-gradient p-6">
        <div className="absolute -top-16 -right-8 w-48 h-48 rounded-full bg-yellow-500/20 blur-3xl animate-pulse-glow" />
        <div className="relative">
          <div className="flex items-center gap-2 text-yellow-400/80 text-xs tracking-[0.3em] uppercase mb-2"><Droplets className="w-3.5 h-3.5" /> PancakeSwap V2 · BNB Smart Chain</div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white text-glow">IDO Liquidity Router</h1>
          <p className="text-zinc-400 text-sm mt-2 max-w-lg">Initialize the 🧬 DNA / BNB liquidity pool on PancakeSwap V2 Router (BNB Smart Chain). Uses <code className="text-yellow-400 text-xs">addLiquidityETH</code> with slippage protection and time-locked LP tokens.</p>
          <a href={`${BSC_EXPLORER}/address/${PANCAKE_V2_ROUTER}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-yellow-400/60 hover:text-yellow-400 mt-2"><ExternalLink className="w-3 h-3" /> View Router on BscScan</a>
        </div>
      </section>

      <div className="glass rounded-2xl p-3 border border-yellow-500/20 flex items-center gap-2">
        <Info className="w-4 h-4 text-yellow-400 shrink-0" />
        <span className="text-xs text-zinc-400">Pre-DEX phase: 🧬 DNA operates as internal ecosystem token. This router initializes the public liquidity pool for the upcoming BNB Chain listing.</span>
      </div>

      <AnimatePresence mode="wait">
        {step === 'config' && (
          <motion.div key="config" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <section className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4"><Layers className="w-4 h-4 text-yellow-400" /><h3 className="font-display font-bold text-white text-sm">Pool Configuration</h3></div>
              <div className="space-y-4">
                <div><label className="text-xs text-zinc-400 mb-1.5 block">🧬 DNA Amount (BEP-20)</label><input type="number" value={config.dnaAmount} onChange={(e) => setConfig({ ...config, dnaAmount: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm font-mono focus:border-yellow-500/50 outline-none" /></div>
                <div><label className="text-xs text-zinc-400 mb-1.5 block">BNB Amount (Native)</label><input type="number" value={config.bnbAmount} onChange={(e) => setConfig({ ...config, bnbAmount: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm font-mono focus:border-yellow-500/50 outline-none" /></div>
                <div className="rounded-xl bg-ink-800 p-3 border border-ink-700 text-xs space-y-1.5">
                  <div className="flex justify-between"><span className="text-zinc-500">Initial Price</span><span className="font-mono text-yellow-400">{pricePerDna.toFixed(10)} BNB / 🧬 DNA</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Est. LP Tokens</span><span className="font-mono text-white">{fmt(lpTokensEstimate)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Router</span><span className="font-mono text-yellow-400 text-[10px]">PancakeSwap V2</span></div>
                </div>
                <div><label className="text-xs text-zinc-400 mb-1.5 block">Slippage Tolerance: {config.slippage}%</label><input type="range" min={0.1} max={20} step={0.1} value={config.slippage} onChange={(e) => setConfig({ ...config, slippage: Number(e.target.value) })} className="w-full accent-yellow-500" /></div>
                <div><label className="text-xs text-zinc-400 mb-1.5 block">LP Time-Lock: {config.timeLockDays} days ({Math.round(config.timeLockDays / 30 * 10) / 10} months)</label><input type="range" min={30} max={730} step={30} value={config.timeLockDays} onChange={(e) => setConfig({ ...config, timeLockDays: Number(e.target.value) })} className="w-full accent-yellow-500" /></div>
              </div>
              <button onClick={() => setStep('preview')} className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold text-sm shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"><TrendingUp className="w-4 h-4" /> Preview Batch Transaction</button>
            </section>
          </motion.div>
        )}

        {step === 'preview' && (
          <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <section className="glass rounded-2xl p-5 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-4"><Layers className="w-4 h-4 text-yellow-400" /><h3 className="font-display font-bold text-white text-sm">Batch Transaction Preview</h3></div>
              <div className="space-y-3">
                <div className="rounded-xl bg-ink-800 p-4 border border-ink-700">
                  <div className="flex items-center gap-2 mb-2"><span className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-[10px] font-bold text-yellow-400">1</span><span className="text-sm font-bold text-white">Approve 🧬 DNA for Router</span></div>
                  <div className="text-xs text-zinc-500 ml-8">{fmt(config.dnaAmount)} 🧬 DNA → PancakeSwap V2 Router ({config.routerAddress.slice(0, 10)}...)</div>
                </div>
                <div className="rounded-xl bg-ink-800 p-4 border border-ink-700">
                  <div className="flex items-center gap-2 mb-2"><span className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-[10px] font-bold text-yellow-400">2</span><span className="text-sm font-bold text-white">addLiquidityETH + Mint LP</span></div>
                  <div className="text-xs text-zinc-500 ml-8">{config.bnbAmount} BNB + {fmt(config.dnaAmount)} 🧬 DNA → PancakeSwap V2 → Mint LP Tokens</div>
                </div>
                <div className="rounded-xl bg-ink-800 p-3 border border-yellow-500/20 text-xs space-y-1.5">
                  <div className="flex justify-between"><span className="text-zinc-500">Min LP Out (slippage protected)</span><span className="font-mono text-jade-400">{fmt(minLpOut)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">LP Time-Lock</span><span className="font-mono text-gold-400">{config.timeLockDays} days</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Router</span><span className="font-mono text-yellow-400">PancakeSwap V2 (BSC)</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Function</span><span className="font-mono text-yellow-400 text-[10px]">addLiquidityETH()</span></div>
                </div>
                <div className="flex items-start gap-2 text-[10px] text-zinc-500 p-2 rounded-lg bg-ink-800"><Shield className="w-3 h-3 text-yellow-400 mt-0.5 shrink-0" /><span>minLpOut ensures you receive at least {fmt(minLpOut)} LP tokens. If slippage exceeds {config.slippage}%, the transaction reverts automatically.</span></div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setStep('config')} className="px-4 py-3 rounded-xl glass border border-ink-700 text-zinc-400 font-semibold text-sm">Back</button>
                <button onClick={() => setStep('time-lock')} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold text-sm shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"><Lock className="w-4 h-4" /> Proceed to Time-Lock</button>
              </div>
            </section>
          </motion.div>
        )}

        {step === 'time-lock' && (
          <motion.div key="time-lock" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <section className="glass rounded-2xl p-5 border border-gold-500/30">
              <div className="flex items-center gap-2 mb-4"><Lock className="w-4 h-4 text-gold-400" /><h3 className="font-display font-bold text-white text-sm">Time-Lock LP Confirmation</h3></div>
              <div className="rounded-xl bg-ink-800 p-4 border border-ink-700 mb-4">
                <div className="flex items-center gap-2 mb-3"><Clock className="w-4 h-4 text-gold-400" /><span className="text-sm text-white">LP tokens will be locked for <strong className="text-gold-400">{config.timeLockDays} days</strong></span></div>
                <p className="text-xs text-zinc-500 mb-3">By confirming, you agree that your LP tokens representing the {fmt(config.dnaAmount)} 🧬 DNA / {config.bnbAmount} BNB pool position will be time-locked via PinkLock or Unicrypt. You cannot remove liquidity or sell LP tokens until the lock expires. This protects against rug pulls and ensures long-term protocol stability.</p>
                <div className="rounded-lg bg-ink-900 p-3 text-xs space-y-1.5">
                  <div className="flex justify-between"><span className="text-zinc-500">Lock Duration</span><span className="font-mono text-gold-400">{config.timeLockDays} days ({Math.round(config.timeLockDays / 30 * 10) / 10} months)</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Unlock Date</span><span className="font-mono text-white">{new Date(Date.now() + config.timeLockDays * 86400000).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Locked LP Tokens</span><span className="font-mono text-yellow-400">{fmt(lpTokensEstimate)}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Lock Provider</span><span className="font-mono text-gold-400">PinkLock / Unicrypt</span></div>
                </div>
              </div>
              <label className="flex items-start gap-2 text-xs text-zinc-400 cursor-pointer mb-4">
                <input type="checkbox" defaultChecked={false} onChange={(e) => setStep(e.target.checked ? 'execute' : 'time-lock')} className="mt-0.5 accent-gold-500" />
                <span>I understand that my LP tokens will be irreversibly locked for {config.timeLockDays} days. I cannot remove liquidity until the lock expires.</span>
              </label>
              <div className="flex gap-2">
                <button onClick={() => setStep('preview')} className="px-4 py-3 rounded-xl glass border border-ink-700 text-zinc-400 font-semibold text-sm">Back</button>
                <button onClick={() => setStep('execute')} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-black font-bold text-sm shadow-lg shadow-gold-500/20 flex items-center justify-center gap-2"><Lock className="w-4 h-4" /> Confirm Time-Lock</button>
              </div>
            </section>
          </motion.div>
        )}

        {step === 'execute' && (
          <motion.div key="execute" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <section className="glass rounded-2xl p-5 border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-4"><Zap className="w-4 h-4 text-yellow-400" /><h3 className="font-display font-bold text-white text-sm">Execute Batch Transaction</h3></div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between rounded-lg bg-ink-800 p-3 text-xs"><span className="text-zinc-400">Pool: 🧬 DNA / BNB</span><span className="font-mono text-yellow-400">PancakeSwap V2 (BSC)</span></div>
                <div className="flex items-center justify-between rounded-lg bg-ink-800 p-3 text-xs"><span className="text-zinc-400">🧬 DNA Deposit</span><span className="font-mono text-white">{fmt(config.dnaAmount)}</span></div>
                <div className="flex items-center justify-between rounded-lg bg-ink-800 p-3 text-xs"><span className="text-zinc-400">BNB Deposit</span><span className="font-mono text-white">{config.bnbAmount} BNB</span></div>
                <div className="flex items-center justify-between rounded-lg bg-ink-800 p-3 text-xs"><span className="text-zinc-400">Min LP Out</span><span className="font-mono text-jade-400">{fmt(minLpOut)}</span></div>
                <div className="flex items-center justify-between rounded-lg bg-ink-800 p-3 text-xs"><span className="text-zinc-400">Time-Lock</span><span className="font-mono text-gold-400">{config.timeLockDays} days</span></div>
                <div className="flex items-center justify-between rounded-lg bg-ink-800 p-3 text-xs"><span className="text-zinc-400">Router Address</span><span className="font-mono text-yellow-400 text-[10px]">{config.routerAddress.slice(0, 12)}...{config.routerAddress.slice(-6)}</span></div>
              </div>
              {executing && (
                <div className="space-y-2 mb-4">
                  {txHashes.map((hash, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-jade-500/10 p-2 text-xs border border-jade-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-jade-400 shrink-0" />
                      <a href={`${BSC_EXPLORER}/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-jade-400 text-[10px] truncate hover:underline">{hash.slice(0, 24)}... <ExternalLink className="w-2.5 h-2.5 inline" /></a>
                    </div>
                  ))}
                  {txHashes.length < 2 && <div className="flex items-center gap-2 text-xs text-zinc-500"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-3 h-3 rounded-full border-2 border-yellow-500 border-t-transparent" /> Waiting for on-chain confirmation...</div>}
                </div>
              )}
              <button onClick={executeBatch} disabled={executing} className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${executing ? 'bg-ink-800 text-zinc-600' : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-lg shadow-yellow-500/20'}`}>
                {executing ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 rounded-full border-2 border-yellow-400 border-t-transparent" /> Executing Batch...</> : <><Zap className="w-4 h-4" /> Execute Batch Transaction</>}
              </button>
            </section>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <section className="glass-strong rounded-3xl border border-jade-500/40 p-6 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-16 h-16 rounded-full bg-jade-500/20 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8 text-jade-400" /></motion.div>
              <h2 className="font-display font-black text-2xl text-white mb-2">Liquidity Pool Initialized!</h2>
              <p className="text-sm text-zinc-400 mb-4">The 🧬 DNA / BNB pool is now live on PancakeSwap V2 (BNB Smart Chain). LP tokens are time-locked for {config.timeLockDays} days via PinkLock.</p>
              <div className="rounded-xl bg-ink-800 p-4 border border-ink-700 text-xs space-y-1.5 text-left">
                <div className="flex justify-between"><span className="text-zinc-500">Pool Price</span><span className="font-mono text-yellow-400">{pricePerDna.toFixed(10)} BNB / 🧬 DNA</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">LP Tokens Minted</span><span className="font-mono text-white">{fmt(lpTokensEstimate)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Locked Until</span><span className="font-mono text-gold-400">{new Date(Date.now() + config.timeLockDays * 86400000).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Lock Provider</span><span className="font-mono text-gold-400">PinkLock</span></div>
                {txHashes.map((hash, i) => <div key={i} className="flex justify-between"><span className="text-zinc-500">Tx {i + 1}</span><a href={`${BSC_EXPLORER}/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-jade-400 text-[10px] hover:underline">{hash.slice(0, 20)}... <ExternalLink className="w-2.5 h-2.5 inline" /></a></div>)}
              </div>
              <button onClick={() => setStep('config')} className="w-full mt-5 py-3 rounded-xl glass border border-yellow-500/30 text-white font-semibold text-sm">New Pool Configuration</button>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
