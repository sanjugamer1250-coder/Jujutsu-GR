// Complete roster dataset for Jujutsu Clash Arena — Heroes, Villains, Shikigami
// Includes high-res CDN images, base stats, Domain Expansions, and Sukuna's commentary.

export type RosterCategory = 'Sorcerer' | 'Curse' | 'Curse User' | 'Shikigami';

export interface RosterCharacter {
  id: string;
  name: string;
  title: string;
  category: RosterCategory;
  image: string;
  hp: number;
  attack: number;
  cursedEnergy: number;
  speed: number;
  domain?: string;
  skill?: string;
  sukunaCommentary: string;
  rarity: 'Grade4' | 'Grade3' | 'Grade2' | 'Grade1' | 'Special';
}

export const ROSTER: RosterCharacter[] = [
  // ===== HEROES =====
  {
    id: 'gojo',
    name: 'Satoru Gojo',
    title: 'The Honored One',
    category: 'Sorcerer',
    image: 'https://images.alphacoders.com/131/1316278.png',
    hp: 1100, attack: 120, cursedEnergy: 200, speed: 99,
    domain: 'Unlimited Void',
    rarity: 'Special',
    sukunaCommentary: 'The only sorcerer who could rival me. His Limitless is annoying, but even infinity has its limits. I look forward to cutting through it.',
  },
  {
    id: 'yuji',
    name: 'Yuji Itadori',
    title: 'Vessel of Sukuna',
    category: 'Sorcerer',
    image: 'https://images.alphacoders.com/131/1316276.png',
    hp: 920, attack: 78, cursedEnergy: 45, speed: 88,
    skill: 'Divergent Fist & Black Flash',
    rarity: 'Grade4',
    sukunaCommentary: 'My vessel. A brat with raw physical strength but no cursed technique of his own. The Black Flash is interesting though — when he lands it, even I feel a flicker of amusement.',
  },
  {
    id: 'megumi',
    name: 'Megumi Fushiguro',
    title: 'Ten Shadows Master',
    category: 'Sorcerer',
    image: 'https://images.alphacoders.com/131/1316279.png',
    hp: 840, attack: 86, cursedEnergy: 150, speed: 80,
    domain: 'Chimera Shadow Garden',
    rarity: 'Grade2',
    sukunaCommentary: 'The Ten Shadows brat. He has potential — Mahoraga alone makes him worth watching. But potential is meaningless without the will to kill.',
  },
  {
    id: 'nobara',
    name: 'Nobara Kugisaki',
    title: 'Straw Doll Master',
    category: 'Sorcerer',
    image: 'https://via.placeholder.com/400x600/0f172a/f59e0b?text=Nobara+Kugisaki',
    hp: 760, attack: 70, cursedEnergy: 85, speed: 82,
    skill: 'Resonance & Hairpin',
    rarity: 'Grade3',
    sukunaCommentary: 'A girl with nails and attitude. Her Resonance technique is more dangerous than she realizes. Pity she wastes it on sentiment.',
  },
  {
    id: 'nanami',
    name: 'Kento Nanami',
    title: '7:3 Ratio Sorcerer',
    category: 'Sorcerer',
    image: 'https://via.placeholder.com/400x600/0f172a/eab308?text=Kento+Nanami',
    hp: 880, attack: 84, cursedEnergy: 90, speed: 70,
    skill: 'Overtime Ratio Strike',
    rarity: 'Grade2',
    sukunaCommentary: 'A salaryman who treats sorcery like a 9-to-5. His 7:3 ratio is precise, I\'ll grant him that. But precision without savagery is just accounting.',
  },
  {
    id: 'todo',
    name: 'Aoi Todo',
    title: 'Boogie Woogie',
    category: 'Sorcerer',
    image: 'https://via.placeholder.com/400x600/0f172a/3b82f6?text=Aoi+Todo',
    hp: 950, attack: 90, cursedEnergy: 70, speed: 83,
    skill: 'Position Swap',
    rarity: 'Grade2',
    sukunaCommentary: 'A brute with 530,000 IQ? His Boogie Woogie is more dangerous than it looks — chaos on the battlefield. I respect his taste in tall women with big butts, at least.',
  },

  // ===== VILLAINS =====
  {
    id: 'sukuna',
    name: 'Ryomen Sukuna',
    title: 'King of Curses',
    category: 'Curse',
    image: 'https://images.alphacoders.com/131/1316277.png',
    hp: 1300, attack: 135, cursedEnergy: 250, speed: 92,
    domain: 'Malevolent Shrine',
    rarity: 'Special',
    sukunaCommentary: 'Me. The King of Curses. Do you really need my commentary on myself? Everything within my domain is dismantled. Cleave. Dismantle. That is all you need to know.',
  },
  {
    id: 'toji',
    name: 'Toji Fushiguro',
    title: 'Sorcerer Killer',
    category: 'Curse User',
    image: 'https://images4.alphacoders.com/132/1328908.png',
    hp: 980, attack: 100, cursedEnergy: 0, speed: 95,
    skill: 'Heavenly Restriction',
    rarity: 'Grade1',
    sukunaCommentary: 'A man with zero cursed energy who kills sorcerers for sport. His Heavenly Restriction makes him a physical monster. Even I acknowledge his killing instinct.',
  },
  {
    id: 'geto',
    name: 'Suguru Geto',
    title: 'Curse Manipulator',
    category: 'Curse User',
    image: 'https://via.placeholder.com/400x600/0f172a/8b5cf6?text=Suguru+Geto',
    hp: 1000, attack: 96, cursedEnergy: 180, speed: 84,
    skill: 'Maximum: Uzumaki',
    rarity: 'Grade1',
    sukunaCommentary: 'A man who collects curses like trophies. His Uzumaki is devastating, condensing all his stored curses into a single beam. Wasteful, but effective.',
  },
  {
    id: 'jogo',
    name: 'Jogo',
    title: 'Flame Curse',
    category: 'Curse',
    image: 'https://via.placeholder.com/400x600/0f172a/ef4444?text=Jogo',
    hp: 920, attack: 102, cursedEnergy: 160, speed: 72,
    domain: 'Coffin of the Iron Mountain',
    rarity: 'Grade1',
    sukunaCommentary: 'A volcano-headed fool who thought he could negotiate with me. His flames are hot, but his ambition was hotter — and that\'s what got him killed. A cautionary tale.',
  },

  // ===== SHIKIGAMI =====
  {
    id: 'divine-dog',
    name: 'Divine Dog: Totality',
    title: 'Offensive Familiar',
    category: 'Shikigami',
    image: 'https://via.placeholder.com/400x600/0f172a/6b7280?text=Divine+Dog',
    hp: 600, attack: 65, cursedEnergy: 50, speed: 90,
    skill: 'Shadow Fang Strike',
    rarity: 'Grade3',
    sukunaCommentary: 'A shadow hound that never stops biting. Useful for harassment, but against me? It\'s a chew toy. Equip it if you enjoy watching your pets get dismantled.',
  },
  {
    id: 'mahoraga',
    name: 'Divine General Mahoraga',
    title: 'Absolute Adaptation',
    category: 'Shikigami',
    image: 'https://via.placeholder.com/400x600/0f172a/c084fc?text=Mahoraga',
    hp: 1500, attack: 110, cursedEnergy: 120, speed: 75,
    skill: 'Wheel of Adaptation',
    rarity: 'Special',
    sukunaCommentary: 'The Divine General. The only shikigama that can adapt to ANY phenomenon. Even I had to use my domain to defeat it. Equip this... if you can control it. Most can\'t.',
  },
  {
    id: 'inventory-curse',
    name: 'Inventory Curse',
    title: 'Cursed Tool Storage',
    category: 'Shikigami',
    image: 'https://via.placeholder.com/400x600/0f172a/4b5563?text=Inventory+Curse',
    hp: 400, attack: 30, cursedEnergy: 40, speed: 50,
    skill: 'Tool Manifestation',
    rarity: 'Grade4',
    sukunaCommentary: 'A living backpack. It stores cursed tools. How... practical. Not everything needs to be glorious slaughter, I suppose. Even curses need logistics.',
  },
];

export const RARITY_COLORS: Record<string, string> = {
  Grade4: 'text-zinc-300',
  Grade3: 'text-emerald-400',
  Grade2: 'text-cyan-400',
  Grade1: 'text-gold-400',
  Special: 'text-rose-300',
};

export const CATEGORY_LABELS: Record<RosterCategory, string> = {
  Sorcerer: 'Sorcerers',
  Curse: 'Curses',
  'Curse User': 'Curse Users',
  Shikigami: 'Shikigami',
};
