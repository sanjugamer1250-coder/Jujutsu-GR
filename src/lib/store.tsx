import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase, getPlayerId } from '@/lib/supabase';
import { getDna, getCursedEnergy, logTx } from '@/lib/economy';

export interface UserBalance {
  dna: number;
  usdt: number;
  cursed_energy: number;
  kyc_tier: number;
  is_kyc_verified: boolean;
  referral_code: string | null;
  rank_tier: string;
  rank_points: number;
}

export interface LedgerEntry {
  id: string;
  tx_id: string | null;
  user_id: string;
  type: string;
  amount: string;
  currency: string;
  direction: string;
  note: string | null;
  created_at: string;
}

interface AppContextType {
  balance: UserBalance;
  ledger: LedgerEntry[];
  loading: boolean;
  refreshBalance: () => Promise<void>;
  refreshLedger: () => Promise<void>;
  recordTransaction: (type: string, amount: number, currency: string, direction: 'in' | 'out', note?: string) => Promise<void>;
  updateKycTier: (tier: number) => Promise<void>;
  incrementDna: (amount: number) => Promise<number>;
  incrementUsdt: (amount: number) => Promise<number>;
  updateRank: (tier: string, points: number) => Promise<void>;
}

const DEFAULT_BALANCE: UserBalance = {
  dna: 0, usdt: 0, cursed_energy: 100,
  kyc_tier: 0, is_kyc_verified: false, referral_code: null,
  rank_tier: 'Bronze', rank_points: 0,
};

const AppContext = createContext<AppContextType>({
  balance: DEFAULT_BALANCE,
  ledger: [],
  loading: true,
  refreshBalance: async () => {},
  refreshLedger: async () => {},
  recordTransaction: async () => {},
  updateKycTier: async () => {},
  incrementDna: async () => 0,
  incrementUsdt: async () => 0,
  updateRank: async () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const playerId = getPlayerId();
  const [balance, setBalance] = useState<UserBalance>(DEFAULT_BALANCE);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshBalance = useCallback(async () => {
    const { data } = await supabase.from('user_balances').select('*').eq('user_id', playerId).maybeSingle();
    if (data) {
      setBalance(data as UserBalance);
    } else {
      const { data: created } = await supabase.from('user_balances').insert({
        user_id: playerId, dna: getDna(), cursed_energy: getCursedEnergy(),
        kyc_tier: 0, is_kyc_verified: false, rank_tier: 'Bronze', rank_points: 0,
      }).select('*').maybeSingle();
      if (created) setBalance(created as UserBalance);
    }
  }, [playerId]);

  const refreshLedger = useCallback(async () => {
    const { data } = await supabase.from('transactions_ledger').select('*').eq('user_id', playerId).order('created_at', { ascending: false }).limit(100);
    if (data) setLedger(data as LedgerEntry[]);
  }, [playerId]);

  const recordTransaction = useCallback(async (type: string, amount: number, currency: string, direction: 'in' | 'out', note?: string) => {
    const txId = 'TX-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
    await supabase.from('transactions_ledger').insert({
      tx_id: txId, user_id: playerId, type, amount: String(amount), currency, direction, note: note || null,
    });
    logTx(type as any, amount, direction, note || '');
    refreshLedger();
  }, [playerId, refreshLedger]);

  const updateKycTier = useCallback(async (tier: number) => {
    await supabase.from('user_balances').update({
      kyc_tier: tier, is_kyc_verified: tier >= 1, updated_at: new Date().toISOString(),
    }).eq('user_id', playerId);
    setBalance((prev) => ({ ...prev, kyc_tier: tier, is_kyc_verified: tier >= 1 }));
  }, [playerId]);

  const incrementDna = useCallback(async (amount: number): Promise<number> => {
    const { data, error } = await supabase.rpc('increment_dna_balance', {
      p_user_id: playerId, p_amount: amount,
    });
    if (error) {
      // Fallback: try the old RPC name
      const { data: fallback, error: err2 } = await supabase.rpc('increment_dna_balance', {
        p_user_id: playerId, p_amount: amount,
      });
      if (err2) { console.error('RPC increment_dna_balance failed:', err2); return 0; }
      const newBal = Number(fallback) || 0;
      setBalance((prev) => ({ ...prev, dna: newBal }));
      return newBal;
    }
    const newBal = Number(data) || 0;
    setBalance((prev) => ({ ...prev, dna: newBal }));
    return newBal;
  }, [playerId]);

  const incrementUsdt = useCallback(async (amount: number): Promise<number> => {
    const { data, error } = await supabase.rpc('increment_usdt_balance', {
      p_user_id: playerId, p_amount: amount,
    });
    if (error) { console.error('RPC increment_usdt_balance failed:', error); return 0; }
    const newBal = Number(data) || 0;
    setBalance((prev) => ({ ...prev, usdt: newBal }));
    return newBal;
  }, [playerId]);

  const updateRank = useCallback(async (tier: string, points: number) => {
    await supabase.from('user_balances').update({
      rank_tier: tier, rank_points: points, updated_at: new Date().toISOString(),
    }).eq('user_id', playerId);
    setBalance((prev) => ({ ...prev, rank_tier: tier, rank_points: points }));
  }, [playerId]);

  useEffect(() => {
    (async () => {
      await Promise.all([refreshBalance(), refreshLedger()]);
      setLoading(false);
    })();
    const sync = () => { setBalance((prev) => ({ ...prev, dna: getDna(), cursed_energy: getCursedEnergy() })); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [refreshBalance, refreshLedger]);

  return (
    <AppContext.Provider value={{ balance, ledger, loading, refreshBalance, refreshLedger, recordTransaction, updateKycTier, incrementDna, incrementUsdt, updateRank }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
