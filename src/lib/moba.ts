// Jujutsu Legends: 5v5 — MOBA Game Data & Match Engine

export type MobaRole = 'Brawler' | 'Tank' | 'Cursed Caster' | 'Shadow Assassin' | 'Domain Support' | 'Marksman' | 'Summoner' | 'Fighter' | 'Hyper-Carry Assassin';
export type MobaLane = 'Top' | 'Mid' | 'Bot' | 'Jungle' | 'Support';

export interface MobaAbility {
  name: string;
  type: 'Passive' | 'Skill 1' | 'Skill 2' | 'Ultimate';
  description: string;
}

export interface MobaCharacter {
  id: string;
  name: string;
  title: string;
  role: MobaRole;
  lane: MobaLane;
  specialty: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  stats: { hp: number; atk: number; def: number; spd: number; range: 'Melee' | 'Ranged' };
  abilities: MobaAbility[];
  color: string;
}

export const MOBA_CHARACTERS: MobaCharacter[] = [
  {
    id: 'yuji', name: 'Yuji Itadori', title: 'Vessel of Sukuna', role: 'Brawler', lane: 'Top',
    specialty: 'High Physical Burst & Sustained Dueling', difficulty: 'Easy',
    stats: { hp: 3200, atk: 180, def: 95, spd: 78, range: 'Melee' },
    color: 'from-rose-500 to-rose-700',
    abilities: [
      { name: 'Divergent Fist', type: 'Passive', description: 'Basic attacks strike twice. Second impact (0.3s later) deals 60% bonus physical damage.' },
      { name: 'Manji Kick', type: 'Skill 1', description: 'Dashes forward with a spinning heel kick, slowing enemies 30% for 2s.' },
      { name: 'Cursed Energy Focus', type: 'Skill 2', description: 'Gains shield (15% Max HP). For 5s, basic attacks have 5% chance to proc Black Flash (250% crit damage).' },
      { name: 'Enchain (Sukuna Swap)', type: 'Ultimate', description: 'Swaps to Sukuna for 8s. +40% move speed, 25% lifesteal, wide cleave slashes.' },
    ],
  },
  {
    id: 'gojo', name: 'Satoru Gojo', title: 'The Honored One', role: 'Cursed Caster', lane: 'Mid',
    specialty: 'AoE Magic Burst & Crowd Control', difficulty: 'Hard',
    stats: { hp: 2400, atk: 210, def: 70, spd: 85, range: 'Ranged' },
    color: 'from-sky-400 to-blue-600',
    abilities: [
      { name: 'Limitless Infinity', type: 'Passive', description: 'Auto-blocks first hard CC or magic damage every 18s.' },
      { name: 'Cursed Technique Lapse: Blue', type: 'Skill 1', description: 'Creates gravity field pulling all nearby enemies to center, dealing magic damage.' },
      { name: 'Cursed Technique Reversal: Red', type: 'Skill 2', description: 'Fires repulsive energy shockwave in a line, knocking back and exploding on contact.' },
      { name: 'Infinite Void', type: 'Ultimate', description: 'Expands 360° domain for 4s. All enemies inside are frozen (stunned) taking continuous mental damage.' },
    ],
  },
  {
    id: 'megumi', name: 'Megumi Fushiguro', title: 'Shadow Summoner', role: 'Summoner', lane: 'Bot',
    specialty: 'Ranged Dmg & Shadow Utility', difficulty: 'Medium',
    stats: { hp: 2600, atk: 165, def: 80, spd: 75, range: 'Ranged' },
    color: 'from-slate-500 to-slate-700',
    abilities: [
      { name: 'Divine Dog', type: 'Passive', description: 'A shadow hound permanently accompanies Megumi, attacking his focused target.' },
      { name: "Nue's Thunderbolt", type: 'Skill 1', description: 'Summons Nue to fly in a targeted path, shocking enemies with lightning (1.5s slow).' },
      { name: 'Toad Shadow Grab', type: 'Skill 2', description: 'Launches shadow frog tongue pulling enemy 3m closer, immobilizing 1s.' },
      { name: 'Chimera Shadow Garden', type: 'Ultimate', description: 'Covers ground in liquid shadow for 6s. Skills have 80% reduced cooldowns, shadow clones mimic attacks.' },
    ],
  },
  {
    id: 'nobara', name: 'Nobara Kugisaki', title: 'Straw Doll Master', role: 'Marksman', lane: 'Bot',
    specialty: 'Ranged Execution & Mark Detonation', difficulty: 'Medium',
    stats: { hp: 2500, atk: 190, def: 72, spd: 80, range: 'Ranged' },
    color: 'from-orange-400 to-orange-600',
    abilities: [
      { name: 'Resonance Mark', type: 'Passive', description: 'Basic attacks embed Cursed Nails into enemies (up to 3 stacks).' },
      { name: 'Hairpin', type: 'Skill 1', description: 'Detonates all embedded nails, dealing AoE physical damage to marked enemies and nearby minions.' },
      { name: 'Triple Nail Volley', type: 'Skill 2', description: 'Fires 3 nails in a spread cone, slowing enemies and applying 1 Resonance stack per hit.' },
      { name: 'Resonance', type: 'Ultimate', description: 'Strikes straw doll with hammer. Massive execution damage to ALL marked heroes regardless of distance.' },
    ],
  },
  {
    id: 'toji', name: 'Toji Fushiguro', title: 'Sorcerer Killer', role: 'Shadow Assassin', lane: 'Jungle',
    specialty: 'Stealth, Burst & Shield Shatter', difficulty: 'Hard',
    stats: { hp: 2800, atk: 220, def: 85, spd: 92, range: 'Melee' },
    color: 'from-emerald-500 to-emerald-700',
    abilities: [
      { name: 'Zero Cursed Energy', type: 'Passive', description: 'Invisible to enemy wards and sensors. Bush entry grants 150% bonus damage on next attack.' },
      { name: 'Chain of a Thousand Miles', type: 'Skill 1', description: 'Flings chain forward; on hit, pulls Toji directly to the target.' },
      { name: 'Inverted Spear of Heaven', type: 'Skill 2', description: 'Thrusts forward, breaking enemy shields and silencing target 1.5s.' },
      { name: 'Heavenly Restriction', type: 'Ultimate', description: '6s hyper-focus: +50% move speed, slow immunity, guaranteed crits on low-HP targets.' },
    ],
  },
  {
    id: 'todo', name: 'Aoi Todo', title: 'Boogie Woogie Virtuoso', role: 'Fighter', lane: 'Jungle',
    specialty: 'Teamfight Disruption & Position Swaps', difficulty: 'Hard',
    stats: { hp: 3400, atk: 175, def: 110, spd: 72, range: 'Melee' },
    color: 'from-violet-500 to-violet-700',
    abilities: [
      { name: '530,000 IQ', type: 'Passive', description: '+15% Armor and Magic Resist when within 5m of an allied hero.' },
      { name: 'Brotherly Tackle', type: 'Skill 1', description: 'Charges forward, knocking up first enemy hero hit for 1s.' },
      { name: 'Clapping Swap', type: 'Skill 2', description: 'Instantly swaps places with an enemy or ally within 6m radius (4s cooldown).' },
      { name: 'Boogie Woogie Chaos', type: 'Ultimate', description: 'Randomly scrambles positions of all 5 enemy heroes in target area, ruining formation.' },
    ],
  },
  {
    id: 'nanami', name: 'Kento Nanami', title: '7:3 Precision Sorcerer', role: 'Tank', lane: 'Top',
    specialty: 'Critical Precision & Scale (Overtime)', difficulty: 'Medium',
    stats: { hp: 3800, atk: 150, def: 130, spd: 65, range: 'Melee' },
    color: 'from-amber-500 to-amber-700',
    abilities: [
      { name: 'Overtime', type: 'Passive', description: 'After 10 minutes, gains +25% Physical Damage and 20% damage reduction for the rest of the game.' },
      { name: '7:3 Ratio Strike', type: 'Skill 1', description: 'Strikes enemy. Hitting at 70% distance forces guaranteed 200% critical hit.' },
      { name: 'Blunt Blade Guard', type: 'Skill 2', description: 'Raises blade to block attacks, reflecting 30% physical damage back for 2s.' },
      { name: 'Collapse', type: 'Ultimate', description: 'Smashes blade into ground, rubble collapses in area, stunning enemies 2s.' },
    ],
  },
  {
    id: 'jogo', name: 'Jogo', title: 'Disaster Curse of Flames', role: 'Cursed Caster', lane: 'Mid',
    specialty: 'Area Burn & Volcanic Burst', difficulty: 'Medium',
    stats: { hp: 2700, atk: 200, def: 78, spd: 70, range: 'Ranged' },
    color: 'from-red-500 to-red-700',
    abilities: [
      { name: 'Volcanic Heat', type: 'Passive', description: 'Enemies near Jogo suffer continuous burn damage (2% Max HP/sec).' },
      { name: 'Disaster Flames', type: 'Skill 1', description: 'Fires concentrated magma beam, melting enemy magic defense by 15%.' },
      { name: 'Ember Insects', type: 'Skill 2', description: 'Spawns 3 explosive insects targeting lowest-HP enemy, exploding on contact.' },
      { name: 'Coffin of the Iron Mountain', type: 'Ultimate', description: 'Traps nearby enemies in volcanic chamber 4s. Flame abilities +50% damage, ignore all armor.' },
    ],
  },
  {
    id: 'geto', name: 'Suguru Geto', title: 'Curse Manipulator', role: 'Domain Support', lane: 'Support',
    specialty: 'Minion Swarms & Ally Buffs', difficulty: 'Hard',
    stats: { hp: 2900, atk: 140, def: 100, spd: 68, range: 'Ranged' },
    color: 'from-indigo-400 to-indigo-600',
    abilities: [
      { name: 'Spirit Collection', type: 'Passive', description: 'Defeating creeps/minions stores Cursed Spirits (up to 10).' },
      { name: 'Swarm Release', type: 'Skill 1', description: 'Releases 3 curses forward, blocking skillshots and slowing enemies 25%.' },
      { name: 'Cursed Shielding', type: 'Skill 2', description: 'Wraps ally in barrier, granting shield and +20% move speed for 3s.' },
      { name: 'Maximum: Uzumaki', type: 'Ultimate', description: 'Condenses all stored curses into a beam. Damage proportional to spirits stored.' },
    ],
  },
  {
    id: 'sukuna', name: 'Ryomen Sukuna', title: 'King of Curses', role: 'Hyper-Carry Assassin', lane: 'Mid',
    specialty: 'True Damage Slices & Open Domain', difficulty: 'Extreme',
    stats: { hp: 3000, atk: 250, def: 90, spd: 88, range: 'Melee' },
    color: 'from-red-600 to-rose-900',
    abilities: [
      { name: 'Malevolent Cutting', type: 'Passive', description: 'Basic attacks apply bleeding wounds, reducing enemy healing by 40%.' },
      { name: 'Dismantle', type: 'Skill 1', description: 'Fires invisible ranged slash through all enemies and minions in a line.' },
      { name: 'Fire Arrow (Fuga)', type: 'Skill 2', description: 'Draws flame arrow, shoots after 1s charge, massive execution damage in area.' },
      { name: 'Malevolent Shrine', type: 'Ultimate', description: 'Open domain without barrier for 5s. Auto-slashes every enemy in 360° radius every 0.5s with true damage.' },
    ],
  },
];

export const RANK_TIERS = [
  { name: 'Bronze', min: 0, color: 'text-amber-700', bg: 'from-amber-700/30 to-amber-900/10', border: 'border-amber-700/40' },
  { name: 'Silver', min: 1200, color: 'text-zinc-300', bg: 'from-zinc-400/30 to-zinc-600/10', border: 'border-zinc-400/40' },
  { name: 'Gold', min: 1500, color: 'text-gold-400', bg: 'from-gold-500/30 to-gold-700/10', border: 'border-gold-500/40' },
  { name: 'Platinum', min: 1800, color: 'text-cyan-300', bg: 'from-cyan-400/30 to-cyan-600/10', border: 'border-cyan-400/40' },
  { name: 'Diamond', min: 2100, color: 'text-sky-300', bg: 'from-sky-400/30 to-sky-600/10', border: 'border-sky-400/40' },
  { name: 'Mythic', min: 2500, color: 'text-curse-300', bg: 'from-curse-400/30 to-curse-600/10', border: 'border-curse-400/40' },
  { name: 'Special Grade', min: 3000, color: 'text-rose-300', bg: 'from-rose-400/30 to-rose-600/10', border: 'border-rose-400/40' },
];

export function getRankTier(elo: number) {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (elo >= RANK_TIERS[i].min) return RANK_TIERS[i];
  }
  return RANK_TIERS[0];
}

// Match simulation engine
export interface MatchResult {
  win: boolean;
  mvp: boolean;
  firstBlood: boolean;
  kills: number;
  deaths: number;
  assists: number;
  durationSec: number;
  dnaReward: number;
  enemyTeam: string;
  allyTeam: string;
}

const TEAM_NAMES = [
  'Tokyo Jujutsu High', 'Kyoto Jujutsu High', 'Cursed Womb Squad', 'Shadow Clan',
  'Veil Breakers', 'Finger Bearers', 'Domain Expanders', 'Sorcerer Elite',
];

export function simulateMatch(charId: string, isRanked: boolean): MatchResult {
  const char = MOBA_CHARACTERS.find((c) => c.id === charId) || MOBA_CHARACTERS[0];

  // Win probability based on character stats (higher stat total = better win rate)
  const statTotal = char.stats.hp / 100 + char.stats.atk + char.stats.def + char.stats.spd;
  const baseWinRate = 0.35 + (statTotal / 800) * 0.3; // 35%-65% range
  const win = Math.random() < baseWinRate;

  const kills = Math.floor(Math.random() * 12) + (win ? 3 : 0);
  const deaths = Math.floor(Math.random() * 8) + (win ? 0 : 2);
  const assists = Math.floor(Math.random() * 15) + (win ? 3 : 1);

  const mvp = win && kills >= 8 && deaths <= 3 && Math.random() < 0.3;
  const firstBlood = Math.random() < 0.2;

  const durationSec = Math.floor(Math.random() * 300) + 600; // 10-15 min

  // 🧬 DNA reward calculation
  let baseReward = win ? 200 : 50;
  if (mvp) baseReward += 150;
  if (firstBlood) baseReward += 50;
  if (kills >= 10) baseReward += 100;
  if (isRanked) baseReward = Math.floor(baseReward * 1.5);

  const enemyTeam = TEAM_NAMES[Math.floor(Math.random() * TEAM_NAMES.length)];
  const allyTeam = TEAM_NAMES[Math.floor(Math.random() * TEAM_NAMES.length)];

  return { win, mvp, firstBlood, kills, deaths, assists, durationSec, dnaReward: baseReward, enemyTeam, allyTeam };
}

export function getMobaElo(): number {
  if (typeof window === 'undefined') return 1000;
  return parseInt(window.localStorage.getItem('moba_elo') || '1000', 10);
}

export function setMobaElo(elo: number): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('moba_elo', String(elo));
}

export function getMobaStats(): { wins: number; losses: number } {
  if (typeof window === 'undefined') return { wins: 0, losses: 0 };
  return {
    wins: parseInt(window.localStorage.getItem('moba_wins') || '0', 10),
    losses: parseInt(window.localStorage.getItem('moba_losses') || '0', 10),
  };
}

export function updateMobaStats(win: boolean): void {
  if (typeof window === 'undefined') return;
  const stats = getMobaStats();
  if (win) window.localStorage.setItem('moba_wins', String(stats.wins + 1));
  else window.localStorage.setItem('moba_losses', String(stats.losses + 1));
}

export function getDailyMobaEarnings(): number {
  if (typeof window === 'undefined') return 0;
  const today = new Date().toDateString();
  const stored = window.localStorage.getItem('moba_daily_date');
  if (stored !== today) {
    window.localStorage.setItem('moba_daily_date', today);
    window.localStorage.setItem('moba_daily_earned', '0');
    return 0;
  }
  return parseInt(window.localStorage.getItem('moba_daily_earned') || '0', 10);
}

export function addDailyMobaEarnings(amount: number): number {
  const current = getDailyMobaEarnings();
  const newTotal = current + amount;
  if (typeof window !== 'undefined') window.localStorage.setItem('moba_daily_earned', String(newTotal));
  return newTotal;
}

export const DAILY_EARNINGS_CAP = 5000;
