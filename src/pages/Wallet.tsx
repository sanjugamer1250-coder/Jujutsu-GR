import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Coins, Lock, Unlock, Pickaxe, Clock, ArrowDownToLine, ArrowUpFromLine, X, Shield, Bitcoin, DollarSign, KeyRound, TrendingUp, Zap, Crown, Swords, Check } from 'lucide-react';
import { useDnaBalance, useStorageSync, useVipUntil, usePvpUnlocked } from '@/lib/hooks';
import { readNumber, writeValue, readJSON, writeJSON, STORAGE_KEYS, addDna, getDna, logTx, isVipActive, isPvpUnlocked, unlockPvp } from '@/lib/economy';
import { verifyPasskey, hasPasskey } from '@/lib/regional';
import { fmt, fmtUsd, useInterval, pushToast } from '@/lib/ui';
import { DnaPolicyModal } from '@/components/DnaPolicyModal';

const MINE_RATE = 0.5;
const MINE_TICK_MS = 5000;

interface Deposit { id: string; currency: 'USD' | 'USDT' | 'USDC' | 'BNB' | 'ETH'; amount: number; type: 'digital' | 'physical'; ts: number; txHash: string; }

export default function WalletPage() {
  const dna = useDnaBalance();
  const stake = readNumber(STORAGE_KEYS.vaultStake, 0);
  const lockUntil = readNumber(STORAGE_KEYS.vaultLockUntil, 0);
  const lastMine = readNumber(STORAGE_KEYS.vaultLastMine, Date.now());
  const deposits = readJSON<Deposit[]>(STORAGE_KEYS.vaultDeposits, []);
  const vipUntil = useVipUntil();
  const pvpUnlocked = usePvpUnlocked();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [pendingAction, setPendingAction] = useState<'unstake' | 'withdraw' | null>(null);
  const [unlocked, setUnlocked] = useState(true);
  useStorageSync();
  const locked = Date.now() < lockUntil;
  const vipActive = Date.now() < vipUntil;
  const effectiveMineRate = vipActive ? MINE_RATE * 2 : MINE_RATE;
  const totalDepositUsd = deposits.reduce((s, d) => { const rate = d.currency === 'USD' ? 1 : d.currency === 'USDT' || d.currency === 'USDC' ? 1 : d.currency === 'BNB' ? 600 : 3500; return s + d.amount * rate; }, 0);

  useInterval(() => {
    if (stake <= 0) return;
    const now = Date.now();
    const elapsedMin = (now - lastMine) / 60000;
    if (elapsedMin >= (MINE_TICK_MS / 60000)) {
      const reward = stake * effectiveMineRate * (MINE_TICK_MS / 60000) * 12;
      if (reward > 0) { addDna(reward); writeValue(STORAGE_KEYS.vaultLastMine, now); }
    }
  }, MINE_TICK_MS);

  const handleUnlockPvp = () => {
    if (stake < 200) { pushToast('Stake at least 200 🧬 DNA in the vault to unlock PvP.', 'error'); return; }
    if (!locked) { pushToast('Lock your vault for at least 7 days to unlock PvP.', 'error'); return; }
    unlockPvp();
    pushToast('PvP Arena unlocked! You can now battle other sorcerers.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <section className="relative overflow-hidden rounded-3xl border-gradient p-6">
        <div className="absolute -top-16 -right-8 w-48 h-48 rounded-full bg-energy-500/20 blur-3xl animate-pulse-glow" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-energy-500 to-energy-600 flex items-center justify-center shadow-energy-glow"><Wallet className="w-6 h-6 text-white" /></div>
          <div><h1 className="font-display font-black text-2xl text-white">Hardware Vault</h1><p className="text-xs text-zinc-400">Stake 🧬 DNA to AFK-mine more. Lock funds to unlock PvP. Deposit any currency to invest.</p></div>
        </div>
      </section>

      {vipActive && (
        <section className="glass rounded-2xl p-3 border border-gold-500/40 flex items-center gap-3">
          <Crown className="w-5 h-5 text-gold-400" />
          <div className="flex-1"><div className="text-sm font-semibold text-gold-400">VIP Sorcerer Pass Active</div><div className="text-[11px] text-zinc-500">Double mining rate active! Expires in {Math.ceil((vipUntil - Date.now()) / 86400000)}d</div></div>
        </section>
      )}

      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4"><span className="text-xs text-zinc-500 uppercase tracking-wider">Vault Balance</span><button onClick={() => setUnlocked(!unlocked)} className="text-zinc-500 hover:text-energy-400">{unlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}</button></div>
        <div className="flex items-end gap-2"><Coins className="w-8 h-8 text-gold-400 mb-1" /><span className="font-mono font-black text-4xl text-gold-400">{fmt(dna)}</span><span className="text-sm text-gold-400/60 mb-1.5">🧬 DNA</span></div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-xl bg-ink-800 p-3"><div className="text-[10px] text-zinc-500 uppercase">Staked</div><div className="font-mono font-bold text-energy-400">{fmt(stake)}</div></div>
          <div className="rounded-xl bg-ink-800 p-3"><div className="text-[10px] text-zinc-500 uppercase">Mining Rate</div><div className="font-mono font-bold text-jade-400">{effectiveMineRate}/min {vipActive && <span className="text-gold-400 text-[9px]">2x</span>}</div></div>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3"><Pickaxe className="w-4 h-4 text-energy-400" /><h3 className="font-display font-bold text-white text-sm">AFK Mining</h3></div>
          <p className="text-xs text-zinc-500 mb-3">Stake 🧬 DNA into the vault to passively mine more 🧬 DNA over time.{vipActive && ' VIP doubles your rate!'}</p>
          <div className="flex gap-2"><input type="number" placeholder="Amount" id="stake-input" className="flex-1 px-3 py-2 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm font-mono focus:border-energy-500/50 outline-none" /><button onClick={() => { const amt = parseFloat((document.getElementById('stake-input') as HTMLInputElement).value); if (!amt || amt <= 0) { pushToast('Enter a valid amount.', 'error'); return; } if (getDna() < amt) { pushToast('Not enough 🧬 DNA.', 'error'); return; } writeValue(STORAGE_KEYS.dnaBalance, getDna() - amt); writeValue(STORAGE_KEYS.vaultStake, stake + amt); logTx('deposit', amt, 'out', 'Staked to vault'); pushToast(`Staked ${amt} 🧬 DNA`, 'success'); }} className="px-4 py-2 rounded-xl bg-gradient-to-r from-energy-500 to-energy-600 text-white font-bold text-sm">Stake</button></div>
          {stake > 0 && <button onClick={() => { if (!hasPasskey()) { pushToast('Set a Vault Passkey in Registration first.', 'error'); return; } setPendingAction('unstake'); setShowPasskeyPrompt(true); }} className="w-full mt-2 py-2 rounded-xl glass border border-ink-700 text-zinc-400 text-xs hover:text-white">Unstake All ({fmt(stake)})</button>}
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3"><Lock className="w-4 h-4 text-curse-300" /><h3 className="font-display font-bold text-white text-sm">Lock Balance</h3></div>
          <p className="text-xs text-zinc-500 mb-3">Lock your 🧬 DNA to earn bonus mining rewards and unlock the PvP Arena.</p>
          <div className="grid grid-cols-3 gap-2">{[7, 14, 30].map((days) => (<button key={days} onClick={() => { writeValue(STORAGE_KEYS.vaultLockUntil, Date.now() + days * 86400000); pushToast(`Locked for ${days} days`, 'success'); }} disabled={locked} className={`py-2 rounded-xl text-xs font-semibold ${locked ? 'bg-ink-800 text-zinc-600' : 'bg-curse-500/15 text-curse-300 border border-curse-500/30'}`}>{days}d</button>))}</div>
          {locked && <div className="mt-2 text-xs text-curse-300 flex items-center gap-1"><Clock className="w-3 h-3" /> Unlocks in {Math.ceil((lockUntil - Date.now()) / 86400000)}d</div>}
        </div>
      </section>

      <section className={`glass rounded-2xl p-4 border ${pvpUnlocked ? 'border-jade-500/40' : 'border-blood-500/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pvpUnlocked ? 'bg-jade-500/15' : 'bg-blood-500/15'}`}><Swords className={`w-5 h-5 ${pvpUnlocked ? 'text-jade-400' : 'text-blood-400'}`} /></div>
            <div>
              <div className="font-display font-bold text-white text-sm flex items-center gap-2">PvP Arena Access {pvpUnlocked && <span className="px-1.5 py-0.5 rounded bg-jade-500/20 text-jade-400 text-[9px] font-bold">UNLOCKED</span>}</div>
              <div className="text-xs text-zinc-500">{pvpUnlocked ? 'You can enter the Clash Arena and battle other sorcerers.' : 'Stake 200+ 🧬 DNA and lock your vault for 7+ days to unlock PvP.'}</div>
            </div>
          </div>
          {!pvpUnlocked && <button onClick={handleUnlockPvp} className="px-4 py-2 rounded-xl bg-gradient-to-r from-blood-500 to-blood-600 text-white font-bold text-sm">Unlock</button>}
        </div>
      </section>

      <section className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Shield className="w-4 h-4 text-energy-400" /><h3 className="font-display font-bold text-white text-sm">Community Investments</h3></div><div className="flex gap-1"><button onClick={() => setShowPolicy(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold-500/15 text-gold-400 text-xs font-semibold border border-gold-500/30"><ArrowUpFromLine className="w-3.5 h-3.5" /> Withdraw</button><button onClick={() => setShowDeposit(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-energy-500/15 text-energy-400 text-xs font-semibold border border-energy-500/30"><ArrowDownToLine className="w-3.5 h-3.5" /> Deposit</button></div></div>
        <div className="grid grid-cols-2 gap-3 mb-3"><div className="rounded-xl bg-ink-800 p-3"><div className="text-[10px] text-zinc-500 uppercase">Total Deposits</div><div className="font-mono font-bold text-white">{fmtUsd(totalDepositUsd)}</div></div><div className="rounded-xl bg-ink-800 p-3"><div className="text-[10px] text-zinc-500 uppercase">Deposit Count</div><div className="font-mono font-bold text-white">{deposits.length}</div></div></div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {deposits.length === 0 ? <div className="text-sm text-zinc-600 text-center py-4">No deposits yet. Invest in the platform!</div> :
            deposits.map((d) => (<div key={d.id} className="flex items-center justify-between rounded-lg bg-ink-800 p-2.5 text-xs"><div className="flex items-center gap-2">{d.currency === 'USD' ? <DollarSign className="w-3.5 h-3.5 text-jade-400" /> : <Bitcoin className="w-3.5 h-3.5 text-gold-400" />}<span className="text-white font-mono">{d.amount} {d.currency}</span><span className="text-[9px] px-1.5 py-0.5 rounded bg-ink-700 text-zinc-500">{d.type}</span></div><span className="text-zinc-600 font-mono">{d.txHash.slice(0, 10)}…</span></div>))}
        </div>
      </section>
      <AnimatePresence>{showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}</AnimatePresence>
      <DnaPolicyModal isOpen={showPolicy} onClose={() => setShowPolicy(false)} />
      <AnimatePresence>
        {showPasskeyPrompt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowPasskeyPrompt(false); setPasskeyInput(''); }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="max-w-sm w-full glass-strong rounded-3xl border border-curse-500/40 p-5">
              <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><KeyRound className="w-5 h-5 text-curse-300" /><h3 className="font-display font-bold text-white text-sm">Vault Passkey Required</h3></div><button onClick={() => { setShowPasskeyPrompt(false); setPasskeyInput(''); }} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button></div>
              <p className="text-xs text-zinc-500 mb-4">Enter your Vault Passkey to authorize this {pendingAction === 'unstake' ? 'unstake' : 'withdrawal'}. This protects your funds from unauthorized access.</p>
              <input type="password" value={passkeyInput} onChange={(e) => setPasskeyInput(e.target.value)} placeholder="••••••" onKeyDown={async (e) => { if (e.key === 'Enter') { const ok = await verifyPasskey(passkeyInput); if (!ok) { pushToast('Incorrect passkey.', 'error'); return; } if (pendingAction === 'unstake') { writeValue(STORAGE_KEYS.vaultStake, 0); addDna(stake); pushToast(`Unstaked ${fmt(stake)} 🧬 DNA`, 'success'); } setShowPasskeyPrompt(false); setPasskeyInput(''); setPendingAction(null); } }} className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm font-mono focus:border-curse-500/50 outline-none text-center tracking-widest" />
              <button onClick={async () => { const ok = await verifyPasskey(passkeyInput); if (!ok) { pushToast('Incorrect passkey.', 'error'); return; } if (pendingAction === 'unstake') { writeValue(STORAGE_KEYS.vaultStake, 0); addDna(stake); pushToast(`Unstaked ${fmt(stake)} 🧬 DNA`, 'success'); } setShowPasskeyPrompt(false); setPasskeyInput(''); setPendingAction(null); }} className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-curse-500 to-curse-700 text-white font-bold text-sm shadow-curse-glow">Confirm with Passkey</button>
              <p className="text-[10px] text-zinc-600 mt-2 text-center">Lost your passkey? Reset via Tier 2 KYC Verification.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DepositModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'choose' | 'faucet' | 'faucet-done'>('choose');
  const [faucetAmount, setFaucetAmount] = useState(0);

  const FAUCET_DAILY_LIMIT = 100;
  const getFaucetClaimedToday = () => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('faucet_date');
    if (stored !== today) { localStorage.setItem('faucet_date', today); localStorage.setItem('faucet_claimed', '0'); return 0; }
    return parseInt(localStorage.getItem('faucet_claimed') || '0', 10);
  };
  const claimedToday = getFaucetClaimedToday();
  const remaining = FAUCET_DAILY_LIMIT - claimedToday;

  const claimFaucet = () => {
    if (remaining <= 0) { pushToast('Daily faucet limit reached. Come back tomorrow.', 'error'); return; }
    addDna(remaining);
    logTx('deposit', remaining, 'in', `Testnet faucet claim (${remaining} DNA)`);
    localStorage.setItem('faucet_claimed', String(FAUCET_DAILY_LIMIT));
    setFaucetAmount(remaining);
    setStep('faucet-done');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="max-w-sm w-full glass-strong rounded-3xl border border-energy-500/40 p-5">
        <div className="flex items-center justify-between mb-4"><h3 className="font-display font-bold text-white">Deposit Funds</h3><button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button></div>

        {step === 'choose' && (
          <div className="space-y-3">
            <div className="rounded-xl bg-ink-800 p-4 border border-energy-500/20">
              <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-jade-400" /><span className="text-sm font-bold text-white">Deposit via Payment Gateway</span></div>
              <p className="text-xs text-zinc-500 mb-3">Deposit USDT, BNB, ETH, or fiat via card. Funds credit to your Omni-Wallet after blockchain confirmation on BNB Smart Chain.</p>
              <button onClick={() => { pushToast('Redirecting to payment gateway...', 'success'); onClose(); }} className="w-full py-3 rounded-xl bg-gradient-to-r from-jade-500 to-jade-600 text-white font-bold text-sm flex items-center justify-center gap-2"><ArrowDownToLine className="w-4 h-4" /> Open Payment Gateway</button>
            </div>
            <div className="rounded-xl bg-ink-800 p-4 border border-gold-500/20">
              <div className="flex items-center gap-2 mb-2"><Coins className="w-4 h-4 text-gold-400" /><span className="text-sm font-bold text-white">Testnet Faucet</span></div>
              <p className="text-xs text-zinc-500 mb-3">Claim free testnet 🧬 DNA for testing. Hard limit: {FAUCET_DAILY_LIMIT} per day.</p>
              <div className="flex items-center justify-between text-xs mb-2"><span className="text-zinc-500">Claimed today</span><span className="font-mono text-gold-400">{claimedToday}/{FAUCET_DAILY_LIMIT}</span></div>
              <div className="h-1.5 rounded-full bg-ink-700 overflow-hidden mb-3"><div className="h-full bg-gold-500" style={{ width: `${(claimedToday / FAUCET_DAILY_LIMIT) * 100}%` }} /></div>
              <button onClick={claimFaucet} disabled={remaining <= 0} className={`w-full py-3 rounded-xl font-bold text-sm ${remaining > 0 ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-black' : 'bg-ink-800 text-zinc-600'}`}>{remaining > 0 ? `Claim ${remaining} Testnet 🧬 DNA` : 'Daily Limit Reached'}</button>
            </div>
          </div>
        )}

        {step === 'faucet-done' && (
          <div className="text-center py-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-14 h-14 rounded-full bg-jade-500/20 flex items-center justify-center mx-auto mb-3"><TrendingUp className="w-7 h-7 text-jade-400" /></motion.div>
            <div className="font-display font-bold text-white">Faucet Claimed!</div>
            <p className="text-xs text-zinc-500 mt-1">+{faucetAmount} testnet 🧬 DNA added to your balance.</p>
            <button onClick={onClose} className="w-full mt-5 py-3 rounded-xl glass border border-energy-500/30 text-white font-semibold text-sm">Done</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-zinc-500">{label}</span><span className="text-white font-mono">{value}</span></div>;
}
