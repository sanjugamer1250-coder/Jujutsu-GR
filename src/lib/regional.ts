// Regional Tax Engine — country-based fee and tax configuration.
// Used by the Infinity Exchange to calculate total fees per trade
// and route platform revenue vs compliance treasury.

export interface RegionalTaxRule {
  code: string;
  country: string;
  region: string;
  taxRate: number;       // regional compliance tax (e.g. 0.01 = 1%)
  platformFee: number;   // platform trading fee (e.g. 0.005 = 0.5%)
  flag: string;
  adminCut: number;      // admin revenue share of platform fee
}

export const REGIONAL_TAX_RULES: RegionalTaxRule[] = [
  { code: 'IN', country: 'India', region: 'South Asia', taxRate: 0.010, platformFee: 0.005, flag: '🇮🇳', adminCut: 0.002 },
  { code: 'EU', country: 'European Union', region: 'Europe', taxRate: 0.003, platformFee: 0.004, flag: '🇪🇺', adminCut: 0.001 },
  { code: 'US', country: 'United States', region: 'North America', taxRate: 0.0025, platformFee: 0.005, flag: '🇺🇸', adminCut: 0.0015 },
  { code: 'BR', country: 'Brazil / LATAM', region: 'Latin America', taxRate: 0.002, platformFee: 0.005, flag: '🇧🇷', adminCut: 0.001 },
  { code: 'GLOBAL', country: 'Other / International', region: 'Global', taxRate: 0.000, platformFee: 0.005, flag: '🌐', adminCut: 0.0 },
];

export function getTaxRule(code: string): RegionalTaxRule {
  return REGIONAL_TAX_RULES.find((r) => r.code === code) || REGIONAL_TAX_RULES[4];
}

export function getTotalFeeRate(code: string): number {
  const rule = getTaxRule(code);
  return rule.platformFee + rule.taxRate;
}

export function calculateTradeFee(amount: number, countryCode: string): {
  totalFee: number;
  platformRevenue: number;
  complianceTax: number;
  adminCut: number;
  netAmount: number;
} {
  const rule = getTaxRule(countryCode);
  const complianceTax = amount * rule.taxRate;
  const platformRevenue = amount * rule.platformFee;
  const adminCut = platformRevenue * (rule.adminCut / rule.platformFee || 0);
  const totalFee = complianceTax + platformRevenue;
  return { totalFee, platformRevenue, complianceTax, adminCut, netAmount: amount - totalFee };
}

export function getStoredCountry(): string {
  if (typeof window === 'undefined') return 'GLOBAL';
  return window.localStorage.getItem('user_country') || 'GLOBAL';
}

export function setStoredCountry(code: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('user_country', code);
}

// KYC Tier definitions
export const KYC_TIERS = [
  {
    tier: 1,
    name: 'Novice',
    requirements: 'Telegram Auth / Email Verification (automatic on registration)',
    gameAccess: 'Full PvE Story Mode, Gacha, Vault Mining, and internal platform trading. External withdrawals of USDT/Crypto are disabled.',
    tradingLimits: 'Unlimited Deposits; Internal Trading Only; No Crypto Withdrawals.',
  },
  {
    tier: 2,
    name: 'Special Grade',
    requirements: 'Biometric ID verification via automated compliance partners (Sumsub / Persona)',
    gameAccess: 'Full Access + high-stakes PvP Leaderboard rewards',
    tradingLimits: 'Unlimited Trading; Full external crypto withdrawals (USDT, BNB, ETH, TON).',
  },
];

export function getKycTier(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(window.localStorage.getItem('kyc_tier') || '0', 10);
}

export function setKycTier(tier: number): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('kyc_tier', String(tier));
}

// Vault Passkey — stored as a simple hash (not cryptographically secure, but
// prevents plaintext storage in localStorage).
export async function hashPasskey(passkey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode('dna_salt_' + passkey);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function getStoredPasskeyHash(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('vault_passkey_hash');
}

export async function setVaultPasskey(passkey: string): Promise<void> {
  const hash = await hashPasskey(passkey);
  if (typeof window !== 'undefined') window.localStorage.setItem('vault_passkey_hash', hash);
}

export async function verifyPasskey(passkey: string): Promise<boolean> {
  const stored = getStoredPasskeyHash();
  if (!stored) return false;
  const hash = await hashPasskey(passkey);
  return hash === stored;
}

export function hasPasskey(): boolean {
  return !!getStoredPasskeyHash();
}
