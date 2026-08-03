import { useEffect, useState } from 'react';
import { getDna, getCursedEnergy, getRoster, getTxLog, getAdminPool, getVipUntil, isPvpUnlocked, getOwnedItems, getReferralEarnings, getOwnedRelics } from '@/lib/economy';

export function useDnaBalance(): number {
  const [v, setV] = useState(() => getDna());
  useEffect(() => {
    const sync = () => setV(getDna());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return v;
}


export function useCursedEnergy(): number {
  const [v, setV] = useState(() => getCursedEnergy());
  useEffect(() => {
    const sync = () => setV(getCursedEnergy());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return v;
}

export function useRoster(): string[] {
  const [v, setV] = useState(() => getRoster());
  useEffect(() => {
    const sync = () => setV(getRoster());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return v;
}

export function useTxLog() {
  const [v, setV] = useState(() => getTxLog());
  useEffect(() => {
    const sync = () => setV(getTxLog());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return v;
}

export function useAdminPool(): number {
  const [v, setV] = useState(() => getAdminPool());
  useEffect(() => {
    const sync = () => setV(getAdminPool());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return v;
}

export function useVipUntil(): number {
  const [v, setV] = useState(() => getVipUntil());
  useEffect(() => {
    const sync = () => setV(getVipUntil());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return v;
}

export function usePvpUnlocked(): boolean {
  const [v, setV] = useState(() => isPvpUnlocked());
  useEffect(() => {
    const sync = () => setV(isPvpUnlocked());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return v;
}

export function useOwnedItems(): string[] {
  const [v, setV] = useState(() => getOwnedItems());
  useEffect(() => {
    const sync = () => setV(getOwnedItems());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return v;
}

export function useReferralEarnings(): number {
  const [v, setV] = useState(() => getReferralEarnings());
  useEffect(() => {
    const sync = () => setV(getReferralEarnings());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return v;
}

export function useOwnedRelics(): string[] {
  const [v, setV] = useState(() => getOwnedRelics());
  useEffect(() => {
    const sync = () => setV(getOwnedRelics());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return v;
}

export function useStorageSync(): void {
  const [, setTick] = useState(0);
  useEffect(() => {
    const sync = () => setTick((t) => t + 1);
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
}
