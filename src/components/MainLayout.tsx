import { useLocation } from 'wouter';
import { Header, BottomNav, SideNav } from '@/components/Navigation';
import { ToastHost } from '@/components/ToastHost';

const HIDDEN_NAV_PREFIXES = ['/battle/', '/moba/'];
const HIDDEN_NAV_EXACT = ['/trade', '/admin', '/referrals', '/clans', '/raid', '/arena', '/ledger', '/tengen-ai', '/support', '/kyc', '/register', '/faq', '/moba', '/roster', '/ranks'];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const hideNav = HIDDEN_NAV_EXACT.includes(location) || HIDDEN_NAV_PREFIXES.some((p) => location.startsWith(p));

  return (
    <div className="min-h-screen bg-domain">
      <div className="min-h-screen bg-grid">
        <Header />
        {!hideNav && <SideNav />}
        <main className={`${hideNav ? '' : 'sm:pl-16'} pb-20 sm:pb-0`}>{children}</main>
        {!hideNav && <BottomNav />}
        <ToastHost />
      </div>
    </div>
  );
}
