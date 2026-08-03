import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';

const SUKUNA_IMAGE = 'https://images.alphacoders.com/131/1316277.png';

interface RouteDialogue {
  text: string;
  emoji?: string;
}

const DIALOGUES: Record<string, RouteDialogue> = {
  '/wallet': {
    text: "You think you can survive my domain with empty pockets, brat? Deposit your USDT or 🧬 DNA before I cut you down.",
  },
  '/moba': {
    text: "A 3-lane battleground? Show me if you can actually wield cursed energy, or if you'll drown in the Cursed Jungle.",
  },
  '/admin': {
    text: "Checking your rake, Dna? Ensure the house cut stays at 5%.",
  },
  '/characters': {
    text: "Summoning sorcerers? Let's see if you can pull someone worthy of standing beside the King of Curses.",
  },
  '/store': {
    text: "Buying trinkets and baubles? Power isn't purchased, it's taken. But fine — spend your coins if you must.",
  },
  '/battle': {
    text: "So you wish to fight? Don't bore me. Show me something worth cutting.",
  },
  '/raid': {
    text: "A raid boss? How amusing. Even the strongest curses are insects beneath my feet. Don't embarrass yourself.",
  },
  '/arena': {
    text: "The underground arena? Where the desperate gamble everything? At least you have some survival instinct.",
  },
  '/trade': {
    text: "Trading tokens like a merchant? Pathetic. But accumulate enough and perhaps I'll find you useful.",
  },
  '/referrals': {
    text: "Binding vows? Spreading your influence through others? Smart. Even I respect the art of manipulation.",
  },
  '/kyc': {
    text: "Proving your identity to bureaucrats? How tedious. But even cursed spirits need paperwork in this era, it seems.",
  },
  '/ledger': {
    text: "Reviewing your transactions? A sorcerer who tracks every coin. How... methodical of you.",
  },
  '/tengen-ai': {
    text: "Consulting that immortal fool Tengen for advice? His wisdom is vast, but even he cannot predict where my blade falls.",
  },
  '/clans': {
    text: "Forming a clan? Strength in numbers is a crutch for the weak. But even I had subordinates once.",
  },
  '/story': {
    text: "Following the story of those who oppose me? Entertaining. Learn their weaknesses well, brat.",
  },
};

function getDismissKey(route: string): string {
  return `sukuna_dismissed_${route}`;
}

export function SukunaGuide() {
  const [location] = useLocation();
  const [visible, setVisible] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [currentDialogue, setCurrentDialogue] = useState('');

  const dialogue = DIALOGUES[location];

  useEffect(() => {
    if (!dialogue) { setVisible(false); return; }
    const dismissed = localStorage.getItem(getDismissKey(location));
    if (dismissed === '1') { setVisible(false); return; }
    setVisible(true);
    setCurrentDialogue(dialogue.text);
    setDisplayedText('');
  }, [location, dialogue]);

  // Typewriter effect
  useEffect(() => {
    if (!visible || !currentDialogue) return;
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < currentDialogue.length) {
        setDisplayedText(currentDialogue.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [visible, currentDialogue]);

  const dismiss = useCallback(() => {
    localStorage.setItem(getDismissKey(location), '1');
    setVisible(false);
  }, [location]);

  if (!dialogue) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="fixed bottom-4 right-4 z-[90] max-w-xs sm:max-w-sm"
        >
          <div className="relative glass-strong rounded-2xl overflow-hidden border-2 border-blood-500/50 shadow-blood-glow-lg">
            {/* Malevolent Shrine border glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blood-900/30 via-transparent to-blood-700/20 pointer-events-none" />
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-blood-500/20 blur-2xl animate-pulse-glow pointer-events-none" />

            <div className="relative flex gap-3 p-3">
              {/* Sukuna portrait */}
              <div className="shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-blood-500/60 shadow-blood-glow relative">
                  <img
                    src={SUKUNA_IMAGE}
                    alt="Sukuna"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        '<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blood-700 to-blood-900 text-3xl">👹</div>';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blood-900/60 to-transparent" />
                </div>
              </div>

              {/* Dialogue box */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="font-display font-bold text-blood-300 text-xs tracking-wider">RYOMEN SUKUNA</span>
                  <span className="text-[8px] text-blood-500/60 uppercase tracking-widest">King of Curses</span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-300 leading-relaxed min-h-[3rem]">
                  {displayedText}
                  <span className="inline-block w-0.5 h-3 bg-blood-400 ml-0.5 animate-flicker" />
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={dismiss}
                className="shrink-0 w-6 h-6 rounded-lg bg-ink-800/80 flex items-center justify-center text-zinc-500 hover:text-blood-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
              <span className="text-[8px] text-zinc-600 uppercase tracking-widest">Domain Guide</span>
              <button
                onClick={dismiss}
                className="flex items-center gap-0.5 text-[9px] text-blood-400/70 hover:text-blood-300 transition-colors"
              >
                Skip <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
