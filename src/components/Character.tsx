import React, { useState } from 'react';
import { motion } from 'framer-motion';

type Aura = 'blue' | 'red' | 'purple' | 'gold' | 'cyan' | 'none';

type Props = {
  name?: string;
  src?: string; // expected to be a path like /assets/characters/slug.avif (we'll derive webp/jpg fallbacks)
  size?: number; // px
  aura?: Aura;
  className?: string;
  upcoming?: boolean;
};

export function Character({ name, src, size = 220, aura = 'purple', className = '', upcoming = false }: Props) {
  // Respect prefers-reduced-motion
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [errored, setErrored] = useState(false);

  const auraClass =
    aura === 'blue' ? 'neon-border-blue/40 animate-aura-spin' :
    aura === 'red' ? 'neon-border-red/40 animate-aura-spin' :
    aura === 'gold' ? 'shadow-gold-glow animate-aura-spin' :
    aura === 'cyan' ? 'shadow-neon-blue animate-aura-spin' :
    aura === 'none' ? '' : 'neon-border-purple/40 animate-aura-spin';

  // Build fallback filenames from the provided src by stripping extension
  const base = src ? src.replace(/\.[^.\/]+$/, '') : '';
  const avif = base ? `${base}.avif` : '';
  const webp = base ? `${base}.webp` : '';
  const jpg = base ? `${base}.jpg` : '';

  // If an error occurred trying to load the image, fall back to upcoming svg
  const showFallback = errored || (!src && upcoming);
  const fallbackSrc = '/assets/characters/upcoming.svg';

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

      {showFallback ? (
        <div
          className={`w-[${size}px] h-[${size}px] bg-ink-800 flex items-center justify-center rounded-lg text-zinc-500 text-sm font-semibold`}
          style={{ width: size, height: size }}
        >
          <img src={fallbackSrc} alt={name} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
        </div>
      ) : (
        <picture>
          {avif && <source srcSet={avif} type="image/avif" />}
          {webp && <source srcSet={webp} type="image/webp" />}
          <img
            src={jpg || src}
            alt={name}
            width={size}
            height={size}
            decoding="async"
            loading="lazy"
            onError={() => setErrored(true)}
            className={`w-[${size}px] h-[${size}px] object-cover rounded-lg select-none pointer-events-none will-change-transform ${!prefersReduced ? 'animate-char-idle' : ''}`}
            style={{ backfaceVisibility: 'hidden' }}
          />
        </picture>
      )}
    </motion.div>
  );
}

export default Character;
