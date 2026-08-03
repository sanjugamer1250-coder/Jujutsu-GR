import { useToasts } from '@/lib/ui';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

export function ToastHost() {
  const toasts = useToasts();
  return (
    <div className="fixed top-16 inset-x-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => {
        const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? XCircle : Info;
        const color = t.kind === 'success' ? 'text-jade-400 border-jade-500/40 shadow-[0_0_16px_rgba(74,222,128,0.3)]'
          : t.kind === 'error' ? 'text-blood-400 border-blood-500/40 shadow-[0_0_16px_rgba(239,68,68,0.3)]'
          : 'text-energy-400 border-energy-500/40 shadow-energy-glow';
        return (
          <div key={t.id} className={`glass-strong border ${color} rounded-xl px-4 py-2.5 flex items-center gap-2 animate-[float_0.3s_ease-out]`}>
            <Icon className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium text-zinc-100">{t.text}</span>
          </div>
        );
      })}
    </div>
  );
}
