/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#020617', 900: '#05050a', 850: '#0a0a0f', 800: '#0f0f17',
          700: '#14141f', 600: '#1c1c2b', 500: '#262638',
        },
        curse: {
          50: '#f3f0ff', 100: '#e9e2ff', 200: '#d4c6ff', 300: '#b79dff',
          400: '#9a6fff', 500: '#7c41ff', 600: '#6322e6', 700: '#4d18b3',
          800: '#3a1285', 900: '#270a5c',
        },
        energy: { 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2' },
        gold: { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
        blood: { 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#991b1b', 800: '#7f1d1d', 900: '#450a0a' },
        jade: { 400: '#4ade80', 500: '#22c55e', 600: '#16a34a' },
        obsidian: { 900: '#020617', 800: '#0a0f1e', 700: '#0f172a' },
      },
      fontFamily: {
        display: ['"Cinzel"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'curse-glow': '0 0 20px rgba(124,65,255,0.45)',
        'curse-glow-lg': '0 0 40px rgba(124,65,255,0.55)',
        'energy-glow': '0 0 20px rgba(6,182,212,0.45)',
        'energy-glow-lg': '0 0 40px rgba(6,182,212,0.55)',
        'gold-glow': '0 0 20px rgba(245,158,11,0.45)',
        'gold-glow-lg': '0 0 40px rgba(245,158,11,0.55)',
        'blood-glow': '0 0 20px rgba(239,68,68,0.45)',
        'blood-glow-lg': '0 0 40px rgba(239,68,68,0.55)',
        'neon-blue': '0 0 15px rgba(34,211,238,0.6), 0 0 30px rgba(34,211,238,0.3), inset 0 0 10px rgba(34,211,238,0.15)',
        'neon-red': '0 0 15px rgba(239,68,68,0.6), 0 0 30px rgba(239,68,68,0.3), inset 0 0 10px rgba(239,68,68,0.15)',
        'neon-purple': '0 0 15px rgba(124,65,255,0.6), 0 0 30px rgba(124,65,255,0.3), inset 0 0 10px rgba(124,65,255,0.15)',
      },
      keyframes: {
        'pulse-glow': {
          '0%,100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        'float': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'flicker': {
          '0%,100%': { opacity: '1' },
          '45%': { opacity: '0.85' }, '50%': { opacity: '0.4' }, '55%': { opacity: '0.9' },
        },
        'slash-in': {
          '0%': { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)', opacity: '0' },
          '40%': { clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 100%)', opacity: '1' },
          '100%': { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', opacity: '1' },
        },
        'domain-expand': {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(180deg)', opacity: '0.8' },
          '100%': { transform: 'scale(1) rotate(360deg)', opacity: '1' },
        },
        'cursed-pulse-blue': {
          '0%,100%': { boxShadow: '0 0 15px rgba(34,211,238,0.4), 0 0 30px rgba(34,211,238,0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(34,211,238,0.7), 0 0 50px rgba(34,211,238,0.4)' },
        },
        'cursed-pulse-red': {
          '0%,100%': { boxShadow: '0 0 15px rgba(239,68,68,0.4), 0 0 30px rgba(239,68,68,0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(239,68,68,0.7), 0 0 50px rgba(239,68,68,0.4)' },
        },
        'typewriter': {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'flicker': 'flicker 3s ease-in-out infinite',
        'slash-in': 'slash-in 0.5s ease-out forwards',
        'domain-expand': 'domain-expand 0.8s ease-out forwards',
        'cursed-pulse-blue': 'cursed-pulse-blue 2s ease-in-out infinite',
        'cursed-pulse-red': 'cursed-pulse-red 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
