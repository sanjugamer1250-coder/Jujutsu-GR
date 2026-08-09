// Lightweight types used by characters.generated.tsx
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
