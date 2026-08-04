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

// NOTE: image paths reference public/assets/characters/{slug}.webp
// Add your supplied images to public/assets/characters/ with these filenames, or update paths as needed.
export const CHARACTERS: Character[] = [
  { id: 'yuji', name: 'Yuji Itadori', title: 'Vessel of Sukuna', rarity: 'Grade4', element: 'Taijutsu', hp: 920, atk: 78, def: 62, speed: 88, pullRate: 83.5, image: '/assets/characters/yuji-itadori.webp', domain: 'Black Flash', skill: { name: 'Deliverance', power: 100, desc: 'A devastating strike.' } },
  { id: 'megumi', name: 'Megumi Fushiguro', title: 'The Ten Shadows', rarity: 'Grade2', element: 'Shadows', hp: 840, atk: 86, def: 58, speed: 80, pullRate: 8, image: '/assets/characters/megumi-fushiguro.webp', domain: 'Chimera Shadow Garden', skill: { name: 'Shikigami', power: 120, desc: 'Summon and command shikigami.' } },
  { id: 'nobara', name: 'Nobara Kugisaki', title: 'Straw Doll Technique', rarity: 'Grade3', element: 'Cursed', hp: 760, atk: 70, def: 50, speed: 82, pullRate: 5, image: '/assets/characters/nobara-kugisaki.webp', domain: 'Resonant Straw Doll', skill: { name: 'Hairpin Strike', power: 95, desc: 'Precision curse attacks.' } },
  { id: 'gojo', name: 'Satoru Gojo', title: 'The Honored One', rarity: 'Special', element: 'Limitless', hp: 1100, atk: 120, def: 90, speed: 99, pullRate: 1.5, image: '/assets/characters/satoru-gojo.webp', domain: 'Unlimited Void', skill: { name: 'Limitless', power: 220, desc: 'Reality-bending techniques.' } },
  { id: 'nanami', name: 'Kento Nanami', title: 'Ratio Man', rarity: 'Grade2', element: 'Cursed', hp: 880, atk: 84, def: 72, speed: 70, pullRate: 0.5, image: '/assets/characters/kento-nanami.webp', domain: 'Seven to Three', skill: { name: 'Ratio Strike', power: 110, desc: 'Calculated critical hits.' } },
  { id: 'toji', name: 'Toji Fushiguro', title: 'Sorcerer Killer', rarity: 'Grade1', element: 'Taijutsu', hp: 980, atk: 100, def: 80, speed: 95, pullRate: 0.8, image: '/assets/characters/toji-fushiguro.webp', domain: 'Heavenly Restriction', skill: { name: 'Silent Kill', power: 170, desc: 'High-damage physical burst.' } },
  { id: 'sukuna', name: 'Ryomen Sukuna', title: 'King of Curses', rarity: 'Special', element: 'Cursed', hp: 1300, atk: 135, def: 95, speed: 92, pullRate: 0.2, image: '/assets/characters/ryomen-sukuna.webp', domain: 'Malevolent Shrine', skill: { name: 'Malevolent Shrine', power: 260, desc: 'Terrifying area curse.' } },
  { id: 'maki', name: 'Maki Zenin', title: 'Heavenly Restriction', rarity: 'Grade2', element: 'Taijutsu', hp: 900, atk: 88, def: 68, speed: 85, pullRate: 0.3, image: '/assets/characters/maki-zenin.webp', domain: 'Pure Body', skill: { name: 'Weapon Mastery', power: 125, desc: 'Mastery of cursed tools.' } },
  { id: 'inumaki', name: 'Toge Inumaki', title: 'Cursed Speech', rarity: 'Grade3', element: 'Cursed', hp: 720, atk: 76, def: 48, speed: 78, pullRate: 0.1, image: '/assets/characters/toge-inumaki.webp', domain: 'Forbidden Words', skill: { name: 'Cursed Speech', power: 140, desc: 'Commanding curses with words.' } },
  { id: 'panda', name: 'Panda', title: 'Intelligent Construct', rarity: 'Grade3', element: 'Neutral', hp: 980, atk: 82, def: 85, speed: 60, pullRate: 0.4, image: '/assets/characters/panda.webp', domain: 'Beast Construct', skill: { name: 'Panda Smash', power: 120, desc: 'Heavy physical impact.' } },
  { id: 'yuta', name: 'Yuta Okkotsu', title: 'Cursed Hero', rarity: 'Grade1', element: 'Reverse', hp: 1050, atk: 110, def: 88, speed: 86, pullRate: 0.35, image: '/assets/characters/yuta-okkotsu.webp', domain: 'Cursed Weapons', skill: { name: 'Rika Strike', power: 200, desc: 'Unstoppable cursed power.' } },
  { id: 'mahito', name: 'Mahito', title: 'Idle Transfiguration', rarity: 'Grade1', element: 'Cursed', hp: 1000, atk: 96, def: 70, speed: 84, pullRate: 0.04, image: '/assets/characters/mahito.webp', domain: 'Soul Manipulation', skill: { name: 'Transfigure', power: 160, desc: 'Alter enemy form.' } },
  { id: 'jogo', name: 'Jogo', title: 'Disaster Flame', rarity: 'Grade1', element: 'Fire', hp: 920, atk: 102, def: 66, speed: 72, pullRate: 0.01, image: '/assets/characters/jogo.webp', domain: 'Coffin of the Iron Mountain', skill: { name: 'Inferno', power: 150, desc: 'Volcanic flame barrage.' } },

  // Remaining roster entries (marked upcoming) — you can replace image: undefined with actual image files
  { id: 'kenjaku', name: 'Kenjaku', title: 'Ancient Vessel', rarity: 'Special', element: 'Cursed', hp: 1250, atk: 130, def: 90, speed: 74, pullRate: 0.2, upcoming: true, domain: 'Manipulation', skill: { name: 'Body Swap', power: 230, desc: 'Ancient sorcery.' } },
  { id: 'choso', name: 'Choso', title: 'Blood Manipulation', rarity: 'Grade2', element: 'Cursed', hp: 870, atk: 86, def: 60, speed: 79, pullRate: 1.5, upcoming: true, domain: 'Blood Control', skill: { name: 'Blood Wave', power: 115, desc: 'Ranged blood attacks.' } },
  { id: 'jogo-2', name: 'Dagon', title: 'Disaster Tides', rarity: 'Grade1', element: 'Fire', hp: 900, atk: 98, def: 70, speed: 76, pullRate: 0.5, upcoming: true, domain: 'Tidal Curse', skill: { name: 'Tidal Crush', power: 140, desc: 'Water and curse combo.' } },
  { id: 'uraume', name: 'Uraume', title: 'Estranged Follower', rarity: 'Grade3', element: 'Cursed', hp: 760, atk: 78, def: 54, speed: 70, pullRate: 0.6, upcoming: true, domain: 'Dark Servant', skill: { name: 'Shadow Lash', power: 110, desc: 'Close-range curse.' } },
  { id: 'others', name: 'All Others', title: 'Various', rarity: 'Grade4', element: 'Neutral', hp: 600, atk: 50, def: 40, speed: 50, pullRate: 0.0, upcoming: true, domain: 'Unknown', skill: { name: 'Varied', power: 50, desc: 'Placeholder.' } },
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
