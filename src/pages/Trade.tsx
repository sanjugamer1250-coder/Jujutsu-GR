import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowDownToLine, ArrowUpFromLine, Wallet, ShieldCheck, Lock, KeyRound, Coins, X, ChevronLeft, Zap, Globe, Info, ExternalLink, Wifi, CheckCircle2, AlertCircle } from 'lucide-react';
import { getTradeAccount, createTradeAccount, depositToTrade, withdrawFromTrade, getMarketPrice, getOrderBook, placeMarketOrder, placeLimitOrder, cancelOrder, getOrders, getTradeHistory, matchLimitOrders, seedTrend, getPriceTrend, PAIR_META, TradePair, getQuoteBalance } from '@/lib/trade';
import { useDnaBalance, useStorageSync } from '@/lib/hooks';
import { TAX_RATE } from '@/lib/economy';
import { calculateTradeFee, getStoredCountry, getTaxRule } from '@/lib/regional';
import { DnaPolicyModal } from '@/components/DnaPolicyModal';
import { fmt, fmtUsd, useInterval, pushToast } from '@/lib/ui';

type Tab = 'trade' | 'wallet' | 'orders';
type Mode = 'spot' | 'futures';

const PAIRS: TradePair[] = ['DNA_USDT', 'DNA_BNB', 'DNA_BTC', 'DNA_ETH'];

// BNB Smart Chain (BSC) chain ID = 56
const BSC_CHAIN_ID = '0x38';
const BSC_PARAMS = { chainId: BSC_CHAIN_ID, chainName: 'BNB Smart Chain', nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }, rpcUrls: ['https://bsc-dataseed.binance.org'], blockExplorerUrls: ['https://bscscan.com'] };

interface Web3State { address: string | null; chainId: string | null; connected: boolean; }

function useWeb3Wallet() {
  const [web3, setWeb3] = useState<Web3State>({ address: null, chainId: null, connected: false });

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      pushToast('No Web3 wallet found. Install MetaMask or Trust Wallet.', 'error');
      return;
    }
    try {
      const eth = (window as any).ethereum;
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      const chainId = await eth.request({ method: 'eth_chainId' });
      setWeb3({ address: accounts[0], chainId, connected: true });
      pushToast('Web3 wallet connected!', 'success');

      if (chainId !== BSC_CHAIN_ID) {
        try {
          await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BSC_CHAIN_ID }] });
        } catch (switchErr: any) {
          if (switchErr.code === 4902) {
            await eth.request({ method: 'wallet_addEthereumChain', params: [BSC_PARAMS] });
          }
        }
        const newChainId = await eth.request({ method: 'eth_chainId' });
        setWeb3((prev) => ({ ...prev, chainId: newChainId }));
      }
    } catch (err: any) {
      pushToast('Connection rejected by wallet.', 'error');
    }
  }, []);

  const disconnect = useCallback(() => {
    setWeb3({ address: null, chainId: null, connected: false });
    pushToast('Web3 wallet disconnected.', 'info');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    const eth = (window as any).ethereum;
    const handleAccounts = (accounts: string[]) => {
      if (accounts.length === 0) { setWeb3({ address: null, chainId: null, connected: false }); }
      else setWeb3((prev) => ({ ...prev, address: accounts[0] }));
    };
    const handleChain = (chainId: string) => setWeb3((prev) => ({ ...prev, chainId }));
    eth.on('accountsChanged', handleAccounts);
    eth.on('chainChanged', handleChain);
    return () => { eth.removeListener('accountsChanged', handleAccounts); eth.removeListener('chainChanged', handleChain); };
  }, []);

  return { web3, connect, disconnect };
}

function shortAddr(addr: string) { return addr.slice(0, 6) + '...' + addr.slice(-4); }

export default function Trade() {
  const acct = getTradeAccount();
  const [tab, setTab] = useState<Tab>('trade');
  const [pair, setPair] = useState<TradePair>('DNA_USDT');
  const [price, setPrice] = useState(0);
  const [trend, setTrend] = useState<number[]>([]);
  useStorageSync();

  useEffect(() => { seedTrend(); setPrice(getMarketPrice(pair)); setTrend([...getPriceTrend(pair)]); }, []);
  useInterval(() => { const p = getMarketPrice(pair); setPrice(p); setTrend([...getPriceTrend(pair)]); matchLimitOrders(pair, p); }, 1500);
  useEffect(() => { setPrice(getMarketPrice(pair)); setTrend([...getPriceTrend(pair)]); }, [pair]);

  if (!acct) return <CreateAccount />;

  const meta = PAIR_META[pair];

  return (
    <div className="min-h-screen bg-domain">
      <div className="sticky top-0 z-40 glass-strong border-b border-gold-500/20">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-gold-glow"><TrendingUp className="w-4 h-4 text-black" /></div>
            <div className="leading-none"><div className="font-display font-bold text-sm text-gold-400">Infinity Exchange</div><div className="text-[9px] text-zinc-500 tracking-wider uppercase">{meta.label} · BNB Chain</div></div>
          </div>
          <Web3Button />
        </div>
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 pb-2 overflow-x-auto no-scrollbar">
          {PAIRS.map((p) => (<button key={p} onClick={() => setPair(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${pair === p ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30' : 'text-zinc-500 border border-transparent'}`}>{PAIR_META[p].label}</button>))}
          <div className="w-px h-5 bg-ink-700 mx-1" />
          {(['trade', 'wallet', 'orders'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${tab === t ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30' : 'text-zinc-500 border border-transparent'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-5">
        <AnimatePresence mode="wait">
          {tab === 'trade' && <TradeView key="trade" pair={pair} price={price} trend={trend} />}
          {tab === 'wallet' && <WalletView key="wallet" />}
          {tab === 'orders' && <OrdersView key="orders" pair={pair} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Web3Button() {
  const { web3, connect, disconnect } = useWeb3Wallet();
  if (!web3.connected) return (
    <button onClick={connect} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-gold-400 to-gold-600 text-black text-xs font-bold shadow-gold-glow hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-shadow">
      <Wallet className="w-3.5 h-3.5" /> Connect Wallet
    </button>
  );
  const isBsc = web3.chainId === BSC_CHAIN_ID;
  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${isBsc ? 'bg-jade-500/10 text-jade-400 border-jade-500/30' : 'bg-blood-500/10 text-blood-400 border-blood-500/30'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isBsc ? 'bg-jade-400' : 'bg-blood-400'} animate-pulse`} />
        {isBsc ? 'BSC' : 'Wrong Network'}
      </div>
      <button onClick={disconnect} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-ink-800 border border-gold-500/25 text-gold-400 text-xs font-mono hover:border-gold-500/50 transition-colors">
        {shortAddr(web3.address!)}
      </button>
    </div>
  );
}

function CreateAccount() {
  const [passkey, setPasskey] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState<'intro' | 'form'>('intro');
  return (
    <div className="min-h-screen bg-domain flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full glass-strong rounded-3xl border border-gold-500/30 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-gold-glow"><ShieldCheck className="w-6 h-6 text-black" /></div>
          <div><h1 className="font-display font-bold text-lg text-white">Omni Trading Wallet</h1><p className="text-xs text-zinc-500">Secure separate trading account</p></div>
        </div>
        {step === 'intro' ? (
          <>
            <p className="text-sm text-zinc-400 leading-relaxed">The Infinity Exchange uses a separate <span className="text-gold-400 font-semibold">Omni Wallet</span> for safe deposits. Create a trading account with a private passkey — your game 🧬 DNA stays separate from your trading funds.</p>
            <ul className="mt-4 space-y-2 text-xs text-zinc-500">
              <li className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-gold-400" /> Funds locked behind your passkey</li>
              <li className="flex items-center gap-2"><ArrowDownToLine className="w-3.5 h-3.5 text-gold-400" /> Deposit 🧬 DNA / USDT / BNB / BTC / ETH to trade</li>
              <li className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-gold-400" /> 0.5% tax to liquidity pool</li>
              <li className="flex items-center gap-2"><Wifi className="w-3.5 h-3.5 text-gold-400" /> Connect MetaMask / Trust Wallet for BNB Chain</li>
            </ul>
            <button onClick={() => setStep('form')} className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-black font-bold text-sm shadow-gold-glow hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] transition-shadow">Create Trading Account</button>
          </>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (passkey.length < 4) { pushToast('Passkey too short (min 4 chars).', 'error'); return; } if (passkey !== confirm) { pushToast('Passkeys do not match.', 'error'); return; } createTradeAccount(passkey); pushToast('Omni wallet created!', 'success'); }} className="space-y-4">
            <div><label className="text-xs text-zinc-400 mb-1.5 block">Set Omni Passkey</label><div className="relative"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" /><input type="password" value={passkey} onChange={(e) => setPasskey(e.target.value)} placeholder="••••••" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm focus:border-gold-500/50 outline-none" /></div></div>
            <div><label className="text-xs text-zinc-400 mb-1.5 block">Confirm Passkey</label><div className="relative"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" /><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm focus:border-gold-500/50 outline-none" /></div></div>
            <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-black font-bold text-sm shadow-gold-glow">Confirm & Create</button>
          </form>
        )}
        <Link href="/" className="block text-center text-xs text-zinc-500 hover:text-zinc-300 mt-4">← Back to game</Link>
      </motion.div>
    </div>
  );
}

function TradeView({ pair, price, trend }: { pair: TradePair; price: number; trend: number[] }) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [mode, setMode] = useState<Mode>('spot');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState(price.toFixed(8));
  const acct = getTradeAccount();
  const meta = PAIR_META[pair];
  const book = useMemo(() => getOrderBook(pair, price), [pair, price]);
  const history = getTradeHistory().filter((h) => h.pair === pair);
  useStorageSync();
  useEffect(() => { setLimitPrice(price.toFixed(8)); }, [price]);

  const quoteBal = acct ? getQuoteBalance(acct, meta.quote) : 0;
  const total = (parseFloat(amount) || 0) * (orderType === 'limit' ? parseFloat(limitPrice) || 0 : price);
  const tax = total * TAX_RATE;
  const countryCode = getStoredCountry();
  const feeBreakdown = calculateTradeFee(total, countryCode);
  const activeRule = getTaxRule(countryCode);

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { pushToast('Enter a valid amount.', 'error'); return; }
    const px = orderType === 'limit' ? parseFloat(limitPrice) : price;
    const res = orderType === 'market' ? placeMarketOrder(pair, side, amt, px, mode) : placeLimitOrder(pair, side, amt, px);
    pushToast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) setAmount('');
  };
  if (!acct) return null;

  const fmtPrice = (p: number) => p < 0.01 ? p.toFixed(8) : p.toFixed(4);

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${price >= (trend[0] || price) ? 'text-jade-400 bg-jade-500/10' : 'text-blood-400 bg-blood-500/10'}`}>
                {price >= (trend[0] || price) ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />} {((price - (trend[0] || price)) / (trend[0] || price) * 100).toFixed(2)}%
              </span>
              <span className="font-mono text-2xl font-bold text-white">{fmtPrice(price)}</span>
            </div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{meta.label}</span>
          </div>
          <Sparkline data={trend} up={price >= (trend[0] || price)} />
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Order Book — {meta.label}</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="grid grid-cols-3 text-[10px] text-zinc-600 px-1"><span>Price</span><span className="text-right">Amount</span><span className="text-right">Total</span></div>
              {book.bids.map((b, i) => (<div key={i} className="grid grid-cols-3 text-xs font-mono px-1 py-0.5 relative"><div className="absolute inset-y-0 right-0 bg-jade-500/10 rounded" style={{ width: `${(b.amount / 550) * 100}%` }} /><span className="text-jade-400 relative">{fmtPrice(b.price)}</span><span className="text-right text-zinc-300 relative">{b.amount.toFixed(1)}</span><span className="text-right text-zinc-500 relative">{(b.price * b.amount).toFixed(2)}</span></div>))}
            </div>
            <div className="space-y-1">
              <div className="grid grid-cols-3 text-[10px] text-zinc-600 px-1"><span>Price</span><span className="text-right">Amount</span><span className="text-right">Total</span></div>
              {book.asks.map((a, i) => (<div key={i} className="grid grid-cols-3 text-xs font-mono px-1 py-0.5 relative"><div className="absolute inset-y-0 right-0 bg-blood-500/10 rounded" style={{ width: `${(a.amount / 550) * 100}%` }} /><span className="text-blood-400 relative">{fmtPrice(a.price)}</span><span className="text-right text-zinc-300 relative">{a.amount.toFixed(1)}</span><span className="text-right text-zinc-500 relative">{(a.price * a.amount).toFixed(2)}</span></div>))}
            </div>
          </div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Recent Trades — {meta.label}</div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {history.length === 0 ? <div className="text-sm text-zinc-600 text-center py-4">No trades yet.</div> :
              history.map((h) => (<div key={h.id} className="grid grid-cols-5 text-xs font-mono py-1"><span className={h.side === 'buy' ? 'text-jade-400' : 'text-blood-400'}>{h.side === 'buy' ? 'BUY' : 'SELL'}</span><span className="text-zinc-500 text-[9px]">{h.mode}</span><span className="text-zinc-300">{fmtPrice(h.price)}</span><span className="text-right text-zinc-400">{h.amount.toFixed(2)}</span><span className="text-right text-zinc-500">{h.total < 1 ? h.total.toFixed(6) : fmtUsd(h.total)}</span></div>))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="glass rounded-2xl p-4">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-ink-800 mb-3">
            <button onClick={() => setSide('buy')} className={`py-2 rounded-lg text-sm font-bold transition-all ${side === 'buy' ? 'bg-jade-500/20 text-jade-400 shadow-[0_0_12px_rgba(74,222,128,0.3)]' : 'text-zinc-500'}`}>Buy</button>
            <button onClick={() => setSide('sell')} className={`py-2 rounded-lg text-sm font-bold transition-all ${side === 'sell' ? 'bg-blood-500/20 text-blood-400 shadow-[0_0_12px_rgba(239,68,68,0.3)]' : 'text-zinc-500'}`}>Sell</button>
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-ink-800 mb-3">
            {(['spot', 'futures'] as Mode[]).map((m) => (<button key={m} onClick={() => setMode(m)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize ${mode === m ? 'bg-ink-700 text-gold-400' : 'text-zinc-500'}`}>{m}</button>))}
          </div>
          <div className="flex gap-2 mb-3 text-xs">
            {(['market', 'limit'] as const).map((t) => (<button key={t} onClick={() => setOrderType(t)} className={`px-3 py-1 rounded-lg font-semibold capitalize ${orderType === t ? 'bg-ink-700 text-white' : 'text-zinc-500'}`}>{t}</button>))}
          </div>
          <div className="flex justify-between text-[11px] text-zinc-500 mb-3"><span>Available:</span><span className="font-mono">{side === 'buy' ? `${fmt(quoteBal)} ${meta.quote}` : `${fmt(acct.dna)} 🧬 DNA`}</span></div>
          <div className="space-y-2.5">
            {orderType === 'limit' && <Field label={`Limit Price (${meta.quote})`} value={limitPrice} onChange={setLimitPrice} suffix={meta.quote} />}
            <Field label="Amount (🧬 DNA)" value={amount} onChange={setAmount} suffix="DNA" />
            <input type="range" min={0} max={100} step={5} onChange={(e) => { const pct = Number(e.target.value) / 100; const max = side === 'buy' ? quoteBal / price : acct.dna; setAmount((max * pct).toFixed(2)); }} className="w-full accent-gold-500" />
          </div>
          <div className="mt-4 pt-3 border-t border-ink-700 space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-500"><span>Total</span><span className="font-mono text-white">{total < 1 ? total.toFixed(8) : fmtUsd(total)}</span></div>
            <div className="flex items-center justify-between text-zinc-500"><span className="flex items-center gap-1">Platform Fee ({(activeRule.platformFee * 100).toFixed(2)}%)</span><span className="font-mono text-curse-300">{feeBreakdown.platformRevenue < 1 ? feeBreakdown.platformRevenue.toFixed(8) : fmtUsd(feeBreakdown.platformRevenue)}</span></div>
            <div className="flex items-center justify-between text-zinc-500"><span className="flex items-center gap-1">Regional Tax ({(activeRule.taxRate * 100).toFixed(2)}%) <span className="text-[9px] text-zinc-600">{activeRule.flag}</span></span><span className="font-mono text-gold-400">{feeBreakdown.complianceTax < 1 ? feeBreakdown.complianceTax.toFixed(8) : fmtUsd(feeBreakdown.complianceTax)}</span></div>
            <div className="flex justify-between text-zinc-400 font-bold"><span>Total Fee</span><span className="font-mono text-blood-400">{feeBreakdown.totalFee < 1 ? feeBreakdown.totalFee.toFixed(8) : fmtUsd(feeBreakdown.totalFee)}</span></div>
            <div className="flex justify-between text-zinc-400"><span>{side === 'buy' ? 'Cost' : 'You receive'}</span><span className="font-mono text-white">{(side === 'buy' ? total + feeBreakdown.totalFee : total - feeBreakdown.totalFee) < 1 ? (side === 'buy' ? total + feeBreakdown.totalFee : total - feeBreakdown.totalFee).toFixed(8) : fmtUsd(side === 'buy' ? total + feeBreakdown.totalFee : total - feeBreakdown.totalFee)}</span></div>
          </div>
          <button onClick={submit} className={`w-full mt-4 py-3 rounded-xl font-bold text-sm transition-all ${side === 'buy' ? 'bg-gradient-to-r from-jade-500 to-jade-600 text-white shadow-[0_0_20px_rgba(74,222,128,0.4)]' : 'bg-gradient-to-r from-blood-500 to-blood-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}>{side === 'buy' ? 'Buy' : 'Sell'} 🧬 DNA</button>
          {mode === 'futures' && <div className="mt-2 text-[10px] text-gold-400/60 flex items-center gap-1"><Zap className="w-3 h-3" /> Futures mode: leveraged trading with regional fees per position.</div>}
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-zinc-600"><Globe className="w-3 h-3" /> Region: {activeRule.flag} {activeRule.country} · Total fee: {((activeRule.platformFee + activeRule.taxRate) * 100).toFixed(2)}%</div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3"><Wallet className="w-4 h-4 text-gold-400" /><span className="text-xs text-zinc-500 uppercase tracking-wider">Omni Wallet</span></div>
          <div className="space-y-2">
            <BalanceRow icon={Coins} label="🧬 DNA" value={fmt(acct.dna)} color="text-gold-400" />
            <BalanceRow icon={Wallet} label="USDT" value={fmt(acct.usdt)} color="text-energy-400" />
            <BalanceRow icon={Wallet} label="BNB" value={fmt(acct.bnb)} color="text-gold-500" />
            <BalanceRow icon={Wallet} label="BTC" value={fmt(acct.btc)} color="text-gold-500" />
            <BalanceRow icon={Wallet} label="ETH" value={fmt(acct.eth)} color="text-curse-300" />
          </div>
          <div className="mt-3 text-[10px] text-zinc-600 font-mono">{acct.id}</div>
        </div>
      </div>
    </div>
  );
}

function WalletView() {
  const [unlocked, setUnlocked] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [showPolicy, setShowPolicy] = useState(false);
  const [currency, setCurrency] = useState<string>('dna');
  const [amount, setAmount] = useState('');
  const gameDna = useDnaBalance();
  const acct = getTradeAccount();
  useStorageSync();
  if (!acct) return null;

  const currencies = ['dna', 'usdt', 'bnb', 'btc', 'eth'];

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { pushToast('Enter a valid amount.', 'error'); return; }
    const res = mode === 'deposit' ? depositToTrade(currency, amt) : withdrawFromTrade(currency, amt);
    pushToast(res.msg, res.ok ? 'success' : 'error');
    if (res.ok) setAmount('');
  };

  if (!unlocked) return (
    <div className="max-w-sm mx-auto glass-strong rounded-3xl border border-gold-500/30 p-6 mt-8">
      <div className="flex items-center gap-3 mb-5"><div className="w-11 h-11 rounded-2xl bg-gold-500/15 flex items-center justify-center"><Lock className="w-5 h-5 text-gold-400" /></div><div><h2 className="font-display font-bold text-white">Unlock Omni Wallet</h2><p className="text-xs text-zinc-500">Enter your passkey</p></div></div>
      <input type="password" value={passkey} onChange={(e) => setPasskey(e.target.value)} placeholder="••••••" className="w-full px-4 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm focus:border-gold-500/50 outline-none" />
      <button onClick={() => { if (passkey === acct.passkey) { setUnlocked(true); pushToast('Wallet unlocked.', 'success'); } else pushToast('Wrong passkey.', 'error'); }} className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-black font-bold text-sm">Unlock</button>
    </div>
  );

  const getBal = (c: string) => (acct as unknown as Record<string, number>)[c] ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4 text-gold-400" /><span className="text-xs text-zinc-500 uppercase tracking-wider">Omni Wallet Balances</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[{ k: 'dna', l: '🧬 DNA', c: 'text-gold-400' }, { k: 'usdt', l: 'USDT', c: 'text-energy-400' }, { k: 'bnb', l: 'BNB', c: 'text-gold-500' }, { k: 'btc', l: 'BTC', c: 'text-gold-500' }, { k: 'eth', l: 'ETH', c: 'text-curse-300' }].map((b) => (
            <div key={b.k} className="rounded-xl bg-ink-800 p-3 border border-ink-700"><div className="text-[10px] text-zinc-500 uppercase">{b.l}</div><div className={`font-mono font-bold text-lg ${b.c}`}>{fmt(getBal(b.k))}</div></div>
          ))}
        </div>
        <div className="mt-3 text-[10px] text-zinc-600 flex justify-between"><span>Hardware vault: {fmt(gameDna)} 🧬 DNA</span><span className="font-mono">{acct.id}</span></div>
      </div>
      <div className="glass rounded-2xl p-4">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-ink-800 mb-4">
          <button onClick={() => setMode('deposit')} className={`py-2 rounded-lg text-sm font-bold ${mode === 'deposit' ? 'bg-jade-500/20 text-jade-400' : 'text-zinc-500'}`}><ArrowDownToLine className="w-4 h-4 inline mr-1" /> Deposit</button>
          <button onClick={() => setMode('withdraw')} className={`py-2 rounded-lg text-sm font-bold ${mode === 'withdraw' ? 'bg-blood-500/20 text-blood-400' : 'text-zinc-500'}`}><ArrowUpFromLine className="w-4 h-4 inline mr-1" /> Withdraw</button>
        </div>
        <div className="flex gap-2 mb-3 flex-wrap">{currencies.map((c) => (<button key={c} onClick={() => setCurrency(c)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase ${currency === c ? 'bg-ink-700 text-white' : 'text-zinc-500'}`}>{c === 'dna' ? '🧬 DNA' : c}</button>))}</div>
        <Field label={`Amount (${currency === 'dna' ? '🧬 DNA' : currency.toUpperCase()})`} value={amount} onChange={setAmount} suffix={currency === 'dna' ? 'DNA' : currency.toUpperCase()} />
        {mode === 'deposit' && currency === 'dna' && <div className="text-[11px] text-zinc-500 mt-2">From hardware vault (available: {fmt(gameDna)} 🧬 DNA)</div>}
        {mode === 'withdraw' && currency === 'dna' && <div className="text-[11px] text-zinc-500 mt-2">To hardware vault (available in Omni: {fmt(acct.dna)} 🧬 DNA)</div>}
        {mode === 'withdraw' && currency === 'dna' && <button onClick={() => setShowPolicy(true)} className="w-full mt-2 py-2 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-semibold flex items-center justify-center gap-1.5"><Lock className="w-3.5 h-3.5" /> 🧬 DNA External Withdrawal Locked — Read Policy</button>}
        {currency !== 'dna' && <div className="text-[11px] text-zinc-500 mt-2">{mode === 'deposit' ? `${currency.toUpperCase()} is deposited as external funds to your Omni wallet.` : `Withdraw ${currency.toUpperCase()} from your Omni wallet.`}</div>}
        <button onClick={submit} className={`w-full mt-4 py-3 rounded-xl font-bold text-sm ${mode === 'deposit' ? 'bg-gradient-to-r from-jade-500 to-jade-600 text-white' : 'bg-gradient-to-r from-blood-500 to-blood-600 text-white'}`}>{mode === 'deposit' ? 'Deposit' : 'Withdraw'} {currency === 'dna' ? '🧬 DNA' : currency.toUpperCase()}</button>
      </div>
      <DnaPolicyModal isOpen={showPolicy} onClose={() => setShowPolicy(false)} />
    </div>
  );
}

function OrdersView({ pair }: { pair: TradePair }) {
  const orders = getOrders().filter((o) => o.pair === pair);
  const history = getTradeHistory().filter((h) => h.pair === pair);
  useStorageSync();
  const meta = PAIR_META[pair];
  const fmtPrice = (p: number) => p < 0.01 ? p.toFixed(8) : p.toFixed(4);
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Open Orders — {meta.label}</div>
        {orders.length === 0 ? <div className="text-sm text-zinc-600 text-center py-6">No open orders.</div> :
          <div className="space-y-2">{orders.map((o) => (<div key={o.id} className="flex items-center justify-between rounded-xl bg-ink-800 p-3"><div className="flex items-center gap-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${o.side === 'buy' ? 'text-jade-400 bg-jade-500/10' : 'text-blood-400 bg-blood-500/10'}`}>{o.side === 'buy' ? 'BUY' : 'SELL'}</span><div className="text-sm"><span className="text-white font-mono">{o.amount} 🧬 DNA</span><span className="text-zinc-500 text-xs ml-2">@ {fmtPrice(o.price)}</span></div></div><button onClick={() => { cancelOrder(o.id); pushToast('Order cancelled.', 'info'); }} className="text-zinc-500 hover:text-blood-400"><X className="w-4 h-4" /></button></div>))}</div>}
      </div>
      <div className="glass rounded-2xl p-4">
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Order History — {meta.label}</div>
        {history.length === 0 ? <div className="text-sm text-zinc-600 text-center py-6">No completed trades.</div> :
          <div className="space-y-1">{history.map((h) => (<div key={h.id} className="grid grid-cols-6 gap-2 text-xs font-mono py-2 border-b border-ink-700/50"><span className={h.side === 'buy' ? 'text-jade-400' : 'text-blood-400'}>{h.side.toUpperCase()}</span><span className="text-zinc-500 text-[9px]">{h.mode}</span><span className="text-zinc-300">{fmtPrice(h.price)}</span><span className="text-zinc-400">{h.amount.toFixed(2)}</span><span className="text-zinc-500">{h.total < 1 ? h.total.toFixed(6) : fmtUsd(h.total)}</span><span className="text-blood-400">{h.tax < 1 ? h.tax.toFixed(8) : fmtUsd(h.tax)}</span></div>))}</div>}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix: string }) {
  return (<div><label className="text-[11px] text-zinc-500 mb-1 block">{label}</label><div className="relative"><input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0.00" className="w-full px-3 py-2.5 pr-14 rounded-xl bg-ink-800 border border-ink-700 text-white text-sm font-mono focus:border-gold-500/50 outline-none" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 font-semibold">{suffix}</span></div></div>);
}
function BalanceRow({ icon: Icon, label, value, color }: { icon: typeof Coins; label: string; value: string; color: string }) {
  return (<div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-sm text-zinc-400"><Icon className={`w-3.5 h-3.5 ${color}`} /> {label}</span><span className={`font-mono font-semibold ${color}`}>{value}</span></div>);
}
function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const w = 600, h = 140;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  const color = up ? '#4ade80' : '#f87171';
  return (<svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32 chart-grid rounded-lg" preserveAspectRatio="none"><defs><linearGradient id="spark" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.35" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs><polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#spark)" /><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /></svg>);
}
