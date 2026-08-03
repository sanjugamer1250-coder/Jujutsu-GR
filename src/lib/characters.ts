// Character roster + gacha RNG for Jujutsu Clash Arena.
// Pull rates per spec: Grade 4 (common) ~83.5%, Special Grade ~1.5%.

export type Rarity = 'Grade4' | 'Grade3' | 'Grade2' | 'Grade1' | 'Special';

export interface Character {
  id: string; name: string; title: string; rarity: Rarity;
  element: 'Taijutsu' | 'Cursed' | 'Shadows' | 'Limitless' | 'Reverse' | 'Fire' | 'Ice';
  hp: number; atk: number; def: number; speed: number;
  pullRate: number; image: string; domain: string;
  skill: { name: string; power: number; desc: string };
}

export const RARITY_META: Record<Rarity, { label: string; color: string; glow: string; mult: number }> = {
  Grade4: { label: 'Grade 4', color: 'text-zinc-300', glow: 'shadow-none', mult: 1 },
  Grade3: { label: 'Grade 3', color: 'text-emerald-400', glow: 'shadow-[0_0_12px_rgba(74,222,128,0.4)]', mult: 1.25 },
  Grade2: { label: 'Grade 2', color: 'text-cyan-400', glow: 'shadow-energy-glow', mult: 1.6 },
  Grade1: { label: 'Grade 1', color: 'text-gold-400', glow: 'shadow-gold-glow', mult: 2.2 },
  Special: { label: 'Special', color: 'text-curse-300', glow: 'shadow-curse-glow-lg', mult: 3.5 },
};

export const CHARACTERS: Character[] = [
  { id: 'yuji', name: 'Yuji Itadori', title: 'Vessel of Sukuna', rarity: 'Grade4', element: 'Taijutsu', hp: 920, atk: 78, def: 62, speed: 88, pullRate: 83.5, image: '/yuji.jpeg', domain: 'Black Flash Barrage', skill: { name: 'Divergent Fist', power: 95, desc: 'A delayed second impact that shatters cursed defenses.' } },
  { id: 'megumi', name: 'Megumi Fushiguro', title: 'The Ten Shadows', rarity: 'Grade2', element: 'Shadows', hp: 840, atk: 86, def: 58, speed: 80, pullRate: 8, image: '/megumi.jpeg', domain: 'Chimera Shadow Garden', skill: { name: 'Mahoraga Wheel', power: 130, desc: 'Adapt to all phenomena — the divine general awakens.' } },
  { id: 'nobara', name: 'Nobara Kugisaki', title: 'Straw Doll Technique', rarity: 'Grade3', element: 'Cursed', hp: 760, atk: 70, def: 50, speed: 82, pullRate: 5, image: '/nobara.jpeg', domain: 'Hairpin Resonance', skill: { name: 'Resonance Nail', power: 78, desc: 'Drives a cursed nail into the target\'s soul.' } },
  { id: 'gojo', name: 'Satoru Gojo', title: 'The Honored One', rarity: 'Special', element: 'Limitless', hp: 1100, atk: 120, def: 90, speed: 99, pullRate: 1.5, image: '/gojo.jpeg', domain: 'Unlimited Void', skill: { name: 'Hollow Purple', power: 180, desc: 'Converged infinity and divergence — annihilation made pure.' } },
  { id: 'nanami', name: 'Kento Nanami', title: 'Ratio Man', rarity: 'Grade2', element: 'Cursed', hp: 880, atk: 84, def: 72, speed: 70, pullRate: 0.5, image: '/nanami.jpeg', domain: 'Seven to Three', skill: { name: 'Ratio Collapse', power: 110, desc: 'Strikes the weak point where the ratio hits 7:3.' } },
  { id: 'toji', name: 'Toji Fushiguro', title: 'Sorcerer Killer', rarity: 'Grade1', element: 'Taijutsu', hp: 980, atk: 100, def: 80, speed: 95, pullRate: 0.8, image: '/toji.jpeg', domain: 'Heavenly Restriction', skill: { name: 'Inverted Spear', power: 140, desc: 'A body free of cursed energy — pure physical slaughter.' } },
  { id: 'sukuna', name: 'Ryomen Sukuna', title: 'King of Curses', rarity: 'Special', element: 'Cursed', hp: 1300, atk: 135, def: 95, speed: 92, pullRate: 0.2, image: '/sukuna.jpeg', domain: 'Malevolent Shrine', skill: { name: 'Cleave & Dismantle', power: 200, desc: 'The shrine opens — everything within range is dismantled.' } },
  { id: 'maki', name: 'Maki Zenin', title: 'Heavenly Restriction', rarity: 'Grade2', element: 'Taijutsu', hp: 900, atk: 88, def: 68, speed: 85, pullRate: 0.3, image: '/maki.jpeg', domain: 'Pure Body', skill: { name: 'Playful Cloud', power: 105, desc: 'Superhuman physique strikes with cursed-tool fury.' } },
  { id: 'inumaki', name: 'Toge Inumaki', title: 'Cursed Speech', rarity: 'Grade3', element: 'Cursed', hp: 720, atk: 76, def: 48, speed: 78, pullRate: 0.1, image: '/inumaki.jpeg', domain: 'Twisted Words', skill: { name: 'Don\'t Move', power: 80, desc: 'A single command paralyzes the target.' } },
  { id: 'todo', name: 'Aoi Todo', title: 'Boogie Woogie', rarity: 'Grade2', element: 'Taijutsu', hp: 950, atk: 90, def: 75, speed: 83, pullRate: 0.05, image: '/todo.jpeg', domain: 'Clap Swap', skill: { name: 'Boogie Woogie', power: 112, desc: 'A clap swaps positions — chaos becomes strategy.' } },
  { id: 'mahito', name: 'Mahito', title: 'Idle Transfiguration', rarity: 'Grade1', element: 'Cursed', hp: 1000, atk: 96, def: 70, speed: 84, pullRate: 0.04, image: '/mahito.jpeg', domain: 'Self-Embodiment of Perfection', skill: { name: 'Soul Touch', power: 135, desc: 'Reshapes the soul itself — the body follows.' } },
  { id: 'jogo', name: 'Jogo', title: 'Disaster Flame', rarity: 'Grade1', element: 'Fire', hp: 920, atk: 102, def: 66, speed: 72, pullRate: 0.01, image: '/jogo.jpeg', domain: 'Coffin of the Iron Mountain', skill: { name: 'Maximum Meteor', power: 145, desc: 'An inferno that turns the battlefield to ash.' } },
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
