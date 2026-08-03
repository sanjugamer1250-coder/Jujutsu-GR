import { useEffect, useRef, useState } from 'react';

export function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(digits) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(digits) + 'K';
  return n.toFixed(digits);
}

export function fmtUsd(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function useInterval(cb: () => void, ms: number): void {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    const id = setInterval(() => ref.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

export interface Toast { id: number; text: string; kind: 'success' | 'error' | 'info'; }

let toastSeq = 0;
const listeners = new Set<(t: Toast[]) => void>();
let queue: Toast[] = [];

export function pushToast(text: string, kind: Toast['kind'] = 'info'): void {
  const t: Toast = { id: ++toastSeq, text, kind };
  queue = [...queue, t];
  listeners.forEach((l) => l(queue));
  setTimeout(() => {
    queue = queue.filter((x) => x.id !== t.id);
    listeners.forEach((l) => l(queue));
  }, 2600);
}

export function useToasts(): Toast[] {
  const [items, setItems] = useState<Toast[]>(queue);
  useEffect(() => {
    const l = (q: Toast[]) => setItems(q);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return items;
}
