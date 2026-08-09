import React from 'react';
import { motion } from 'framer-motion';

type Props = {
  name?: string;
  src: string;
  size?: number;
  aura?: 'cyan' | 'purple' | 'red' | 'gold' | 'none' | string;
  upcoming?: boolean;
  className?: string;
};

export default function Character({ name, src, size = 220, aura = 'purple', upcoming = false, className = '' }: Props) {
  const auraClass = aura === 'cyan' ? 'aura-cyan' : aura === 'red' ? 'aura-red' : aura === 'gold' ? 'aura-gold' : aura === 'purple' ? 'aura-purple' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.2, 0.9, 0.3, 1] }}
      className={`relative inline-block ${className}`}
      aria-label={name}
    >
      <div className="absolute -z-10 rounded-full pointer-events-none" style={{ width: size * 1.4, height: size * 1.4, left: '50%', transform: 'translateX(-50%) translateY(-6%)' }}>
        <div className={`w-full h-full rounded-full ${auraClass} opacity-90`} />
      </div>

      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        decoding="async"
        loading="lazy"
        className={`will-change-transform transform ${upcoming ? 'grayscale blur-[0.4px] opacity-80' : 'animate-char-idle'} rounded-md select-none pointer-events-none object-cover`}
        style={{ backfaceVisibility: 'hidden' }}
      />

      {upcoming && (
        <div className="absolute inset-0 flex items-end justify-center pb-2">
          <div className="text-[10px] bg-black/60 text-zinc-200 px-2 py-1 rounded-md font-mono">Upcoming</div>
        </div>
      )}
    </motion.div>
  );
}
