import { useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Lock, Check, ChevronLeft, Shield, Zap, Coins, TrendingUp, KeyRound, User, Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { supabase, getPlayerId, getPlayerName, setPlayerName } from '@/lib/supabase';
import { REGIONAL_TAX_RULES, getTaxRule, setStoredCountry, setVaultPasskey, setKycTier } from '@/lib/regional';
import { pushToast } from '@/lib/ui';

export default function Register() {
  const playerId = getPlayerId();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(getPlayerName());
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('GLOBAL');
  const [passkey, setPasskey] = useState('');
  const [passkeyConfirm, setPasskeyConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activeRule = getTaxRule(country);

  const finishRegistration = async () => {
    if (passkey.length < 4) { pushToast('Passkey must be at least 4 digits.', 'error'); return; }
    if (passkey !== passkeyConfirm) { pushToast('Passkeys do not match.', 'error'); return; }
    if (!agree) { pushToast('You must agree to the Terms of Service.', 'error'); return; }
    setSubmitting(true);
    try {
      setStoredCountry(country);
      await setVaultPasskey(passkey);
      setKycTier(1); // Tier 1: Novice (email/telegram verified)
      setPlayerName(displayName || 'Sorcerer');
      // Upsert to Supabase
      await supabase.from('player_balances').upsert({
        player_id: playerId,
        display_name: displayName || 'Sorcerer',
        country_code: country,
        kyc_tier: 1,
        dna: 1000,
        cursed_energy: 100,
      });
      pushToast('Account created! Welcome to Jujutsu Clash Arena.', 'success');
      window.location.href = '/';
    } catch {
      pushToast('Registration failed. Try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = ['Identity', 'Country', 'Passkey', 'Review'];

  return (
    <div className="min-h-screen bg-domain flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-curse-500 to-curse-700 items-center justify-center shadow-curse-glow-lg mb-3"><Zap className="w-7 h-7 text-white" /></div>
          <h1 className="font-display font-black text-2xl text-white text-glow">Jujutsu Clash Arena</h1>
          <p className="text-xs text-zinc-500 mt-1">Unified Gaming & Trading Ecosystem</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6 px-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${i <= step ? 'bg-curse-500 text-white' : 'bg-ink-800 text-zinc-600'}`}>{i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}</div>
              {i < steps.length - 1 && <div className={`w-8 h-0.5 mx-0.5 ${i < step ? 'bg-curse-500' : 'bg-ink-700'}`} />}
            </div>
          ))}
        </div>

        <div className="glass-strong rounded-3xl border border-curse-500/30 p-5">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="identity" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center gap-2 mb-2"><User className="w-4 h-4 text-curse-300" /><h2 className="font-display font-bold text-white text-sm">Create Your Identity</h2></div>
                <div><label className="text-xs text-zinc-400 mb-1.5 block">Display Name</label><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Sorcerer name" className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm focus:border-curse-500/50 outline-none" /></div>
                <div><label className="text-xs text-zinc-400 mb-1.5 block">Email (for Tier 1 verification)</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm focus:border-curse-500/50 outline-none" /></div>
                <p className="text-[11px] text-zinc-500">Your Omni-Wallet ID: <span className="font-mono text-curse-300">{playerId}</span></p>
                <button onClick={() => setStep(1)} className="w-full py-3 rounded-xl bg-gradient-to-r from-curse-500 to-curse-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-curse-glow">Continue <ArrowRight className="w-4 h-4" /></button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="country" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center gap-2 mb-2"><Globe className="w-4 h-4 text-curse-300" /><h2 className="font-display font-bold text-white text-sm">Select Residence Country</h2></div>
                <p className="text-xs text-zinc-500">Platform fees and taxes are configured based on your region's regulations.</p>
                <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm font-semibold focus:border-curse-500/50 outline-none">
                  {REGIONAL_TAX_RULES.map((r) => <option key={r.code} value={r.code}>{r.flag} {r.country} ({r.region})</option>)}
                </select>
                <div className="rounded-xl bg-ink-800 p-3 border border-ink-700 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-zinc-500">Platform Trading Fee:</span><span className="font-mono font-bold text-curse-300">{(activeRule.platformFee * 100).toFixed(2)}%</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Regional Compliance Tax:</span><span className="font-mono font-bold text-gold-400">{(activeRule.taxRate * 100).toFixed(2)}%</span></div>
                  <div className="border-t border-ink-700 pt-2 flex justify-between font-bold"><span className="text-white">Total Fee Per Trade:</span><span className="font-mono text-jade-400">{((activeRule.platformFee + activeRule.taxRate) * 100).toFixed(2)}%</span></div>
                </div>
                <div className="flex gap-2"><button onClick={() => setStep(0)} className="px-4 py-3 rounded-xl glass border border-ink-700 text-zinc-400 font-semibold text-sm">Back</button><button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-curse-500 to-curse-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-curse-glow">Continue <ArrowRight className="w-4 h-4" /></button></div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="passkey" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center gap-2 mb-2"><KeyRound className="w-4 h-4 text-curse-300" /><h2 className="font-display font-bold text-white text-sm">Set Vault Passkey</h2></div>
                <p className="text-xs text-zinc-500">This 4+ digit passkey protects every withdrawal and sensitive transaction. You'll be asked for it before moving funds.</p>
                <div><label className="text-xs text-zinc-400 mb-1.5 block">Vault Passkey (4+ digits)</label><input type="password" value={passkey} onChange={(e) => setPasskey(e.target.value)} placeholder="••••••" className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm font-mono focus:border-curse-500/50 outline-none" /></div>
                <div><label className="text-xs text-zinc-400 mb-1.5 block">Confirm Passkey</label><input type="password" value={passkeyConfirm} onChange={(e) => setPasskeyConfirm(e.target.value)} placeholder="••••••" className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm font-mono focus:border-curse-500/50 outline-none" /></div>
                <div className="flex gap-2"><button onClick={() => setStep(1)} className="px-4 py-3 rounded-xl glass border border-ink-700 text-zinc-400 font-semibold text-sm">Back</button><button onClick={() => { if (passkey.length < 4) { pushToast('Passkey must be 4+ digits.', 'error'); return; } if (passkey !== passkeyConfirm) { pushToast('Passkeys do not match.', 'error'); return; } setStep(3); }} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-curse-500 to-curse-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-curse-glow">Continue <ArrowRight className="w-4 h-4" /></button></div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-jade-400" /><h2 className="font-display font-bold text-white text-sm">Review & Confirm</h2></div>
                <div className="rounded-xl bg-ink-800 p-4 border border-ink-700 space-y-2.5 text-xs">
                  <Row label="Display Name" value={displayName || 'Sorcerer'} />
                  <Row label="Omni-Wallet ID" value={playerId} mono />
                  <Row label="Country" value={`${activeRule.flag} ${activeRule.country}`} />
                  <Row label="KYC Tier" value="Tier 1: Novice" />
                  <Row label="Total Trade Fee" value={`${((activeRule.platformFee + activeRule.taxRate) * 100).toFixed(2)}%`} color="text-jade-400" />
                  <Row label="Vault Passkey" value="Set ✓" color="text-jade-400" />
                </div>
                <label className="flex items-start gap-2 text-xs text-zinc-400 cursor-pointer">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-curse-500" />
                  <span>I agree to the Terms of Service. 🧬 DNA is a utility token for in-game progression. External withdrawals are locked during the Pre-DEX / IDO phase until public TON listing.</span>
                </label>
                <div className="flex gap-2"><button onClick={() => setStep(2)} className="px-4 py-3 rounded-xl glass border border-ink-700 text-zinc-400 font-semibold text-sm">Back</button><button onClick={finishRegistration} disabled={submitting || !agree} className={`flex-1 py-3 rounded-xl font-bold text-sm ${agree && !submitting ? 'bg-gradient-to-r from-jade-500 to-jade-600 text-white' : 'bg-ink-800 text-zinc-600'}`}>{submitting ? 'Creating...' : 'Create Account'}</button></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center mt-4"><Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400">Skip for now</Link></div>
      </motion.div>
    </div>
  );
}

function Row({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return <div className="flex justify-between"><span className="text-zinc-500">{label}</span><span className={`${mono ? 'font-mono' : 'font-semibold'} ${color || 'text-white'}`}>{value}</span></div>;
}
