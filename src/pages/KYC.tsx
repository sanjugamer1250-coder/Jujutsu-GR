import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronLeft, Check, Lock, Unlock, Crown, Mail, CreditCard, Camera, Clock, X, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { supabase, getPlayerId } from '@/lib/supabase';
import { useApp } from '@/lib/store';
import { KYC_TIERS, getKycTier, setKycTier, getStoredCountry } from '@/lib/regional';
import { pushToast } from '@/lib/ui';

interface KycRecord {
  id: string; player_id: string; tier: number; status: string; document_type: string | null; submitted_at: string;
}

export default function KYC() {
  const playerId = getPlayerId();
  const { updateKycTier } = useApp();
  const [currentTier, setCurrentTier] = useState(getKycTier());
  const [showTier2, setShowTier2] = useState(false);
  const [docType, setDocType] = useState('passport');
  const [submitting, setSubmitting] = useState(false);
  const [records, setRecords] = useState<KycRecord[]>([]);

  useEffect(() => { loadRecords(); }, []);

  const loadRecords = async () => {
    const { data } = await supabase.from('kyc_verifications').select('*').eq('player_id', playerId).order('submitted_at', { ascending: false });
    if (data) setRecords(data as KycRecord[]);
  };

  const submitTier2 = async () => {
    setSubmitting(true);
    try {
      await supabase.from('kyc_verifications').insert({ player_id: playerId, tier: 2, status: 'pending', document_type: docType, provider: 'manual' });
      pushToast('KYC submitted! Verification typically takes 1-24 hours.', 'success');
      setShowTier2(false);
      loadRecords();
    } catch {
      pushToast('Submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const simulateApproval = async () => {
    const pending = records.find((r) => r.status === 'pending');
    if (!pending) return;
    await supabase.from('kyc_verifications').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', pending.id);
    setKycTier(2);
    setCurrentTier(2);
    await supabase.from('player_balances').update({ kyc_tier: 2 }).eq('player_id', playerId);
    await updateKycTier(2);
    pushToast('KYC Tier 2 approved! Full withdrawals unlocked.', 'success');
    loadRecords();
  };

  return (
    <div className="min-h-screen bg-domain">
      <div className="sticky top-0 z-40 glass-strong border-b border-curse-500/20">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></Link>
          <Shield className="w-5 h-5 text-curse-300" />
          <div className="font-display font-bold text-white">KYC Verification</div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <section className="relative overflow-hidden rounded-3xl border-gradient p-6">
          <div className="absolute -top-16 -right-8 w-48 h-48 rounded-full bg-curse-500/20 blur-3xl animate-pulse-glow" />
          <div className="relative">
            <div className="flex items-center gap-2 text-curse-300/80 text-xs tracking-[0.3em] uppercase mb-2"><Shield className="w-3.5 h-3.5" /> Account Verification</div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white text-glow">KYC Tier System</h1>
            <p className="text-zinc-400 text-sm mt-2 max-w-lg">Verify your identity to unlock trading and withdrawal limits. Tier 1 is instant with email/Telegram. Tier 2 requires government ID for full crypto withdrawals.</p>
          </div>
        </section>

        {/* Current Status */}
        <section className="glass rounded-2xl p-4 border border-curse-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentTier >= 1 ? 'bg-jade-500/15' : 'bg-ink-800'}`}>{currentTier >= 1 ? <Check className="w-5 h-5 text-jade-400" /> : <Lock className="w-5 h-5 text-zinc-600" />}</div>
              <div><div className="text-sm text-white font-semibold flex items-center gap-2">Current Tier: {currentTier === 0 ? 'Unverified' : currentTier === 1 ? 'Tier 1 — Novice' : <span className="flex items-center gap-1.5">Tier 2 — Special Grade <CheckCircle2 className="w-4 h-4 text-jade-400" /> <span className="px-1.5 py-0.5 rounded bg-jade-500/20 text-jade-400 text-[9px] font-bold">VERIFIED</span></span>}</div><div className="text-[10px] text-zinc-500">{currentTier === 2 ? 'Full access enabled — withdrawals unlocked' : currentTier === 1 ? 'Internal trading only, no withdrawals' : 'Please complete registration'}</div></div>
            </div>
            {currentTier < 2 && <button onClick={() => setShowTier2(true)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-curse-500 to-curse-700 text-white font-bold text-xs shadow-curse-glow">Upgrade</button>}
          </div>
        </section>

        {/* Tier Cards */}
        <section className="grid sm:grid-cols-2 gap-3">
          {KYC_TIERS.map((t) => {
            const unlocked = currentTier >= t.tier;
            return (
              <div key={t.tier} className={`glass rounded-2xl p-4 border ${unlocked ? 'border-jade-500/30' : 'border-ink-700'}`}>
                <div className="flex items-center gap-2 mb-3">{t.tier === 2 ? <Crown className="w-4 h-4 text-gold-400" /> : <Mail className="w-4 h-4 text-curse-300" />}<h3 className="font-display font-bold text-white text-sm">Tier {t.tier}: {t.name}</h3>{unlocked && <Check className="w-4 h-4 text-jade-400 ml-auto" />}</div>
                <div className="space-y-2 text-xs">
                  <div><div className="text-zinc-500 uppercase text-[9px] tracking-wider mb-0.5">Requirements</div><div className="text-zinc-300">{t.requirements}</div></div>
                  <div><div className="text-zinc-500 uppercase text-[9px] tracking-wider mb-0.5">Game Access</div><div className="text-zinc-300">{t.gameAccess}</div></div>
                  <div><div className="text-zinc-500 uppercase text-[9px] tracking-wider mb-0.5">Trading & Withdrawals</div><div className="text-zinc-300">{t.tradingLimits}</div></div>
                </div>
              </div>
            );
          })}
        </section>

        {/* KYC History */}
        {records.length > 0 && (
          <section className="glass rounded-2xl p-4">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Verification History</div>
            <div className="space-y-2">{records.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-ink-800 p-3 text-xs">
                <div className="flex items-center gap-2"><span className={`w-1.5 h-1.5 rounded-full ${r.status === 'approved' ? 'bg-jade-400' : r.status === 'pending' ? 'bg-gold-400 animate-pulse' : 'bg-blood-400'}`} /><span className="text-white">Tier {r.tier}</span><span className="text-zinc-500">{r.document_type || 'Email'}</span></div>
                <div className="flex items-center gap-2"><span className={`font-semibold capitalize ${r.status === 'approved' ? 'text-jade-400' : r.status === 'pending' ? 'text-gold-400' : 'text-blood-400'}`}>{r.status}</span><span className="text-zinc-600">{new Date(r.submitted_at).toLocaleDateString()}</span></div>
              </div>
            ))}</div>
            {records.some((r) => r.status === 'pending') && <button onClick={simulateApproval} className="w-full mt-3 py-2 rounded-lg bg-ink-700 text-zinc-400 text-xs font-semibold border border-ink-600">Simulate Approval (Demo)</button>}
          </section>
        )}

        {/* Withdrawal Rules */}
        <section className="glass rounded-2xl p-4 border border-gold-500/20">
          <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-gold-400" /><h3 className="font-display font-bold text-white text-sm">Withdrawal Safety Limits</h3></div>
          <div className="space-y-2 text-xs text-zinc-400">
            <div className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-jade-400 mt-0.5 shrink-0" /><span>Withdrawals under $100 process automatically via server hot-wallets.</span></div>
            <div className="flex items-start gap-2"><Lock className="w-3.5 h-3.5 text-gold-400 mt-0.5 shrink-0" /><span>Withdrawals over $100 require Tier 2 KYC and a 1-hour security delay.</span></div>
            <div className="flex items-start gap-2"><AlertCircle className="w-3.5 h-3.5 text-blood-400 mt-0.5 shrink-0" /><span>🧬 DNA external withdrawals are LOCKED during Pre-DEX / IDO phase.</span></div>
          </div>
        </section>

        {/* Vault Passkey Policy */}
        <section className="glass rounded-2xl p-4 border border-curse-500/20">
          <div className="flex items-center gap-2 mb-2"><KeyRound className="w-4 h-4 text-curse-300" /><h3 className="font-display font-bold text-white text-sm">Vault Passkey Security</h3></div>
          <div className="space-y-2 text-xs text-zinc-400">
            <div className="flex items-start gap-2"><Shield className="w-3.5 h-3.5 text-curse-300 mt-0.5 shrink-0" /><span>All external withdrawals, staking unstakes, and sensitive account modifications require a mandatory 4+ character Vault Passkey.</span></div>
            <div className="flex items-start gap-2"><Lock className="w-3.5 h-3.5 text-gold-400 mt-0.5 shrink-0" /><span>The platform does not store plaintext passkeys. Passkeys are SHA-256 hashed before storage.</span></div>
            <div className="flex items-start gap-2"><AlertCircle className="w-3.5 h-3.5 text-blood-400 mt-0.5 shrink-0" /><span>Lost passkeys can only be reset through Tier 2 Identity Verification.</span></div>
          </div>
        </section>

        {/* Fair Play & Anti-Sybil Policy */}
        <section className="glass rounded-2xl p-4 border border-blood-500/20">
          <div className="flex items-center gap-2 mb-3"><Shield className="w-4 h-4 text-blood-400" /><h3 className="font-display font-bold text-white text-sm">Fair Play & Anti-Sybil Policy</h3></div>
          <div className="space-y-3 text-xs text-zinc-400">
            <div>
              <div className="text-zinc-300 font-semibold mb-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-blood-400" /> Bot & Script Prohibition</div>
              <p>The use of automated scripts, multi-account farming, memory-injection tools, or visual emulators to manipulate AFK Mining or Airdrops is strictly prohibited.</p>
            </div>
            <div>
              <div className="text-zinc-300 font-semibold mb-1 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-blood-400" /> Account Suspension</div>
              <p>Accounts flagged for Sybil activity by our automated security telemetry will suffer immediate revocation of Vault Mining yields, forfeiture of unvested Airdrops, and permanent profile suspension.</p>
            </div>
          </div>
        </section>

        <AnimatePresence>
          {showTier2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTier2(false)} className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="max-w-md w-full glass-strong rounded-3xl border border-curse-500/40 p-5">
                <div className="flex items-center justify-between mb-4"><h3 className="font-display font-bold text-white">Tier 2 Verification</h3><button onClick={() => setShowTier2(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button></div>
                <div className="space-y-3">
                  <div><label className="text-xs text-zinc-400 mb-1.5 block">Document Type</label>
                    <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm focus:border-curse-500/50 outline-none">
                      <option value="passport">Passport</option><option value="drivers_license">Driver's License</option><option value="national_id">National ID</option>
                    </select>
                  </div>
                  <div className="rounded-xl bg-ink-800 p-4 border border-dashed border-ink-600 text-center"><Camera className="w-8 h-8 text-zinc-600 mx-auto mb-2" /><p className="text-xs text-zinc-500">Upload a photo of your {docType.replace('_', ' ')}</p><p className="text-[10px] text-zinc-600 mt-1">In production, this integrates with Sumsub / Persona API</p></div>
                  <div className="rounded-xl bg-ink-800 p-4 border border-dashed border-ink-600 text-center"><Camera className="w-8 h-8 text-zinc-600 mx-auto mb-2" /><p className="text-xs text-zinc-500">Take a selfie for liveness check</p></div>
                  <button onClick={submitTier2} disabled={submitting} className="w-full py-3 rounded-xl bg-gradient-to-r from-curse-500 to-curse-700 text-white font-bold text-sm shadow-curse-glow">{submitting ? 'Submitting...' : 'Submit for Verification'}</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
