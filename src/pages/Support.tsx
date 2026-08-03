import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeBuoy, ChevronLeft, Send, Check, AlertCircle, Clock, MessageSquare, X, Sparkles, Shield } from 'lucide-react';
import { supabase, getPlayerId } from '@/lib/supabase';
import { pushToast } from '@/lib/ui';

interface Ticket {
  id: string; player_id: string; subject: string; message: string;
  ai_response: string | null; status: string; escalated: boolean; created_at: string; resolved_at: string | null;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tengen-ai`;
const HEADERS = { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };

const FAQ_SUBJECTS = [
  'Missing AFK mining rewards',
  'Cannot unlock PvP Arena',
  'Withdrawal / cash-out question',
  'Gacha pull rates question',
  'VIP Sorcerer Pass',
  'Referral / Binding Vow system',
  'Other (escalate to human moderator)',
];

export default function Support() {
  const playerId = getPlayerId();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    const { data } = await supabase.from('support_tickets').select('*').eq('player_id', playerId).order('created_at', { ascending: false }).limit(20);
    if (data) setTickets(data as Ticket[]);
  };

  const submitTicket = async () => {
    if (!subject || !message.trim()) { pushToast('Fill in subject and message.', 'error'); return; }
    setSubmitting(true);
    try {
      // Get AI auto-response
      let aiResponse: string | null = null;
      try {
        const res = await fetch(FUNCTION_URL, { method: 'POST', headers: HEADERS, body: JSON.stringify({ playerId, message: `${subject}: ${message}`, mode: 'support' }) });
        if (res.ok) { const data = await res.json(); aiResponse = data.response; }
      } catch { /* AI may fail, ticket still created */ }

      const isEscalated = aiResponse?.includes('escalating') || subject.includes('escalate') || subject === 'Other (escalate to human moderator)';
      const status = isEscalated ? 'escalated' : aiResponse ? 'ai_resolved' : 'open';

      await supabase.from('support_tickets').insert({
        player_id: playerId, subject, message, ai_response: aiResponse, status, escalated: isEscalated,
      });
      pushToast(isEscalated ? 'Ticket escalated to human moderators.' : 'AI resolved your ticket!', isEscalated ? 'info' : 'success');
      setSubject(''); setMessage(''); setShowForm(false);
      loadTickets();
    } catch {
      pushToast('Failed to submit ticket.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-domain">
      <div className="sticky top-0 z-40 glass-strong border-b border-jade-500/20">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></Link>
          <LifeBuoy className="w-5 h-5 text-jade-400" />
          <div className="font-display font-bold text-white">Support Center</div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <section className="relative overflow-hidden rounded-3xl border-gradient p-6">
          <div className="absolute -top-16 -right-8 w-48 h-48 rounded-full bg-jade-500/20 blur-3xl animate-pulse-glow" />
          <div className="relative">
            <div className="flex items-center gap-2 text-jade-400/80 text-xs tracking-[0.3em] uppercase mb-2"><Shield className="w-3.5 h-3.5" /> AI-Powered Support</div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white text-glow">Sorcerer Support</h1>
            <p className="text-zinc-400 text-sm mt-2 max-w-lg">Master Tengen's AI agent answers 80% of questions instantly. If your issue is complex, it escalates to our human moderators in a private Admin group via the Telegram SOS webhook.</p>
          </div>
        </section>

        <section className="glass rounded-2xl p-4 border border-jade-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-jade-500/15 flex items-center justify-center"><Sparkles className="w-5 h-5 text-jade-400" /></div>
            <div className="flex-1"><div className="font-display font-bold text-white text-sm">Ask Tengen AI Directly</div><div className="text-xs text-zinc-500">Get instant answers before submitting a ticket</div></div>
            <Link href="/tengen-ai" className="px-4 py-2 rounded-xl bg-jade-500/15 text-jade-400 text-xs font-bold border border-jade-500/30">Chat Now</Link>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-white text-sm">Your Tickets</h2>
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-jade-500/15 text-jade-400 text-xs font-semibold border border-jade-500/30"><Send className="w-3.5 h-3.5" /> New Ticket</button>
          </div>
          {tickets.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center"><MessageSquare className="w-10 h-10 text-zinc-700 mx-auto mb-2" /><p className="text-sm text-zinc-500">No tickets yet. Submit a ticket if you need help.</p></div>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => (
                <div key={t.id} className="glass rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div><div className="text-sm text-white font-semibold">{t.subject}</div><div className="text-[10px] text-zinc-600">{new Date(t.created_at).toLocaleString()}</div></div>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="text-xs text-zinc-400 mb-2">{t.message}</p>
                  {t.ai_response && (
                    <div className="rounded-lg bg-ink-800 p-3 border border-jade-500/20">
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-jade-400/70"><Sparkles className="w-3 h-3" /> Tengen AI Response</div>
                      <p className="text-xs text-zinc-300">{t.ai_response}</p>
                    </div>
                  )}
                  {t.escalated && <div className="mt-2 flex items-center gap-1.5 text-xs text-blood-400"><AlertCircle className="w-3.5 h-3.5" /> Escalated to human moderators. Join @JujutsuSupportBot on Telegram for updates.</div>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="glass rounded-2xl p-4 border border-curse-500/20">
          <div className="flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-curse-300" /><h3 className="font-display font-bold text-white text-sm">Community Moderators</h3></div>
          <p className="text-xs text-zinc-500">Our top 10 most active players are designated "Special Grade Mods" and receive a monthly 🧬 DNA stipend for moderating the Telegram chat and helping beginners. If your issue is escalated, a mod will respond in the @JujutsuSupportBot channel.</p>
        </section>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="max-w-md w-full glass-strong rounded-3xl border border-jade-500/40 p-5">
                <div className="flex items-center justify-between mb-4"><h3 className="font-display font-bold text-white">Submit Support Ticket</h3><button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button></div>
                <div className="space-y-3">
                  <div><label className="text-xs text-zinc-400 mb-1.5 block">Subject</label><select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm focus:border-jade-500/50 outline-none"><option value="">Select a topic...</option>{FAQ_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                  <div><label className="text-xs text-zinc-400 mb-1.5 block">Describe your issue</label><textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Provide as much detail as possible, including any Transaction IDs..." rows={4} className="w-full px-3 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm focus:border-jade-500/50 outline-none resize-none" /></div>
                  <button onClick={submitTicket} disabled={submitting} className="w-full py-3 rounded-xl bg-gradient-to-r from-jade-500 to-jade-600 text-white font-bold text-sm flex items-center justify-center gap-2">{submitting ? 'Submitting...' : <><Send className="w-4 h-4" /> Submit Ticket</>}</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta: Record<string, { icon: typeof Check; color: string; label: string }> = {
    open: { icon: Clock, color: 'text-gold-400 bg-gold-500/10', label: 'Open' },
    ai_resolved: { icon: Check, color: 'text-jade-400 bg-jade-500/10', label: 'AI Resolved' },
    escalated: { icon: AlertCircle, color: 'text-blood-400 bg-blood-500/10', label: 'Escalated' },
    closed: { icon: Check, color: 'text-zinc-500 bg-ink-800', label: 'Closed' },
  };
  const m = meta[status] || meta.open;
  const Icon = m.icon;
  return <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${m.color}`}><Icon className="w-3 h-3" /> {m.label}</span>;
}
