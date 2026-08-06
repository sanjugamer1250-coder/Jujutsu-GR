// Character roster + gacha RNG for Jujutsu Clash Arena.
// Pull rates per spec: Grade 4 (common) ~83.5%, Special Grade ~1.5%.

export type Rarity = 'Grade4' | 'Grade3' | 'Grade2' | 'Grade1' | 'Special';

export interface Character {
  id: string;
  name: string;
  title: string;
  rarity: Rarity;
  element: 'Taijutsu' | 'Cursed' | 'Shadows' | 'Limitless' | 'Reverse' | 'Fire' | 'Ice' | 'Neutral';
  hp: number;
  atk: number;
  def: number;
  speed: number;
  pullRate: number;
  image?: string; // optional - if not present it's Upcoming
  upcoming?: boolean;
  domain: string;
  skill: { name: string; power: number; desc: string };
}

export const RARITY_META: Record<Rarity, { label: string; color: string; glow: string; mult: number }> = {
  Grade4: { label: 'Grade 4', color: 'text-zinc-300', glow: 'shadow-none', mult: 1 },
  Grade3: { label: 'Grade 3', color: 'text-emerald-400', glow: 'shadow-[0_0_12px_rgba(74,222,128,0.4)]', mult: 1.25 },
  Grade2: { label: 'Grade 2', color: 'text-cyan-400', glow: 'shadow-energy-glow', mult: 1.6 },
  Grade1: { label: 'Grade 1', color: 'text-gold-400', glow: 'shadow-gold-glow', mult: 2.2 },
  Special: { label: 'Special', color: 'text-curse-300', glow: 'shadow-curse-glow-lg', mult: 3.5 },
};

// Image assets are stored under /public/assets/characters/{slug}.jpg
export const CHARACTERS: Character[] = [
  { id: 'yuji', name: 'Yuji Itadori', title: 'Vessel of Sukuna', rarity: 'Grade4', element: 'Taijutsu', hp: 920, atk: 78, def: 62, speed: 88, pullRate: 83.5, image: '/assets/characters/yuji-itadori.jpg', upcoming: false, domain: 'Tokyo', skill: { name: 'Black Flash', power: 120, desc: 'A concentrated cursed technique strike.' } },
  { id: 'megumi', name: 'Megumi Fushiguro', title: 'The Ten Shadows', rarity: 'Grade2', element: 'Shadows', hp: 840, atk: 86, def: 58, speed: 80, pullRate: 8, image: '/assets/characters/megumi-fushiguro.jpg', upcoming: false, domain: 'Tokyo', skill: { name: 'Divine Dogs', power: 110, desc: 'Summon shikigami to attack.' } },
  { id: 'nobara', name: 'Nobara Kugisaki', title: 'Straw Doll Technique', rarity: 'Grade3', element: 'Cursed', hp: 760, atk: 70, def: 50, speed: 82, pullRate: 5, image: '/assets/characters/nobara-kugisaki.jpg', upcoming: false, domain: 'Tokyo', skill: { name: 'Resonance', power: 100, desc: 'Use nails and straw doll to transfix.' } },
  { id: 'gojo', name: 'Satoru Gojo', title: 'The Honored One', rarity: 'Special', element: 'Limitless', hp: 1100, atk: 120, def: 90, speed: 99, pullRate: 1.5, image: '/assets/characters/satoru-gojo.jpg', upcoming: false, domain: 'Tokyo', skill: { name: 'Infinity', power: 200, desc: 'Limitless barrier that repels attacks.' } },
  { id: 'nanami', name: 'Kento Nanami', title: 'Ratio Man', rarity: 'Grade2', element: 'Cursed', hp: 880, atk: 84, def: 72, speed: 70, pullRate: 0.5, image: '/assets/characters/kento-nanami.jpg', upcoming: false, domain: 'Tokyo', skill: { name: 'Ratio Cut', power: 130, desc: 'Exploit weak points to increase damage.' } },
  { id: 'toji', name: 'Toji Fushiguro', title: 'Sorcerer Killer', rarity: 'Grade1', element: 'Taijutsu', hp: 980, atk: 100, def: 80, speed: 95, pullRate: 0.8, image: '/assets/characters/toji-fushiguro.jpg', upcoming: false, domain: 'Underground', skill: { name: 'Heavenly Restriction Strike', power: 160, desc: 'Devastating physical assault.' } },
  { id: 'sukuna', name: 'Ryomen Sukuna', title: 'King of Curses', rarity: 'Special', element: 'Cursed', hp: 1300, atk: 135, def: 95, speed: 92, pullRate: 0.2, image: '/assets/characters/ryomen-sukuna.jpg', upcoming: false, domain: 'Ancient', skill: { name: 'Malevolent Shrine', power: 240, desc: 'Area-wide cursed energy annihilation.' } },
  { id: 'maki', name: 'Maki Zenin', title: 'Heavenly Restriction', rarity: 'Grade2', element: 'Taijutsu', hp: 900, atk: 88, def: 68, speed: 85, pullRate: 0.3, image: '/assets/characters/maki-zenin.jpg', upcoming: false, domain: 'Tokyo', skill: { name: 'Weapon Mastery', power: 140, desc: 'Masterful weapon strikes.' } },
  { id: 'inumaki', name: 'Toge Inumaki', title: 'Cursed Speech', rarity: 'Grade3', element: 'Cursed', hp: 720, atk: 76, def: 48, speed: 78, pullRate: 0.1, image: '/assets/characters/toge-inumaki.jpg', upcoming: false, domain: 'Tokyo', skill: { name: 'Cursed Shout', power: 150, desc: 'Words force enemies to obey.' } },
  { id: 'panda', name: 'Panda', title: 'Intelligent Construct', rarity: 'Grade3', element: 'Neutral', hp: 980, atk: 82, def: 85, speed: 60, pullRate: 0.4, image: '/assets/characters/panda.jpg', upcoming: false, domain: 'Lab', skill: { name: 'Rolling Smash', power: 120, desc: 'Charge and batter enemies.' } },
  { id: 'yuta', name: 'Yuta Okkotsu', title: 'Cursed Hero', rarity: 'Grade1', element: 'Reverse', hp: 1050, atk: 110, def: 88, speed: 86, pullRate: 0.35, image: '/assets/characters/yuta-okkotsu.jpg', upcoming: false, domain: 'Legacy', skill: { name: 'Rika Bond', power: 180, desc: 'Rika unleashes powerful support attacks.' } },
  { id: 'mahito', name: 'Mahito', title: 'Idle Transfiguration', rarity: 'Grade1', element: 'Cursed', hp: 1000, atk: 96, def: 70, speed: 84, pullRate: 0.04, image: '/assets/characters/mahito.jpg', upcoming: false, domain: 'Void', skill: { name: 'Soul Manipulation', power: 170, desc: 'Twist souls to reshape form.' } },
  { id: 'jogo', name: 'Jogo', title: 'Disaster Flame', rarity: 'Grade1', element: 'Fire', hp: 920, atk: 102, def: 66, speed: 72, pullRate: 0.01, image: '/assets/characters/jogo.jpg', upcoming: false, domain: 'Volcano', skill: { name: 'Magma Burst', power: 155, desc: 'Explosive fire-based attack.' } },

  // Remaining roster entries (marked upcoming) — you can replace image: undefined with actual image files
  { id: 'kenjaku', name: 'Kenjaku', title: 'Ancient Vessel', rarity: 'Special', element: 'Cursed', hp: 1250, atk: 130, def: 90, speed: 74, pullRate: 0.2, upcoming: true, domain: 'Manipulation', skill: { name: 'Mind Warp', power: 200, desc: 'Seize control of battlefield minds.' } },
  { id: 'choso', name: 'Choso', title: 'Blood Manipulation', rarity: 'Grade2', element: 'Cursed', hp: 870, atk: 86, def: 60, speed: 79, pullRate: 1.5, upcoming: true, domain: 'Blood Control', skill: { name: 'Blood Spear', power: 130, desc: 'Create weapons from blood.' } },
  { id: 'jogo-2', name: 'Dagon', title: 'Disaster Tides', rarity: 'Grade1', element: 'Fire', hp: 900, atk: 98, def: 70, speed: 76, pullRate: 0.5, upcoming: true, domain: 'Tidal Curse', skill: { name: 'Tidal Crush', power: 145, desc: 'Water and curse combined assault.' } },
  { id: 'uraume', name: 'Uraume', title: 'Estranged Follower', rarity: 'Grade3', element: 'Cursed', hp: 760, atk: 78, def: 54, speed: 70, pullRate: 0.6, upcoming: true, domain: 'Dark Servant', skill: { name: 'Shadow Latch', power: 95, desc: 'Bind and pull enemies with shadows.' } },
  { id: 'others', name: 'All Others', title: 'Various', rarity: 'Grade4', element: 'Neutral', hp: 600, atk: 50, def: 40, speed: 50, pullRate: 0.0, upcoming: true, domain: 'Unknown', skill: { name: 'Varied', power: 60, desc: 'Various minor abilities.' } },
];

export function getCharacter(id: string): Character | undefined {
  return CHARACTERS.find((c) => c.id === id);
}

export const GACHA_COST = 500; // 500 🧬 DNA per pull per spec

export function rollGacha(): Character {
  const totalWeight = CHARACTERS.reduce((s, c) => s + c.pullRate, 0);
  let r = Math.random() * totalWeight;
  for (const c of CHARACTERS) { r -= c.pullRate; if (r <= 0) return c; }
  return CHARACTERS[0];
}

export function rollGachaWithPity(pityCounter: number): { char: Character; newPity: number } {
  let newPity = pityCounter + 1;
  let char: Character;
  if (newPity >= 10) {
    const pool = CHARACTERS.filter((c) => ['Grade2','Grade1','Special'].includes(c.rarity));
    const total = pool.reduce((s, c) => s + c.pullRate, 0);
    let r = Math.random() * total;
    char = pool[0];
    for (const c of pool) { r -= c.pullRate; if (r <= 0) { char = c; break; } }
    newPity = 0;
  } else {
    char = rollGacha();
    if (['Grade2','Grade1','Special'].includes(char.rarity)) newPity = 0;
  }
  return { char, newPity };
}
