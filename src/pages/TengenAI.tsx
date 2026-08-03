import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronLeft, Send, BookOpen, LifeBuoy, X, Crown } from 'lucide-react';
import { supabase, getPlayerId } from '@/lib/supabase';
import { pushToast } from '@/lib/ui';

interface ChatMsg { id: string; role: 'user' | 'assistant'; content: string; ts: number; }

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tengen-ai`;
const HEADERS = { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };

const SUGGESTIONS_LORE = [
  'I keep losing to Mahito in Chapter 4, here is my roster: Yuji and Nobara. What should I do?',
  'Generate a new Cursed Domain for me to explore',
  'What\'s the best team comp for the Raid Boss?',
];
const SUGGESTIONS_SUPPORT = [
  'Where did my AFK mining rewards go?',
  'How do I unlock PvP?',
  'How do I withdraw my 🧬 DNA to an external wallet?',
];

export default function TengenAI() {
  const playerId = getPlayerId();
  const [mode, setMode] = useState<'lore' | 'support'>('lore');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadHistory(); }, [mode]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const loadHistory = async () => {
    const { data } = await supabase.from('ai_chat_history').select('*').eq('player_id', playerId).eq('context', mode).order('created_at', { ascending: true }).limit(50);
    if (data && data.length > 0) {
      setMessages(data.map((d: { id: string; role: string; content: string; created_at: string }) => ({ id: d.id, role: d.role as 'user' | 'assistant', content: d.content, ts: new Date(d.created_at).getTime() })));
      setShowSuggestions(false);
    } else {
      setMessages([]);
      setShowSuggestions(true);
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput('');
    setShowSuggestions(false);
    const userMsg: ChatMsg = { id: Math.random().toString(36).slice(2), role: 'user', content: text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch(FUNCTION_URL, { method: 'POST', headers: HEADERS, body: JSON.stringify({ playerId, message: text, mode }) });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const aiMsg: ChatMsg = { id: Math.random().toString(36).slice(2), role: 'assistant', content: data.response, ts: Date.now() };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      pushToast('Failed to reach Tengen. Try again.', 'error');
      setMessages((prev) => [...prev, { id: Math.random().toString(36).slice(2), role: 'assistant', content: 'The cursed energy fluctuates... I could not process your request. Please try again.', ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = mode === 'lore' ? SUGGESTIONS_LORE : SUGGESTIONS_SUPPORT;

  return (
    <div className="min-h-screen bg-domain flex flex-col">
      <div className="sticky top-0 z-40 glass-strong border-b border-curse-500/20">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></Link>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-curse-400 to-curse-600 flex items-center justify-center shadow-curse-glow"><Sparkles className="w-4 h-4 text-white" /></div>
          <div className="flex-1"><div className="font-display font-bold text-white text-sm">Master Tengen</div><div className="text-[10px] text-zinc-500">{mode === 'lore' ? 'Lore Master & Strategy Advisor' : 'Support Agent'}</div></div>
          <div className="flex gap-1 p-0.5 rounded-lg bg-ink-800">
            <button onClick={() => setMode('lore')} className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 ${mode === 'lore' ? 'bg-curse-500/20 text-curse-200' : 'text-zinc-500'}`}><BookOpen className="w-3 h-3" /> Lore</button>
            <button onClick={() => setMode('support')} className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 ${mode === 'support' ? 'bg-jade-500/20 text-jade-400' : 'text-zinc-500'}`}><LifeBuoy className="w-3 h-3" /> Support</button>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-curse-400 to-curse-600 flex items-center justify-center mx-auto mb-4 shadow-curse-glow-lg"><Sparkles className="w-8 h-8 text-white" /></motion.div>
              <h2 className="font-display font-bold text-lg text-white">Master Tengen Awaits</h2>
              <p className="text-sm text-zinc-500 mt-1">{mode === 'lore' ? 'Ask for strategy advice, team comps, or request a new Cursed Domain to explore.' : 'Ask any question about the game. I can answer FAQs or escalate to human moderators.'}</p>
            </div>
          )}

          {showSuggestions && messages.length === 0 && (
            <div className="space-y-2 max-w-md mx-auto">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} className="w-full text-left p-3 rounded-xl glass border border-curse-500/20 text-sm text-zinc-400 hover:text-white hover:border-curse-500/40 transition-all">{s}</button>
              ))}
            </div>
          )}

          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl p-3 ${msg.role === 'user' ? 'bg-curse-500/15 border border-curse-500/30' : 'glass border border-ink-700'}`}>
                {msg.role === 'assistant' && <div className="flex items-center gap-1.5 mb-1 text-[10px] text-curse-300/70"><Sparkles className="w-3 h-3" /> Tengen</div>}
                <p className="text-sm text-zinc-200 whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="glass rounded-2xl p-3 border border-ink-700">
                <div className="flex gap-1.5"><span className="w-2 h-2 rounded-full bg-curse-400 animate-bounce" style={{ animationDelay: '0ms' }} /><span className="w-2 h-2 rounded-full bg-curse-400 animate-bounce" style={{ animationDelay: '150ms' }} /><span className="w-2 h-2 rounded-full bg-curse-400 animate-bounce" style={{ animationDelay: '300ms' }} /></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 glass-strong border-t border-curse-500/20 p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(input); }} placeholder={mode === 'lore' ? 'Ask Tengen for advice...' : 'Describe your issue...'} className="flex-1 px-4 py-3 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm focus:border-curse-500/50 outline-none" />
          <button onClick={() => send(input)} disabled={loading || !input.trim()} className={`px-4 py-3 rounded-xl font-bold text-sm ${loading || !input.trim() ? 'bg-ink-800 text-zinc-600' : 'bg-gradient-to-r from-curse-500 to-curse-700 text-white shadow-curse-glow'}`}><Send className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}
