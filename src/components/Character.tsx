import React from 'react';
import { motion } from 'framer-motion';

type Aura = 'blue' | 'red' | 'purple' | 'gold' | 'cyan' | 'none';

type Props = {
  name?: string;
  src: string; // path or URL to the character image (webp/png)
  size?: number; // px
  aura?: Aura;
  className?: string;
  upcoming?: boolean;
};

export function Character({ name, src, size = 220, aura = 'purple', className = '', upcoming = false }: Props) {
  // Respect prefers-reduced-motion
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const auraClass =
    aura === 'blue' ? 'neon-border-blue/40 animate-aura-spin' :
    aura === 'red' ? 'neon-border-red/40 animate-aura-spin' :
    aura === 'gold' ? 'shadow-gold-glow animate-aura-spin' :
    aura === 'cyan' ? 'shadow-neon-blue animate-aura-spin' :
    aura === 'none' ? '' : 'neon-border-purple/40 animate-aura-spin';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`relative inline-block ${className}`}
      aria-label={name}
    >
      {/* aura ring */}
      <div
        aria-hidden
        className={`absolute -z-10 rounded-full ${auraClass} pointer-events-none`}
        style={{ width: size * 1.3, height: size * 1.3, left: '50%', transform: 'translateX(-50%) translateY(-6%)', filter: 'blur(14px)' }}
      />

      {upcoming ? (
        <div
          className={`w-[${size}px] h-[${size}px] bg-ink-800 flex items-center justify-center rounded-lg text-zinc-500 text-sm font-semibold`}
          style={{ width: size, height: size }}
        >
          Upcoming
        </div>
      ) : (
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          decoding="async"
          loading="lazy"
          className={`w-[${size}px] h-[${size}px] object-cover rounded-lg select-none pointer-events-none will-change-transform ${!prefersReduced ? 'animate-char-idle' : ''}`}
          style={{ backfaceVisibility: 'hidden' }}
        />
      )}
    </motion.div>
  );
}

export default Character;
