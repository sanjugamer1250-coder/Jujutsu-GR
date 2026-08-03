// Infinity Exchange trading engine — Binance-style spot + futures trading
// with multi-pair support (🧬 DNA, USDT, BNB, BTC, ETH), simulated order book,
// 0.5% tax routed to the admin pool. Designed for BNB Smart Chain (BSC)
// with PancakeSwap V2 Router integration ready for mainnet listing.

import {
  STORAGE_KEYS, TAX_RATE, readJSON, writeJSON,
  getDna, setDna, addAdminPool, logTx,
} from '@/lib/economy';

// BNB Smart Chain (BSC) — BEP-20 token pairs
export type TradePair = 'DNA_USDT' | 'DNA_BNB' | 'DNA_BTC' | 'DNA_ETH';

export const PAIR_META: Record<TradePair, { label: string; base: string; quote: string; icon: string; basePrice: number }> = {
  DNA_USDT: { label: 'DNA/USDT', base: 'DNA', quote: 'USDT', icon: '🧬', basePrice: 0.42 },
  DNA_BNB: { label: 'DNA/BNB', base: 'DNA', quote: 'BNB', icon: '🟡', basePrice: 0.0007 },
  DNA_BTC: { label: 'DNA/BTC', base: 'DNA', quote: 'BTC', icon: '₿', basePrice: 0.0000072 },
  DNA_ETH: { label: 'DNA/ETH', base: 'DNA', quote: 'ETH', icon: 'Ξ', basePrice: 0.00012 },
};

export interface TradeAccount {
  id: string; createdAt: number;
  dna: number; usdt: number; bnb: number; btc: number; eth: number; passkey: string;
}

export interface Order {
  id: string; pair: TradePair; side: 'buy' | 'sell'; price: number;
  amount: number; filled: number; status: 'open' | 'filled' | 'cancelled' | 'partial'; ts: number;
}

export interface TradeHistoryEntry {
  id: string; pair: TradePair; mode: 'spot' | 'futures'; side: 'buy' | 'sell'; price: number;
  amount: number; total: number; tax: number; ts: number;
}

export function getTradeAccount(): TradeAccount | null {
  return readJSON<TradeAccount | null>(STORAGE_KEYS.tradeAccount, null);
}

export function createTradeAccount(passkey: string): TradeAccount {
  const acct: TradeAccount = {
    id: 'OMNI-' + Math.random().toString(36).slice(2, 10).toUpperCase(),
    createdAt: Date.now(), dna: 0, usdt: 0, bnb: 0, btc: 0, eth: 0, passkey,
  };
  writeJSON(STORAGE_KEYS.tradeAccount, acct);
  return acct;
}

export function updateTradeAccount(patch: Partial<TradeAccount>): TradeAccount | null {
  const acct = getTradeAccount();
  if (!acct) return null;
  const next = { ...acct, ...patch };
  writeJSON(STORAGE_KEYS.tradeAccount, next);
  return next;
}

export function getQuoteBalance(acct: TradeAccount, quote: string): number {
  return (acct as unknown as Record<string, number>)[quote.toLowerCase()] ?? 0;
}

export function depositToTrade(currency: string, amount: number): { ok: boolean; msg: string } {
  const acct = getTradeAccount();
  if (!acct) return { ok: false, msg: 'Create a trading account first.' };
  if (amount <= 0) return { ok: false, msg: 'Enter a valid amount.' };
  if (currency === 'dna') {
    if (getDna() < amount) return { ok: false, msg: 'Insufficient 🧬 DNA in hardware vault.' };
    setDna(getDna() - amount);
    updateTradeAccount({ dna: acct.dna + amount });
    logTx('deposit', amount, 'out', 'Deposit to Omni trade wallet');
  } else {
    const key = currency as keyof TradeAccount;
    const cur = (acct[key] as number) ?? 0;
    updateTradeAccount({ [key]: cur + amount } as Partial<TradeAccount>);
    logTx('deposit', amount, 'in', `${currency.toUpperCase()} deposit to Omni`);
  }
  return { ok: true, msg: 'Deposited.' };
}

export function withdrawFromTrade(currency: string, amount: number): { ok: boolean; msg: string } {
  const acct = getTradeAccount();
  if (!acct) return { ok: false, msg: 'No trading account.' };
  if (amount <= 0) return { ok: false, msg: 'Enter a valid amount.' };
  if (currency === 'dna') {
    if (acct.dna < amount) return { ok: false, msg: 'Insufficient 🧬 DNA in Omni wallet.' };
    setDna(getDna() + amount);
    updateTradeAccount({ dna: acct.dna - amount });
    logTx('withdraw', amount, 'in', 'Withdrawal from Omni to hardware vault');
  } else {
    const key = currency as keyof TradeAccount;
    const cur = (acct[key] as number) ?? 0;
    if (cur < amount) return { ok: false, msg: `Insufficient ${currency.toUpperCase()} in Omni wallet.` };
    updateTradeAccount({ [key]: cur - amount } as Partial<TradeAccount>);
    logTx('withdraw', amount, 'out', `${currency.toUpperCase()} withdrawal from Omni`);
  }
  return { ok: true, msg: 'Withdrawn.' };
}

// ---------- market price (simulated live ticker) ----------

const livePrices: Record<TradePair, number> = {
  DNA_USDT: 0.42, DNA_BNB: 0.0007, DNA_BTC: 0.0000072, DNA_ETH: 0.00012,
};
const trends: Record<TradePair, number[]> = {
  DNA_USDT: [], DNA_BNB: [], DNA_BTC: [], DNA_ETH: [],
};

export function getMarketPrice(pair: TradePair = 'DNA_USDT'): number {
  const drift = (Math.random() - 0.5) * 0.012;
  livePrices[pair] = Math.max(0.000001, livePrices[pair] + drift);
  trends[pair].push(livePrices[pair]);
  if (trends[pair].length > 60) trends[pair].shift();
  return Math.round(livePrices[pair] * 1e8) / 1e8;
}

export function getPriceTrend(pair: TradePair = 'DNA_USDT'): number[] {
  return trends[pair].length ? trends[pair] : [livePrices[pair]];
}

export function seedTrend(): void {
  (Object.keys(livePrices) as TradePair[]).forEach((pair) => {
    if (trends[pair].length === 0) {
      let p = livePrices[pair];
      for (let i = 0; i < 40; i++) { p = Math.max(0.000001, p + (Math.random() - 0.5) * p * 0.02); trends[pair].push(p); }
      livePrices[pair] = p;
    }
  });
}

// ---------- order book (simulated) ----------

export interface OrderBook { bids: { price: number; amount: number }[]; asks: { price: number; amount: number }[]; }

export function getOrderBook(pair: TradePair, price: number): OrderBook {
  const bids: { price: number; amount: number }[] = [];
  const asks: { price: number; amount: number }[] = [];
  const step = price * 0.002;
  for (let i = 1; i <= 8; i++) {
    bids.push({ price: +(price - i * step).toFixed(8), amount: +(Math.random() * 500 + 50).toFixed(2) });
    asks.push({ price: +(price + i * step).toFixed(8), amount: +(Math.random() * 500 + 50).toFixed(2) });
  }
  return { bids, asks };
}

export function getOrders(): Order[] { return readJSON<Order[]>(STORAGE_KEYS.tradeOrders, []); }
export function getTradeHistory(): TradeHistoryEntry[] { return readJSON<TradeHistoryEntry[]>(STORAGE_KEYS.tradeHistory, []); }

export function placeMarketOrder(pair: TradePair, side: 'buy' | 'sell', amountDna: number, price: number, mode: 'spot' | 'futures' = 'spot'): { ok: boolean; msg: string } {
  const acct = getTradeAccount();
  if (!acct) return { ok: false, msg: 'No trading account.' };
  if (amountDna <= 0) return { ok: false, msg: 'Enter a valid amount.' };
  const meta = PAIR_META[pair];
  const total = amountDna * price;
  const tax = total * TAX_RATE;
  const quoteKey = meta.quote.toLowerCase() as keyof TradeAccount;
  const quoteBal = (acct[quoteKey] as number) ?? 0;

  if (side === 'buy') {
    const cost = total + tax;
    if (quoteBal < cost) return { ok: false, msg: `Insufficient ${meta.quote} in Omni wallet.` };
    updateTradeAccount({ dna: acct.dna + amountDna, [quoteKey]: quoteBal - cost } as Partial<TradeAccount>);
  } else {
    if (acct.dna < amountDna) return { ok: false, msg: 'Insufficient 🧬 DNA in Omni wallet.' };
    const proceeds = total - tax;
    updateTradeAccount({ dna: acct.dna - amountDna, [quoteKey]: quoteBal + proceeds } as Partial<TradeAccount>);
  }
  addAdminPool(tax);
  logTx('tax', tax, 'out', `Trade tax (${meta.label}) to liquidity pool`);
  const entry: TradeHistoryEntry = { id: Math.random().toString(36).slice(2), pair, mode, side, price, amount: amountDna, total, tax, ts: Date.now() };
  writeJSON(STORAGE_KEYS.tradeHistory, [entry, ...getTradeHistory()].slice(0, 100));
  return { ok: true, msg: `${side === 'buy' ? 'Bought' : 'Sold'} ${amountDna} 🧬 DNA` };
}

export function placeLimitOrder(pair: TradePair, side: 'buy' | 'sell', amountDna: number, price: number): { ok: boolean; msg: string } {
  const acct = getTradeAccount();
  if (!acct) return { ok: false, msg: 'No trading account.' };
  if (amountDna <= 0 || price <= 0) return { ok: false, msg: 'Invalid order.' };
  const meta = PAIR_META[pair];
  const total = amountDna * price;
  const tax = total * TAX_RATE;
  const quoteKey = meta.quote.toLowerCase() as keyof TradeAccount;
  const quoteBal = (acct[quoteKey] as number) ?? 0;
  if (side === 'buy' && quoteBal < total + tax) return { ok: false, msg: `Insufficient ${meta.quote}.` };
  if (side === 'sell' && acct.dna < amountDna) return { ok: false, msg: 'Insufficient 🧬 DNA.' };
  const order: Order = { id: Math.random().toString(36).slice(2), pair, side, price, amount: amountDna, filled: 0, status: 'open', ts: Date.now() };
  writeJSON(STORAGE_KEYS.tradeOrders, [order, ...getOrders()]);
  return { ok: true, msg: 'Limit order placed.' };
}

export function cancelOrder(id: string): void {
  writeJSON(STORAGE_KEYS.tradeOrders, getOrders().filter((o) => o.id !== id));
}

export function matchLimitOrders(pair: TradePair, price: number): void {
  const orders = getOrders();
  let changed = false;
  for (const o of orders) {
    if (o.status !== 'open' || o.pair !== pair) continue;
    const crossed = o.side === 'buy' ? price <= o.price : price >= o.price;
    if (crossed) {
      const res = placeMarketOrder(o.pair, o.side, o.amount - o.filled, o.price);
      if (res.ok) { o.status = 'filled'; o.filled = o.amount; changed = true; }
    }
  }
  if (changed) writeJSON(STORAGE_KEYS.tradeOrders, orders);
}
