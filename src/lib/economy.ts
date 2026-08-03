// Central economy + storage layer for Jujutsu Clash Arena.
// Uses localStorage as a simulated blockchain/database. All balance/inventory
// mutations MUST go through these helpers so the storage event fires and the
// Header/Nav reflect the new state instantly without a page refresh.

export const STORAGE_KEYS = {
  dnaBalance: 'dna_balance',
  cursedEnergy: 'cursed_energy',
  roster: 'dna_roster',
  tradeAccount: 'trade_account',
  tradeOrders: 'trade_orders',
  tradeHistory: 'trade_history',
  adminPool: 'admin_pool',
  adminWalletKey: 'admin_wallet_key',
  vaultStake: 'vault_stake',
  vaultLockUntil: 'vault_lock_until',
  vaultLastMine: 'vault_last_mine',
  vaultDeposits: 'vault_deposits',
  storyProgress: 'story_progress',
  battleHistory: 'battle_history',
  txLog: 'dna_txlog',
  vipPass: 'vip_pass_until',
  adRewardLast: 'ad_reward_last',
  pvpUnlocked: 'pvp_unlocked',
  ownedItems: 'owned_items',
  relics: 'dna_relics',
  referralCode: 'dna_referral_code',
  referredBy: 'dna_referred_by',
  referralEarnings: 'dna_referral_earnings',
} as const;

export const TAX_RATE = 0.005; // 0.5% trading tax -> admin liquidity pool

// ---------- low-level helpers ----------

export function readNumber(key: string, fallback = 0): number {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw == null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw == null) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function writeValue(key: string, value: string | number): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, String(value));
  window.dispatchEvent(new Event('storage'));
}

export function writeJSON<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event('storage'));
}

// ---------- economy primitives ----------

export function getDna(): number { return readNumber(STORAGE_KEYS.dnaBalance, 0); }

export function setDna(amount: number): void {
  writeValue(STORAGE_KEYS.dnaBalance, Math.max(0, Math.round(amount * 1e6) / 1e6));
}

export function addDna(amount: number): number {
  const next = getDna() + amount;
  setDna(next);
  logTx(amount > 0 ? 'reward' : 'spend', Math.abs(amount), amount > 0 ? 'in' : 'out');
  return next;
}

export function spendDna(amount: number): boolean {
  if (getDna() < amount) return false;
  setDna(getDna() - amount);
  logTx('spend', amount, 'out');
  return true;
}

// Backward-compatible aliases (for any code still referencing old names)
export const getDnaLegacy = getDna;
export const setDnaLegacy = setDna;
export const addDnaLegacy = addDna;
export const spendDnaLegacy = spendDna;

export function getCursedEnergy(): number { return readNumber(STORAGE_KEYS.cursedEnergy, 0); }
export function addCursedEnergy(amount: number): void {
  writeValue(STORAGE_KEYS.cursedEnergy, getCursedEnergy() + amount);
}

// ---------- roster / characters ----------

export function getRoster(): string[] { return readJSON<string[]>(STORAGE_KEYS.roster, []); }

export function unlockChar(id: string): void {
  const roster = getRoster();
  if (!roster.includes(id)) {
    roster.push(id);
    writeJSON(STORAGE_KEYS.roster, roster);
  }
}

// ---------- owned store items ----------

export function getOwnedItems(): string[] { return readJSON<string[]>(STORAGE_KEYS.ownedItems, []); }

export function ownItem(id: string): void {
  const items = getOwnedItems();
  if (!items.includes(id)) {
    items.push(id);
    writeJSON(STORAGE_KEYS.ownedItems, items);
  }
}

// ---------- VIP Sorcerer Pass ----------

export function getVipUntil(): number { return readNumber(STORAGE_KEYS.vipPass, 0); }
export function isVipActive(): boolean { return Date.now() < getVipUntil(); }
export function activateVip(days: number): void {
  const base = Math.max(Date.now(), getVipUntil());
  writeValue(STORAGE_KEYS.vipPass, base + days * 86400000);
}

// ---------- daily ad reward ----------

export function getAdRewardLast(): number { return readNumber(STORAGE_KEYS.adRewardLast, 0); }
export function canClaimAdReward(): boolean {
  return Date.now() - getAdRewardLast() >= 86400000; // 24h
}
export function claimAdReward(): void {
  writeValue(STORAGE_KEYS.adRewardLast, Date.now());
}

// ---------- PvP unlock (requires vault lock) ----------

export function isPvpUnlocked(): boolean { return readNumber(STORAGE_KEYS.pvpUnlocked, 0) === 1; }
export function unlockPvp(): void { writeValue(STORAGE_KEYS.pvpUnlocked, 1); }

// ---------- admin liquidity pool ----------

export function getAdminPool(): number { return readNumber(STORAGE_KEYS.adminPool, 0); }
export function addAdminPool(amount: number): void {
  writeValue(STORAGE_KEYS.adminPool, getAdminPool() + amount);
}

export function getAdminWalletKey(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEYS.adminWalletKey);
}

export function setAdminWalletKey(key: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.adminWalletKey, key);
  window.dispatchEvent(new Event('storage'));
}

// ---------- transaction log ----------

export type TxEntry = {
  id: string; type: 'reward' | 'spend' | 'trade' | 'deposit' | 'withdraw' | 'tax' | 'purchase' | 'vip' | 'ad' | 'relic' | 'referral' | 'airdrop' | 'raid' | 'bet' | 'clan';
  amount: number; direction: 'in' | 'out'; note: string; ts: number;
};

export function getTxLog(): TxEntry[] { return readJSON<TxEntry[]>(STORAGE_KEYS.txLog, []); }

export function logTx(type: TxEntry['type'], amount: number, direction: 'in' | 'out', note = ''): void {
  const log = getTxLog();
  log.unshift({ id: Math.random().toString(36).slice(2), type, amount, direction, note, ts: Date.now() });
  if (log.length > 200) log.length = 200;
  writeJSON(STORAGE_KEYS.txLog, log);
}

// ---------- relics & consumables (token sink) ----------

export interface Relic {
  id: string; name: string; desc: string; cost: number; type: 'pvp' | 'buff' | 'consumable';
  icon: string; effect: string; owned: boolean;
}

export const RELICS: Relic[] = [
  { id: 'prison_realm', name: 'Prison Realm', desc: 'Seal your opponent\'s strongest character for 1 PvP match.', cost: 50000, type: 'pvp', icon: 'cube', effect: 'Seal enemy', owned: false },
  { id: 'inverted_spear', name: 'Inverted Spear of Heaven', desc: 'Nullify all cursed techniques in your next PvP battle.', cost: 75000, type: 'pvp', icon: 'sword', effect: 'Nullify CT', owned: false },
  { id: 'playful_cloud', name: 'Playful Cloud', desc: '+50% ATK for 1 PvP match.', cost: 30000, type: 'pvp', icon: 'cloud', effect: '+50% ATK', owned: false },
  { id: 'soul_splatter', name: 'Soul Splatter Talisman', desc: 'Reveal your opponent\'s team before the match starts.', cost: 15000, type: 'pvp', icon: 'eye', effect: 'Reveal team', owned: false },
  { id: 'reverse_talisman', name: 'Reverse Cursed Talisman', desc: 'Full HP restore for your team in 1 PvP match.', cost: 25000, type: 'pvp', icon: 'heart', effect: 'Full HP', owned: false },
  { id: 'black_flash_charm', name: 'Black Flash Charm', desc: 'Guaranteed critical hit on first attack next match.', cost: 20000, type: 'consumable', icon: 'zap', effect: 'Guaranteed crit', owned: false },
  { id: 'domain_amp', name: 'Domain Amplification', desc: 'Immune to enemy Domain Expansion for 1 match.', cost: 40000, type: 'pvp', icon: 'shield', effect: 'Domain immune', owned: false },
  { id: 'cursed_womb', name: 'Cursed Womb Essence', desc: 'Instantly gain 500 Cursed Energy.', cost: 10000, type: 'consumable', icon: 'flask', effect: '+500 CE', owned: false },
];

export function getOwnedRelics(): string[] { return readJSON<string[]>(STORAGE_KEYS.relics, []); }

export function ownRelic(id: string): void {
  const relics = getOwnedRelics();
  if (!relics.includes(id)) { relics.push(id); writeJSON(STORAGE_KEYS.relics, relics); }
}

export function buyRelic(id: string): boolean {
  const relic = RELICS.find((r) => r.id === id);
  if (!relic) return false;
  if (!spendDna(relic.cost)) return false;
  ownRelic(id);
  logTx('relic', relic.cost, 'out', `Bought ${relic.name}`);
  return true;
}

// ---------- referral system ----------

export function getReferralCode(): string {
  if (typeof window === 'undefined') return '';
  let code = window.localStorage.getItem(STORAGE_KEYS.referralCode);
  if (!code) {
    code = 'JC-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    window.localStorage.setItem(STORAGE_KEYS.referralCode, code);
  }
  return code;
}

export function getReferredBy(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEYS.referredBy);
}

export function setReferredBy(code: string): void {
  if (typeof window === 'undefined') return;
  if (!window.localStorage.getItem(STORAGE_KEYS.referredBy)) {
    window.localStorage.setItem(STORAGE_KEYS.referredBy, code);
  }
}

export function getReferralEarnings(): number { return readNumber(STORAGE_KEYS.referralEarnings, 0); }

export function addReferralEarnings(amount: number): void {
  writeValue(STORAGE_KEYS.referralEarnings, getReferralEarnings() + amount);
  addDna(amount);
  logTx('referral', amount, 'in', 'Referral mining commission');
}

// ---------- airdrop ----------

export function claimAirdrop(amount: number): void {
  addDna(amount);
  logTx('airdrop', amount, 'in', 'Mass airdrop from admin');
}

// ---------- bootstrap a fresh account ----------

export function bootstrapAccount(): void {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem('dna_bootstrapped') === '1') return;
  if (getDna() === 0) setDna(1000);
  if (getCursedEnergy() === 0) addCursedEnergy(100);
  if (getRoster().length === 0) unlockChar('yuji');
  window.localStorage.setItem('dna_bootstrapped', '1');
  window.dispatchEvent(new Event('storage'));
}

export function resetAccount(): void {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach((k) => window.localStorage.removeItem(k));
  window.localStorage.removeItem('dna_bootstrapped');
  bootstrapAccount();
}
